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

const GAS_STATION_MCCS = ["5541", "5542", "5983"];

interface AuthRequest {
  processor_transaction_id: string;
  card_token: string;
  merchant_name: string;
  merchant_mcc: string;
  merchant_city?: string;
  merchant_state?: string;
  merchant_country?: string;
  amount: number;
  currency: string;
  authorization_code?: string;
}

interface FraudRule {
  id: string;
  rule_name: string;
  rule_type: string;
  parameters: Record<string, unknown>;
  action: string;
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

    const authPayload = await req.json() as AuthRequest;
    const { processor_transaction_id, card_token, merchant_mcc, amount } = authPayload;

    if (!processor_transaction_id || !card_token || amount === undefined) {
      return new Response(JSON.stringify({ decision: "decline", reason: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: card } = await supabase
      .from("issued_cards")
      .select("id, user_id, card_status, is_activated, expiry_month, expiry_year, activated_at")
      .eq("card_token", card_token)
      .maybeSingle();

    if (!card) {
      return new Response(JSON.stringify({ decision: "decline", reason: "Card not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (card.card_status === "frozen") {
      return new Response(JSON.stringify({ decision: "decline", reason: "Card frozen" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (card.card_status !== "active" || !card.is_activated) {
      return new Response(JSON.stringify({ decision: "decline", reason: "Card not active" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    if (card.expiry_year < now.getFullYear() ||
      (card.expiry_year === now.getFullYear() && card.expiry_month < now.getMonth() + 1)) {
      return new Response(JSON.stringify({ decision: "decline", reason: "Card expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: account } = await supabase
      .from("card_accounts")
      .select("id, available_balance, account_status")
      .eq("card_id", card.id)
      .eq("account_status", "active")
      .maybeSingle();

    if (!account) {
      return new Response(JSON.stringify({ decision: "decline", reason: "Account not found or frozen" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (account.available_balance < amount) {
      await logDeclinedTransaction(supabase, card, account, authPayload, "Insufficient funds");
      return new Response(JSON.stringify({ decision: "decline", reason: "Insufficient funds" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: fraudRules } = await supabase
      .from("fraud_rules")
      .select("id, rule_name, rule_type, parameters, action")
      .eq("is_enabled", true);

    if (fraudRules) {
      for (const rule of fraudRules as FraudRule[]) {
        const triggerResult = await evaluateFraudRule(supabase, rule, card, authPayload);
        if (triggerResult.triggered) {
          await supabase.from("fraud_events").insert({
            card_id: card.id,
            rule_id: rule.id,
            rule_name: rule.rule_name,
            action_taken: rule.action,
            event_details: {
              merchant_name: authPayload.merchant_name,
              merchant_mcc: authPayload.merchant_mcc,
              amount: authPayload.amount,
              currency: authPayload.currency,
              reason: triggerResult.reason,
            },
          });

          if (rule.action === "decline") {
            await logDeclinedTransaction(supabase, card, account, authPayload, `Fraud rule: ${rule.rule_name}`);
            return new Response(JSON.stringify({ decision: "decline", reason: "Transaction declined by fraud rule" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          if (rule.action === "freeze_card") {
            await supabase
              .from("issued_cards")
              .update({ card_status: "frozen", updated_at: now.toISOString() })
              .eq("id", card.id);
            await logDeclinedTransaction(supabase, card, account, authPayload, `Card frozen: ${rule.rule_name}`);
            return new Response(JSON.stringify({ decision: "decline", reason: "Card suspended for security review" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
    }

    const isGasStation = GAS_STATION_MCCS.includes(merchant_mcc ?? "");
    const { data: config } = await supabase
      .from("card_program_config")
      .select("merchant_fee_cap, gas_station_rate, base_interchange_rate")
      .limit(1)
      .maybeSingle();

    const feeRate = isGasStation
      ? (config?.gas_station_rate ?? 0.009)
      : (config?.merchant_fee_cap ?? 0.015);
    const platformFee = parseFloat((amount * feeRate).toFixed(4));
    const interchangeFee = parseFloat((amount * (config?.base_interchange_rate ?? 0.015)).toFixed(4));

    const { data: transaction } = await supabase
      .from("card_transactions")
      .insert({
        card_id: card.id,
        account_id: account.id,
        merchant_name: authPayload.merchant_name ?? "",
        merchant_mcc: merchant_mcc ?? "",
        merchant_city: authPayload.merchant_city ?? "",
        merchant_state: authPayload.merchant_state ?? "",
        authorization_amount: amount,
        interchange_fee_collected: interchangeFee,
        platform_fee_collected: platformFee,
        net_fee_to_platform: platformFee,
        transaction_status: "authorized",
        authorization_code: authPayload.authorization_code ?? `AUTH${Date.now()}`,
        is_gas_station: isGasStation,
        processor_transaction_id,
        authorized_at: now.toISOString(),
      })
      .select("id")
      .single();

    await supabase.rpc("decrement_card_balance", {
      p_account_id: account.id,
      p_amount: amount,
    });

    return new Response(JSON.stringify({
      decision: "approve",
      transaction_id: transaction?.id,
      approved_amount: amount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ decision: "decline", error: message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});

async function logDeclinedTransaction(
  supabase: ReturnType<typeof createClient>,
  card: { id: string },
  account: { id: string },
  auth: AuthRequest,
  reason: string
) {
  await supabase.from("card_transactions").insert({
    card_id: card.id,
    account_id: account.id,
    merchant_name: auth.merchant_name ?? "",
    merchant_mcc: auth.merchant_mcc ?? "",
    authorization_amount: auth.amount,
    transaction_status: "declined",
    processor_transaction_id: auth.processor_transaction_id,
    declined_reason: reason,
    is_gas_station: GAS_STATION_MCCS.includes(auth.merchant_mcc ?? ""),
    authorized_at: new Date().toISOString(),
  });
}

async function evaluateFraudRule(
  supabase: ReturnType<typeof createClient>,
  rule: FraudRule,
  card: { id: string; activated_at: string | null },
  auth: AuthRequest
): Promise<{ triggered: boolean; reason: string }> {
  const params = rule.parameters as Record<string, unknown>;

  if (rule.rule_type === "amount") {
    const maxAmount = params.max_amount as number;
    if (auth.amount > maxAmount) {
      return { triggered: true, reason: `Amount ${auth.amount} exceeds limit ${maxAmount}` };
    }
  }

  if (rule.rule_type === "velocity") {
    const windowMinutes = params.window_minutes as number ?? 60;
    const maxCount = params.max_count as number ?? 5;
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const mccCodes = params.mcc_codes as string[] | undefined;

    let query = supabase
      .from("card_transactions")
      .select("id", { count: "exact" })
      .eq("card_id", card.id)
      .gte("authorized_at", windowStart);

    if (mccCodes) {
      query = query.in("merchant_mcc", mccCodes);
    }

    if (params.event_type === "decline") {
      query = query.eq("transaction_status", "declined");
    }

    const { count } = await query;
    if ((count ?? 0) >= maxCount) {
      return { triggered: true, reason: `Velocity rule: ${count} events in ${windowMinutes} minutes` };
    }
  }

  if (rule.rule_type === "pattern") {
    const minAmount = params.min_amount as number;
    const hoursSinceActivation = params.hours_since_activation as number;
    if (card.activated_at && minAmount && hoursSinceActivation) {
      const activatedAt = new Date(card.activated_at);
      const hoursDiff = (Date.now() - activatedAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff < hoursSinceActivation && auth.amount > minAmount) {
        return { triggered: true, reason: `Large transaction within ${hoursSinceActivation}h of activation` };
      }
    }
  }

  return { triggered: false, reason: "" };
}
