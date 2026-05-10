import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://ghetto.finance";

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key",
    "Vary": "Origin",
  };
}

interface AuthResult {
  success: boolean;
  merchantId?: string;
  apiKeyId?: string;
  merchant?: any;
  error?: string;
  errorCode?: string;
  status?: number;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const apiKey = req.headers.get("X-API-Key");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "API key required",
          errorCode: "MISSING_API_KEY"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const keyHash = await hashApiKey(apiKey);

    const { data: apiKeyData, error: keyError } = await supabase
      .from("merchant_api_keys")
      .select(`
        id,
        merchant_id,
        scopes,
        is_sandbox,
        status,
        expires_at,
        merchant_accounts (
          id,
          business_name,
          is_active,
          is_sandbox_mode,
          daily_request_limit,
          fee_percentage
        )
      `)
      .eq("key_hash", keyHash)
      .eq("status", "active")
      .maybeSingle();

    if (keyError || !apiKeyData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid API key",
          errorCode: "INVALID_API_KEY"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "API key expired",
          errorCode: "EXPIRED_API_KEY"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const merchant = Array.isArray(apiKeyData.merchant_accounts)
      ? apiKeyData.merchant_accounts[0]
      : apiKeyData.merchant_accounts;

    if (!merchant || !merchant.is_active) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Merchant account inactive",
          errorCode: "INACTIVE_MERCHANT"
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    await supabase
      .from("merchant_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyData.id);

    const windowStart = new Date();
    windowStart.setMinutes(0, 0, 0);

    const { data: usageData } = await supabase
      .from("merchant_api_usage")
      .select("request_count")
      .eq("api_key_id", apiKeyData.id)
      .eq("window_start", windowStart.toISOString())
      .maybeSingle();

    const currentCount = usageData?.request_count || 0;
    const hourlyLimit = Math.floor(merchant.daily_request_limit / 24);

    if (currentCount >= hourlyLimit) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded",
          errorCode: "RATE_LIMIT_EXCEEDED"
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" }
        }
      );
    }

    if (usageData) {
      await supabase
        .from("merchant_api_usage")
        .update({
          request_count: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq("api_key_id", apiKeyData.id)
        .eq("window_start", windowStart.toISOString());
    } else {
      await supabase
        .from("merchant_api_usage")
        .insert({
          api_key_id: apiKeyData.id,
          merchant_id: apiKeyData.merchant_id,
          window_start: windowStart.toISOString(),
          request_count: 1
        });
    }

    const result: AuthResult = {
      success: true,
      merchantId: apiKeyData.merchant_id,
      apiKeyId: apiKeyData.id,
      merchant: merchant
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Authentication failed",
        errorCode: "AUTH_ERROR"
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }
      }
    );
  }
});

async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
