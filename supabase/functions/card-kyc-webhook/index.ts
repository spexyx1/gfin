import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://ghetto.finance";

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    "Vary": "Origin",
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const webhookSecret = Deno.env.get("KYC_WEBHOOK_SECRET") ?? "";
    const signatureHeader = req.headers.get("X-Webhook-Signature") ?? "";

    // Fail-closed: if a secret is configured, a signature header is mandatory
    if (webhookSecret) {
      if (!signatureHeader) {
        return new Response(JSON.stringify({ error: "Missing webhook signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.text();
      const encoder = new TextEncoder();
      const keyData = encoder.encode(webhookSecret);
      const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
      const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

      if (signatureHeader !== expectedSig) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payload = JSON.parse(body) as {
        inquiry_id?: string;
        reference_id?: string;
        status?: string;
        attributes?: { status?: string };
      };

      return await processKycWebhook(supabase, payload, corsHeaders);
    }

    const payload = await req.json() as {
      inquiry_id?: string;
      reference_id?: string;
      status?: string;
      attributes?: { status?: string };
    };

    return await processKycWebhook(supabase, payload, corsHeaders);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

async function processKycWebhook(
  supabase: ReturnType<typeof createClient>,
  payload: { inquiry_id?: string; reference_id?: string; status?: string; attributes?: { status?: string } },
  corsHeaders: Record<string, string>
) {
  const externalId = payload.inquiry_id ?? "";
  const userId = payload.reference_id ?? "";
  const rawStatus = payload.status ?? payload.attributes?.status ?? "pending";

  const statusMap: Record<string, string> = {
    approved: "approved",
    passed: "approved",
    declined: "rejected",
    failed: "rejected",
    needs_review: "manual_review",
    created: "pending",
    pending: "pending",
    expired: "expired",
  };
  const mappedStatus = statusMap[rawStatus.toLowerCase()] ?? "manual_review";

  if (!externalId) {
    return new Response(JSON.stringify({ error: "Missing inquiry_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: kyc, error: updateError } = await supabase
    .from("kyc_verifications")
    .update({
      status: mappedStatus,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("external_verification_id", externalId)
    .select("id, user_id, status")
    .maybeSingle();

  if (updateError) throw updateError;

  if (kyc && mappedStatus === "approved" && userId) {
    const { data: existingCard } = await supabase
      .from("issued_cards")
      .select("id")
      .eq("user_id", kyc.user_id)
      .maybeSingle();

    if (!existingCard) {
      const { data: newCard } = await supabase
        .from("issued_cards")
        .insert({
          user_id: kyc.user_id,
          card_type: "virtual",
          card_status: "active",
          card_token: `tok_${crypto.randomUUID().replace(/-/g, "")}`,
          last_four: "0000",
          expiry_month: 12,
          expiry_year: new Date().getFullYear() + 3,
          is_activated: true,
          issued_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newCard) {
        await supabase
          .from("card_accounts")
          .insert({
            user_id: kyc.user_id,
            card_id: newCard.id,
            account_type: "debit",
            account_status: "active",
            available_balance: 0.00,
            pending_balance: 0.00,
            ledger_balance: 0.00,
          });
      }
    }
  }

  return new Response(JSON.stringify({ success: true, kyc_id: kyc?.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
