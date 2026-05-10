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

interface ProcessorConfig {
  processorName: string;
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  environment: string;
}

function getProcessorConfig(): ProcessorConfig {
  return {
    processorName: Deno.env.get("CARD_PROCESSOR_NAME") ?? "sandbox",
    baseUrl: Deno.env.get("CARD_PROCESSOR_BASE_URL") ?? "https://sandbox.processor.example.com",
    apiKey: Deno.env.get("CARD_PROCESSOR_API_KEY") ?? "",
    apiSecret: Deno.env.get("CARD_PROCESSOR_API_SECRET") ?? "",
    environment: Deno.env.get("CARD_PROCESSOR_ENV") ?? "sandbox",
  };
}

async function callProcessor(
  config: ProcessorConfig,
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  if (config.environment === "sandbox" || !config.apiKey) {
    return buildSandboxResponse(method, path, body);
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${btoa(`${config.apiKey}:${config.apiSecret}`)}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Processor request failed with status ${response.status}`);
  }

  return response.json();
}

function buildSandboxResponse(method: string, path: string, body: unknown): unknown {
  const now = new Date().toISOString();
  const token = `tok_sandbox_${crypto.randomUUID().replace(/-/g, "")}`;

  if (path.includes("/cards") && method === "POST") {
    return {
      card_token: token,
      last_four: "4242",
      expiry_month: 12,
      expiry_year: new Date().getFullYear() + 3,
      status: "active",
      created: now,
    };
  }

  if (path.includes("/freeze")) {
    return { status: "frozen", updated: now };
  }

  if (path.includes("/unfreeze") || path.includes("/activate")) {
    return { status: "active", updated: now };
  }

  if (path.includes("/load")) {
    return {
      load_id: `load_sandbox_${crypto.randomUUID().replace(/-/g, "")}`,
      status: "completed",
      created: now,
    };
  }

  if (path.includes("/balance")) {
    return { available: 0.00, pending: 0.00, ledger: 0.00, currency: "USD" };
  }

  if (path.includes("/pan")) {
    return {
      pan: "4242424242424242",
      cvv: "123",
      expiry_month: 12,
      expiry_year: new Date().getFullYear() + 3,
    };
  }

  return { success: true, sandbox: true, path, method };
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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = req.method !== "GET" ? await req.json() : {};
    const config = getProcessorConfig();

    let result: unknown;

    switch (action) {
      case "issue_virtual_card": {
        result = await callProcessor(config, "POST", "/v1/cards", {
          user_token: user.id,
          card_product_token: Deno.env.get("CARD_PRODUCT_TOKEN") ?? "sandbox_product",
          fulfillment: { card_personalization: { text: { line1: { value: body.cardholder_name ?? "CARDHOLDER" } } } },
        });
        break;
      }

      case "freeze_card": {
        const { card_token } = body;
        if (!card_token) throw new Error("card_token required");
        result = await callProcessor(config, "POST", `/v1/cards/${card_token}/freeze`, {});
        break;
      }

      case "unfreeze_card": {
        const { card_token } = body;
        if (!card_token) throw new Error("card_token required");
        result = await callProcessor(config, "POST", `/v1/cards/${card_token}/unfreeze`, {});
        break;
      }

      case "get_pan": {
        const { card_token } = body;
        if (!card_token) throw new Error("card_token required");

        const { data: card } = await supabase
          .from("issued_cards")
          .select("user_id")
          .eq("card_token", card_token)
          .maybeSingle();

        if (!card || card.user_id !== user.id) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = await callProcessor(config, "GET", `/v1/cards/${card_token}/pan`, {});
        break;
      }

      case "get_balance": {
        const { account_id } = body;
        if (!account_id) throw new Error("account_id required");

        const { data: account } = await supabase
          .from("card_accounts")
          .select("available_balance, pending_balance, ledger_balance")
          .eq("id", account_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!account) {
          return new Response(JSON.stringify({ error: "Account not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = {
          available: account.available_balance,
          pending: account.pending_balance,
          ledger: account.ledger_balance,
          currency: "USD",
        };
        break;
      }

      case "load_funds": {
        const { card_token, amount_usd } = body;
        if (!card_token || !amount_usd) throw new Error("card_token and amount_usd required");
        result = await callProcessor(config, "POST", `/v1/fundingsources/${card_token}/load`, {
          amount: amount_usd,
          currency_code: "USD",
        });
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
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
