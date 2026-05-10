import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key",
};

Deno.serve(async (req: Request) => {
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
      return await createOrder(req, supabase, auth);
    }

    if (req.method === "GET" && pathParts.length === 4) {
      const orderId = pathParts[3];
      return await getOrder(orderId, supabase, auth);
    }

    if (req.method === "GET" && pathParts.length === 3) {
      return await listOrders(url, supabase, auth);
    }

    if (req.method === "POST" && pathParts.length === 5 && pathParts[4] === "ship") {
      const orderId = pathParts[3];
      return await markOrderShipped(orderId, req, supabase, auth);
    }

    if (req.method === "PATCH" && pathParts.length === 5 && pathParts[4] === "tracking") {
      const orderId = pathParts[3];
      return await updateTracking(orderId, req, supabase, auth);
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
        headers: { ...corsHeaders, "Content-Type": "application/json" }
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
      "Content-Type": "application/json"
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

async function createOrder(req: Request, supabase: any, auth: any) {
  const body = await req.json();
  const {
    merchant_reference_id,
    buyer_wallet_address,
    product_id,
    quantity = 1,
    payment_token = "ETH",
    shipping_address,
    metadata = {}
  } = body;

  if (!merchant_reference_id || !buyer_wallet_address || !product_id) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields: merchant_reference_id, buyer_wallet_address, product_id",
        errorCode: "MISSING_FIELDS"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const { data: existingOrder } = await supabase
    .from("merchant_orders")
    .select("id")
    .eq("merchant_id", auth.merchantId)
    .eq("merchant_reference_id", merchant_reference_id)
    .maybeSingle();

  if (existingOrder) {
    return new Response(
      JSON.stringify({
        error: "Order with this merchant_reference_id already exists",
        errorCode: "DUPLICATE_ORDER"
      }),
      {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, price, seller_id, title")
    .eq("id", product_id)
    .maybeSingle();

  if (productError || !product) {
    return new Response(
      JSON.stringify({
        error: "Product not found",
        errorCode: "PRODUCT_NOT_FOUND"
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const orderAmount = product.price * quantity;
  const feePercentage = auth.merchant.fee_percentage || 2.5;
  const feeAmount = (orderAmount * feePercentage) / 100;
  const sellerPayout = orderAmount - feeAmount;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id: null,
      buyer_wallet_address,
      seller_id: product.seller_id,
      product_id: product.id,
      quantity,
      total_price: orderAmount,
      payment_token,
      shipping_address,
      status: "pending",
      payment_status: "pending"
    })
    .select()
    .single();

  if (orderError || !order) {
    return new Response(
      JSON.stringify({
        error: "Failed to create order",
        errorCode: "ORDER_CREATE_FAILED",
        details: orderError?.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const { data: merchantOrder, error: moError } = await supabase
    .from("merchant_orders")
    .insert({
      merchant_id: auth.merchantId,
      order_id: order.id,
      merchant_reference_id,
      merchant_order_data: metadata,
      api_key_id: auth.apiKeyId
    })
    .select()
    .single();

  if (moError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return new Response(
      JSON.stringify({
        error: "Failed to link merchant order",
        errorCode: "MERCHANT_ORDER_FAILED"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  await supabase
    .from("merchant_transactions")
    .insert({
      merchant_id: auth.merchantId,
      order_id: order.id,
      merchant_order_id: merchantOrder.id,
      transaction_type: "fee",
      order_amount: orderAmount,
      fee_percentage: feePercentage,
      fee_amount: feeAmount,
      seller_payout: sellerPayout,
      payment_token,
      settlement_status: "pending"
    });

  await triggerWebhook(supabase, auth.merchantId, "order.created", {
    order_id: order.id,
    merchant_reference_id,
    status: order.status,
    amount: orderAmount,
    payment_token,
    created_at: order.created_at
  });

  return new Response(
    JSON.stringify({
      success: true,
      order: {
        id: order.id,
        merchant_reference_id,
        status: order.status,
        payment_status: order.payment_status,
        amount: orderAmount,
        fee_amount: feeAmount,
        seller_payout: sellerPayout,
        payment_token,
        created_at: order.created_at
      }
    }),
    {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function getOrder(orderId: string, supabase: any, auth: any) {
  const { data: merchantOrder, error } = await supabase
    .from("merchant_orders")
    .select(`
      id,
      merchant_reference_id,
      merchant_order_data,
      created_at,
      orders (
        id,
        status,
        payment_status,
        total_price,
        payment_token,
        quantity,
        shipping_address,
        tracking_number,
        tracking_url,
        buyer_wallet_address,
        created_at,
        updated_at,
        products (
          id,
          title,
          price
        )
      )
    `)
    .eq("merchant_id", auth.merchantId)
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !merchantOrder) {
    return new Response(
      JSON.stringify({
        error: "Order not found",
        errorCode: "ORDER_NOT_FOUND"
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const order = Array.isArray(merchantOrder.orders) ? merchantOrder.orders[0] : merchantOrder.orders;
  const product = Array.isArray(order.products) ? order.products[0] : order.products;

  return new Response(
    JSON.stringify({
      success: true,
      order: {
        id: order.id,
        merchant_reference_id: merchantOrder.merchant_reference_id,
        status: order.status,
        payment_status: order.payment_status,
        amount: order.total_price,
        payment_token: order.payment_token,
        quantity: order.quantity,
        buyer_wallet_address: order.buyer_wallet_address,
        shipping_address: order.shipping_address,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        product: product,
        metadata: merchantOrder.merchant_order_data,
        created_at: order.created_at,
        updated_at: order.updated_at
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function listOrders(url: URL, supabase: any, auth: any) {
  const status = url.searchParams.get("status");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = supabase
    .from("merchant_orders")
    .select(`
      id,
      merchant_reference_id,
      created_at,
      orders (
        id,
        status,
        payment_status,
        total_price,
        payment_token,
        created_at
      )
    `, { count: "exact" })
    .eq("merchant_id", auth.merchantId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: merchantOrders, error, count } = await query;

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch orders",
        errorCode: "FETCH_FAILED"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const orders = merchantOrders
    .filter(mo => mo.orders !== null)
    .map(mo => {
      const order = Array.isArray(mo.orders) ? mo.orders[0] : mo.orders;
      return {
        id: order.id,
        merchant_reference_id: mo.merchant_reference_id,
        status: order.status,
        payment_status: order.payment_status,
        amount: order.total_price,
        payment_token: order.payment_token,
        created_at: order.created_at
      };
    })
    .filter(order => !status || order.status === status);

  return new Response(
    JSON.stringify({
      success: true,
      orders,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (offset + limit) < (count || 0)
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function markOrderShipped(orderId: string, req: Request, supabase: any, auth: any) {
  const body = await req.json();
  const { tracking_number, tracking_url, carrier } = body;

  const { data: merchantOrder } = await supabase
    .from("merchant_orders")
    .select("id")
    .eq("merchant_id", auth.merchantId)
    .eq("order_id", orderId)
    .maybeSingle();

  if (!merchantOrder) {
    return new Response(
      JSON.stringify({
        error: "Order not found",
        errorCode: "ORDER_NOT_FOUND"
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const { data: order, error } = await supabase
    .from("orders")
    .update({
      status: "shipped",
      tracking_number,
      tracking_url,
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to update order",
        errorCode: "UPDATE_FAILED"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  await triggerWebhook(supabase, auth.merchantId, "order.shipped", {
    order_id: orderId,
    tracking_number,
    tracking_url,
    carrier,
    shipped_at: order.updated_at
  });

  return new Response(
    JSON.stringify({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function updateTracking(orderId: string, req: Request, supabase: any, auth: any) {
  const body = await req.json();
  const { tracking_number, tracking_url } = body;

  const { data: merchantOrder } = await supabase
    .from("merchant_orders")
    .select("id")
    .eq("merchant_id", auth.merchantId)
    .eq("order_id", orderId)
    .maybeSingle();

  if (!merchantOrder) {
    return new Response(
      JSON.stringify({
        error: "Order not found",
        errorCode: "ORDER_NOT_FOUND"
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const { data: order, error } = await supabase
    .from("orders")
    .update({
      tracking_number,
      tracking_url,
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to update tracking",
        errorCode: "UPDATE_FAILED"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      order: {
        id: order.id,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function triggerWebhook(supabase: any, merchantId: string, eventType: string, payload: any) {
  const { data: webhook } = await supabase
    .from("merchant_webhooks")
    .select("*")
    .eq("merchant_id", merchantId)
    .eq("is_active", true)
    .contains("subscribed_events", [eventType])
    .maybeSingle();

  if (!webhook) return;

  await supabase
    .from("webhook_deliveries")
    .insert({
      webhook_id: webhook.id,
      merchant_id: merchantId,
      event_type: eventType,
      payload,
      endpoint_url: webhook.endpoint_url,
      delivery_status: "pending",
      scheduled_at: new Date().toISOString()
    });
}

async function logRequest(req: Request, supabase: any, merchantId: string, apiKeyId: string) {
  const url = new URL(req.url);
  await supabase
    .from("api_request_logs")
    .insert({
      merchant_id: merchantId,
      api_key_id: apiKeyId,
      method: req.method,
      endpoint: url.pathname,
      query_params: Object.fromEntries(url.searchParams),
      status_code: 200,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      user_agent: req.headers.get("user-agent")
    });
}
