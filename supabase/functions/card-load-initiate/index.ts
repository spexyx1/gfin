import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://ghetto.finance";

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
      const { data: loads } = await supabase
        .from("card_loads")
        .select("id, source_type, source_asset, usd_amount, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ success: true, data: loads ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as {
      account_id: string;
      source_type: string;
      source_asset?: string;
      source_amount?: number;
      usd_amount: number;
      conversion_rate?: number;
    };

    const { account_id, source_type, usd_amount } = body;

    if (!account_id || !source_type || !usd_amount) {
      return new Response(JSON.stringify({ error: "account_id, source_type, and usd_amount are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["crypto_wallet", "bank_transfer"].includes(source_type)) {
      return new Response(JSON.stringify({ error: "source_type must be crypto_wallet or bank_transfer" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: account } = await supabase
      .from("card_accounts")
      .select("id, user_id, account_status")
      .eq("id", account_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (account.account_status !== "active") {
      return new Response(JSON.stringify({ error: "Account is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: config } = await supabase
      .from("card_program_config")
      .select("per_transaction_load_limit_usd, daily_load_limit_usd, monthly_load_limit_usd")
      .limit(1)
      .maybeSingle();

    if (config) {
      if (usd_amount > config.per_transaction_load_limit_usd) {
        return new Response(JSON.stringify({
          error: `Amount exceeds per-transaction limit of $${config.per_transaction_load_limit_usd}`,
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: dailyLoads } = await supabase
        .from("card_loads")
        .select("usd_amount")
        .eq("user_id", user.id)
        .eq("account_id", account_id)
        .in("status", ["completed", "processing", "pending"])
        .gte("created_at", today.toISOString());

      const dailyTotal = (dailyLoads ?? []).reduce((sum, l) => sum + Number(l.usd_amount), 0);
      if (dailyTotal + usd_amount > config.daily_load_limit_usd) {
        return new Response(JSON.stringify({
          error: `Daily load limit of $${config.daily_load_limit_usd} would be exceeded`,
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const environment = Deno.env.get("CARD_PROCESSOR_ENV") ?? "sandbox";
    let processorLoadId = `load_sandbox_${crypto.randomUUID().replace(/-/g, "")}`;
    let loadStatus = "completed";

    if (environment === "production" && Deno.env.get("CARD_PROCESSOR_API_KEY")) {
      const { data: card } = await supabase
        .from("issued_cards")
        .select("card_token")
        .eq("id", account.id)
        .maybeSingle();

      if (card) {
        const processorResponse = await fetch(
          `${Deno.env.get("CARD_PROCESSOR_BASE_URL")}/v1/fundingsources/${card.card_token}/load`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${btoa(`${Deno.env.get("CARD_PROCESSOR_API_KEY")}:${Deno.env.get("CARD_PROCESSOR_API_SECRET")}`)}`,
            },
            body: JSON.stringify({ amount: usd_amount, currency_code: "USD" }),
          }
        );

        if (processorResponse.ok) {
          const procData = await processorResponse.json() as { load_id?: string; status?: string };
          processorLoadId = procData.load_id ?? processorLoadId;
          loadStatus = procData.status === "completed" ? "completed" : "processing";
        } else {
          loadStatus = "pending";
        }
      }
    }

    const { data: load, error: insertError } = await supabase
      .from("card_loads")
      .insert({
        user_id: user.id,
        account_id,
        source_type,
        source_asset: body.source_asset ?? "",
        source_amount: body.source_amount ?? usd_amount,
        usd_amount,
        conversion_rate: body.conversion_rate ?? 1,
        processor_load_id: processorLoadId,
        status: loadStatus,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Use atomic RPC to increment balance — avoids read-modify-write race condition
    if (loadStatus === "completed") {
      await supabase.rpc("increment_card_balance", {
        p_account_id: account_id,
        p_amount: usd_amount,
      });
    }

    return new Response(JSON.stringify({ success: true, data: load }), {
      status: 201,
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
