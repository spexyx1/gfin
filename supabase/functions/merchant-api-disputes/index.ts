import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

    if (req.method === "GET" && pathParts.length === 4) {
      const orderId = pathParts[3];
      return await getOrderDisputes(orderId, supabase, auth);
    }

    if (req.method === "GET" && pathParts.length === 5) {
      const disputeId = pathParts[4];
      return await getDisputeDetails(disputeId, supabase, auth);
    }

    if (req.method === "POST" && pathParts.includes("evidence")) {
      const disputeId = pathParts[4];
      return await addEvidence(disputeId, req, supabase, auth);
    }

    if (req.method === "POST" && pathParts.includes("comments")) {
      const disputeId = pathParts[4];
      return await addComment(disputeId, req, supabase, auth);
    }

    if (req.method === "GET" && pathParts.length === 3 && pathParts[2] === "disputes") {
      return await listDisputes(url, supabase, auth);
    }

    return new Response(
      JSON.stringify({ error: "Not found", errorCode: "NOT_FOUND" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Disputes API error:", error);
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

async function getOrderDisputes(orderId: string, supabase: any, auth: any) {
  const { data: merchantOrder } = await supabase
    .from("merchant_orders")
    .select("id, order_id")
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

  const { data: disputes, error } = await supabase
    .from("order_disputes")
    .select(`
      id,
      reason,
      description,
      status,
      created_at,
      resolved_at,
      resolution,
      mediator_notes
    `)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch disputes",
        errorCode: "FETCH_FAILED"
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
      order_id: orderId,
      disputes: disputes || [],
      dispute_count: disputes?.length || 0
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function getDisputeDetails(disputeId: string, supabase: any, auth: any) {
  const { data: dispute, error } = await supabase
    .from("order_disputes")
    .select(`
      id,
      order_id,
      reason,
      description,
      status,
      created_at,
      resolved_at,
      resolution,
      mediator_notes,
      orders!inner (
        id,
        total_price,
        payment_token,
        merchant_orders!inner (
          merchant_id,
          merchant_reference_id
        )
      )
    `)
    .eq("id", disputeId)
    .maybeSingle();

  if (error || !dispute) {
    return new Response(
      JSON.stringify({
        error: "Dispute not found",
        errorCode: "DISPUTE_NOT_FOUND"
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const order = Array.isArray(dispute.orders) ? dispute.orders[0] : dispute.orders;
  const merchantOrder = order.merchant_orders[0] || order.merchant_orders;

  if (merchantOrder.merchant_id !== auth.merchantId) {
    return new Response(
      JSON.stringify({
        error: "Access denied",
        errorCode: "ACCESS_DENIED"
      }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const { data: evidence } = await supabase
    .from("dispute_evidence")
    .select("*")
    .eq("dispute_id", disputeId)
    .order("created_at", { ascending: false });

  const { data: comments } = await supabase
    .from("dispute_comments")
    .select("*")
    .eq("dispute_id", disputeId)
    .order("created_at", { ascending: true });

  return new Response(
    JSON.stringify({
      success: true,
      dispute: {
        id: dispute.id,
        order_id: dispute.order_id,
        merchant_reference_id: merchantOrder.merchant_reference_id,
        reason: dispute.reason,
        description: dispute.description,
        status: dispute.status,
        resolution: dispute.resolution,
        mediator_notes: dispute.mediator_notes,
        created_at: dispute.created_at,
        resolved_at: dispute.resolved_at,
        evidence: evidence || [],
        comments: comments || []
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function listDisputes(url: URL, supabase: any, auth: any) {
  const status = url.searchParams.get("status");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = supabase
    .from("order_disputes")
    .select(`
      id,
      order_id,
      reason,
      description,
      status,
      created_at,
      resolved_at,
      orders!inner (
        id,
        total_price,
        payment_token,
        merchant_orders!inner (
          merchant_id,
          merchant_reference_id
        )
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: disputes, error, count } = await query;

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch disputes",
        errorCode: "FETCH_FAILED"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const merchantDisputes = disputes
    ?.filter(d => {
      const order = Array.isArray(d.orders) ? d.orders[0] : d.orders;
      const merchantOrder = order?.merchant_orders?.[0] || order?.merchant_orders;
      return merchantOrder?.merchant_id === auth.merchantId;
    })
    .filter(d => !status || d.status === status)
    .map(d => {
      const order = Array.isArray(d.orders) ? d.orders[0] : d.orders;
      const merchantOrder = order.merchant_orders[0] || order.merchant_orders;
      return {
        id: d.id,
        order_id: d.order_id,
        merchant_reference_id: merchantOrder.merchant_reference_id,
        reason: d.reason,
        status: d.status,
        created_at: d.created_at,
        resolved_at: d.resolved_at
      };
    }) || [];

  return new Response(
    JSON.stringify({
      success: true,
      disputes: merchantDisputes,
      pagination: {
        total: merchantDisputes.length,
        limit,
        offset,
        has_more: (offset + limit) < merchantDisputes.length
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function addEvidence(disputeId: string, req: Request, supabase: any, auth: any) {
  const body = await req.json();
  const { evidence_type, description, file_url } = body;

  const { data: dispute } = await supabase
    .from("order_disputes")
    .select(`
      id,
      orders!inner (
        merchant_orders!inner (
          merchant_id
        )
      )
    `)
    .eq("id", disputeId)
    .maybeSingle();

  if (!dispute) {
    return new Response(
      JSON.stringify({
        error: "Dispute not found",
        errorCode: "DISPUTE_NOT_FOUND"
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const order = Array.isArray(dispute.orders) ? dispute.orders[0] : dispute.orders;
  const merchantOrder = order.merchant_orders[0] || order.merchant_orders;

  if (merchantOrder.merchant_id !== auth.merchantId) {
    return new Response(
      JSON.stringify({
        error: "Access denied",
        errorCode: "ACCESS_DENIED"
      }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const { data: evidence, error } = await supabase
    .from("dispute_evidence")
    .insert({
      dispute_id: disputeId,
      submitted_by: "merchant",
      evidence_type,
      description,
      file_url
    })
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to add evidence",
        errorCode: "ADD_EVIDENCE_FAILED"
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
      evidence
    }),
    {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

async function addComment(disputeId: string, req: Request, supabase: any, auth: any) {
  const body = await req.json();
  const { comment } = body;

  if (!comment || comment.trim().length === 0) {
    return new Response(
      JSON.stringify({
        error: "Comment text required",
        errorCode: "MISSING_COMMENT"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const { data: dispute } = await supabase
    .from("order_disputes")
    .select(`
      id,
      orders!inner (
        merchant_orders!inner (
          merchant_id
        )
      )
    `)
    .eq("id", disputeId)
    .maybeSingle();

  if (!dispute) {
    return new Response(
      JSON.stringify({
        error: "Dispute not found",
        errorCode: "DISPUTE_NOT_FOUND"
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const order = Array.isArray(dispute.orders) ? dispute.orders[0] : dispute.orders;
  const merchantOrder = order.merchant_orders[0] || order.merchant_orders;

  if (merchantOrder.merchant_id !== auth.merchantId) {
    return new Response(
      JSON.stringify({
        error: "Access denied",
        errorCode: "ACCESS_DENIED"
      }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const { data: commentData, error } = await supabase
    .from("dispute_comments")
    .insert({
      dispute_id: disputeId,
      commenter_role: "merchant",
      comment_text: comment
    })
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to add comment",
        errorCode: "ADD_COMMENT_FAILED"
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
      comment: commentData
    }),
    {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}
