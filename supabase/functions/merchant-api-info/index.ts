import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://ghetto.finance";

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key",
    "Vary": "Origin",
  };
}

const SUPPORTED_TOKENS = [
  {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    chain: "Polygon",
    type: "native"
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chain: "Polygon",
    type: "ERC20",
    contract_address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    chain: "Polygon",
    type: "ERC20",
    contract_address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
  },
  {
    symbol: "GHETTO",
    name: "Ghetto Token",
    decimals: 18,
    chain: "Polygon",
    type: "ERC20",
    contract_address: null
  }
];

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

    const auth = await authenticateMerchant(req, supabase);
    if (!auth.success) {
      return new Response(
        JSON.stringify({ error: auth.error, errorCode: auth.errorCode }),
        {
          status: auth.status || 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts.includes("payment-tokens")) {
      return await getPaymentTokens(corsHeaders);
    }

    if (pathParts.includes("fees")) {
      return await calculateFees(url, auth, corsHeaders);
    }

    if (pathParts.includes("settlements")) {
      return await getSettlements(url, supabase, auth, corsHeaders);
    }

    if (pathParts.includes("usage")) {
      return await getUsageStats(url, supabase, auth, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: "Not found", errorCode: "NOT_FOUND" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        errorCode: "INTERNAL_ERROR"
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }
      }
    );
  }
});

async function authenticateMerchant(req: Request, supabase: any) {
  const apiKey = req.headers.get("X-API-Key");
  if (!apiKey) {
    return { success: false, error: "API key required", errorCode: "MISSING_API_KEY", status: 401 };
  }

  const authUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/merchant-auth`;
  const authResponse = await fetch(authUrl, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    }
  });

  const authData = await authResponse.json();
  if (!authData.success) {
    return { success: false, error: authData.error, errorCode: authData.errorCode, status: authResponse.status };
  }

  return {
    success: true,
    merchantId: authData.merchantId,
    apiKeyId: authData.apiKeyId,
    merchant: authData.merchant
  };
}

async function getPaymentTokens(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({
      success: true,
      tokens: SUPPORTED_TOKENS,
      escrow_info: {
        standard_hold_period_days: 7,
        early_release_enabled: true,
        dispute_window_days: 7
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function calculateFees(url: URL, auth: any, corsHeaders: Record<string, string>) {
  const amount = parseFloat(url.searchParams.get("amount") || "0");
  const token = url.searchParams.get("token") || "ETH";

  if (amount <= 0) {
    return new Response(
      JSON.stringify({
        error: "Invalid amount",
        errorCode: "INVALID_AMOUNT"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const feePercentage = auth.merchant.fee_percentage || 2.5;
  const feeAmount = (amount * feePercentage) / 100;
  const sellerPayout = amount - feeAmount;

  return new Response(
    JSON.stringify({
      success: true,
      calculation: {
        order_amount: amount,
        fee_percentage: feePercentage,
        fee_amount: feeAmount,
        seller_payout: sellerPayout,
        payment_token: token
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function getSettlements(url: URL, supabase: any, auth: any, corsHeaders: Record<string, string>) {
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");
  const status = url.searchParams.get("status");

  let query = supabase
    .from("merchant_transactions")
    .select("*")
    .eq("merchant_id", auth.merchantId);

  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }
  if (status) {
    query = query.eq("settlement_status", status);
  }

  const { data: transactions, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch settlements",
        errorCode: "FETCH_FAILED"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const summary = transactions.reduce((acc: any, tx: any) => {
    acc.total_order_amount += parseFloat(tx.order_amount || 0);
    acc.total_fee_amount += parseFloat(tx.fee_amount || 0);
    acc.total_seller_payout += parseFloat(tx.seller_payout || 0);
    acc.transaction_count += 1;
    return acc;
  }, {
    total_order_amount: 0,
    total_fee_amount: 0,
    total_seller_payout: 0,
    transaction_count: 0
  });

  return new Response(
    JSON.stringify({
      success: true,
      settlements: transactions,
      summary
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function getUsageStats(url: URL, supabase: any, auth: any, corsHeaders: Record<string, string>) {
  const days = parseInt(url.searchParams.get("days") || "7");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: usage, error } = await supabase
    .from("merchant_api_usage")
    .select("*")
    .eq("merchant_id", auth.merchantId)
    .gte("window_start", startDate.toISOString())
    .order("window_start", { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch usage stats",
        errorCode: "FETCH_FAILED"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const summary = usage.reduce((acc: any, u: any) => {
    acc.total_requests += u.request_count || 0;
    acc.successful_requests += u.success_count || 0;
    acc.failed_requests += u.error_count || 0;
    return acc;
  }, {
    total_requests: 0,
    successful_requests: 0,
    failed_requests: 0
  });

  const successRate = summary.total_requests > 0
    ? (summary.successful_requests / summary.total_requests) * 100
    : 0;

  return new Response(
    JSON.stringify({
      success: true,
      usage_stats: {
        period_days: days,
        ...summary,
        success_rate: successRate.toFixed(2) + "%"
      },
      hourly_breakdown: usage
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}
