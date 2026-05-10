import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://ghetto.finance";

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    "Vary": "Origin",
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET") {
      const { data: kyc } = await supabase
        .from("kyc_verifications")
        .select("id, status, document_type, submitted_at, reviewed_at, reviewer_notes")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return new Response(JSON.stringify({ success: true, data: kyc }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { document_type } = body;

      if (!document_type) {
        return new Response(JSON.stringify({ error: "document_type is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing } = await supabase
        .from("kyc_verifications")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["pending", "approved", "manual_review"])
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({
          error: "A KYC verification is already in progress or approved",
          existing,
        }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const kycProviderName = Deno.env.get("KYC_PROVIDER_NAME") ?? "sandbox";
      const kycEnvironment = Deno.env.get("KYC_ENVIRONMENT") ?? "sandbox";

      let externalVerificationId = `kyc_sandbox_${crypto.randomUUID().replace(/-/g, "")}`;

      if (kycEnvironment === "production" && Deno.env.get("KYC_API_KEY")) {
        const kycResponse = await fetch(`${Deno.env.get("KYC_PROVIDER_BASE_URL")}/v1/inquiries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("KYC_API_KEY")}`,
          },
          body: JSON.stringify({
            reference_id: user.id,
            template_id: Deno.env.get("KYC_TEMPLATE_ID"),
          }),
        });

        if (kycResponse.ok) {
          const kycData = await kycResponse.json() as { id?: string };
          externalVerificationId = kycData.id ?? externalVerificationId;
        }
      }

      const { data: kyc, error: insertError } = await supabase
        .from("kyc_verifications")
        .insert({
          user_id: user.id,
          kyc_provider: kycProviderName,
          external_verification_id: externalVerificationId,
          document_type,
          status: kycEnvironment === "sandbox" ? "approved" : "pending",
          submitted_at: new Date().toISOString(),
          reviewed_at: kycEnvironment === "sandbox" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (kycEnvironment === "sandbox") {
        const { data: existingCard } = await supabase
          .from("issued_cards")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingCard) {
          const { data: newCard } = await supabase
            .from("issued_cards")
            .insert({
              user_id: user.id,
              card_type: "virtual",
              card_status: "active",
              card_token: `tok_sandbox_${crypto.randomUUID().replace(/-/g, "")}`,
              last_four: "4242",
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
                user_id: user.id,
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

      return new Response(JSON.stringify({ success: true, data: kyc }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
