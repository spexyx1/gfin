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

    await logRequest(req, supabase, auth.merchantId, auth.apiKeyId);

    if (req.method === "POST" && pathParts.length === 3) {
      return await createOrder(req, supabase, auth, corsHeaders);
    }

    if (req.method === "GET" && pathParts.length === 4) {
      const orderId = pathParts[3];
      return await getOrder(orderId, supabase, auth, corsHeaders);
    }

    if (req.method === "GET" && pathParts.length === 3) {
      return await listOrders(url, supabase, auth, corsHeaders);
    }

    if (req.method === "POST" && pathParts.length === 5 && pathParts[4] === "ship") {
      const orderId = pathParts[3];
      return await markOrderShipped(orderId, req, supabase, auth, corsHeaders);
    }

    if (req.method === "PATCH" && pathParts.length === 5 && pathParts[4] === "tracking") {
      const orderId = pathParts[3];
      return await updateTracking(orderId, req, supabase, auth, corsHeaders);
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

async function authenticateMerchant(req: Request, supabase: any): Promise<any> {
  const apiKey = req.headers.get("X-API-Key");
  if (!apiKey) {
    return { success: false, error: "API key required", errorCode: "MISSING_API_KEY", status: 401 };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const authFnUrl = `${supabaseUrl}/functions/v1/merchant-auth`;

  const response = await fetch(authFnUrl, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    return { success: false, error: data.error, errorCode: data.errorCode, status: response.status };
  }

  return response.json();
}

async function logRequest(req: Request, supabase: any, merchantId: string, apiKeyId: string) {
  try {
    const url = new URL(req.url);
    // Redact sensitive query params before logging
    const safeParams: Record<string, string> = {};
    for (const [k, v] of url.searchParams.entries()) {
      if (!["api_key", "token", "secret", "password"].includes(k.toLowerCase())) {
        safeParams[k] = v;
      }
    }
    await supabase.from("api_request_logs").insert({
      merchant_id: merchantId,
      api_key_id: apiKeyId,
      method: req.method,
      path: url.pathname,
      query_params: safeParams,
      ip_address: req.headers.get("CF-Connecting-IP") ?? req.headers.get("X-Forwarded-For") ?? "",
      user_agent: req.headers.get("User-Agent") ?? "",
      created_at: new Date().toISOString(),
    });
  } catch (_) {
    // Non-fatal logging failure
  }
}

async function createOrder(req: Request, supabase: any, auth: any, corsHeaders: Record<string, string>): Promise<Response> {
  const body = await req.json();
  const { product_id, quantity = 1, shipping_address, metadata } = body;

  if (!product_id) {
    return new Response(JSON.stringify({ error: "product_id required", errorCode: "MISSING_FIELD" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, title, price, seller_id, in_stock")
    .eq("id", product_id)
    .eq("status", "active")
    .maybeSingle();

  if (!product) {
    return new Response(JSON.stringify({ error: "Product not found or unavailable", errorCode: "PRODUCT_NOT_FOUND" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!product.in_stock) {
    return new Response(JSON.stringify({ error: "Product out of stock", errorCode: "OUT_OF_STOCK" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const totalAmount = product.price * quantity;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: auth.merchantId,
      seller_id: product.seller_id,
      product_id: product.id,
      amount: totalAmount,
      quantity,
      status: "pending",
      payment_method: "merchant_api",
      shipping_address: shipping_address ?? null,
      metadata: metadata ?? null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ success: true, data: order }), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getOrder(orderId: string, supabase: any, auth: any, corsHeaders: Record<string, string>): Promise<Response> {
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("buyer_id", auth.merchantId)
    .maybeSingle();

  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found", errorCode: "NOT_FOUND" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, data: order }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function listOrders(url: URL, supabase: any, auth: any, corsHeaders: Record<string, string>): Promise<Response> {
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const status = url.searchParams.get("status");

  let query = supabase
    .from("orders")
    .select("*", { count: "exact" })
    .eq("buyer_id", auth.merchantId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: orders, count } = await query;

  return new Response(JSON.stringify({ success: true, data: orders ?? [], total: count ?? 0, limit, offset }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function markOrderShipped(orderId: string, req: Request, supabase: any, auth: any, corsHeaders: Record<string, string>): Promise<Response> {
  const body = await req.json();
  const { tracking_number, carrier } = body;

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, seller_id")
    .eq("id", orderId)
    .eq("seller_id", auth.merchantId)
    .maybeSingle();

  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found", errorCode: "NOT_FOUND" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (order.status !== "processing") {
    return new Response(JSON.stringify({ error: "Order cannot be marked as shipped in current state", errorCode: "INVALID_STATUS" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: updated } = await supabase
    .from("orders")
    .update({ status: "shipped", tracking_number, carrier, shipped_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();

  return new Response(JSON.stringify({ success: true, data: updated }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function updateTracking(orderId: string, req: Request, supabase: any, auth: any, corsHeaders: Record<string, string>): Promise<Response> {
  const body = await req.json();

  const { data: order } = await supabase
    .from("orders")
    .select("id, seller_id")
    .eq("id", orderId)
    .eq("seller_id", auth.merchantId)
    .maybeSingle();

  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found", errorCode: "NOT_FOUND" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: updated } = await supabase
    .from("orders")
    .update({ tracking_number: body.tracking_number, carrier: body.carrier, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();

  return new Response(JSON.stringify({ success: true, data: updated }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
