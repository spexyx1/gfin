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

const MAX_RETRIES = 5;
const RETRY_DELAYS = [60, 300, 900, 3600, 7200];

function isSafeUrl(urlString: string): boolean {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;

  const hostname = url.hostname.toLowerCase();

  // Block loopback
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return false;

  // Block link-local
  if (hostname === "169.254.169.254") return false;

  // Block private IPv4 ranges
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^0\./,
  ];
  for (const range of privateRanges) {
    if (range.test(hostname)) return false;
  }

  // Block cloud metadata endpoints
  const blockedHosts = [
    "metadata.google.internal",
    "169.254.169.254",
    "fd00:ec2::254",
  ];
  if (blockedHosts.includes(hostname)) return false;

  return true;
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

    const now = new Date().toISOString();

    const { data: pendingDeliveries, error } = await supabase
      .from("webhook_deliveries")
      .select("*")
      .in("delivery_status", ["pending", "retrying"])
      .or(`scheduled_at.lte.${now},next_retry_at.lte.${now}`)
      .limit(50);

    if (error || !pendingDeliveries || pendingDeliveries.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending webhooks to deliver",
          processed: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const results = await Promise.allSettled(
      pendingDeliveries.map(delivery => processWebhook(supabase, delivery))
    );

    const successCount = results.filter(r => r.status === "fulfilled").length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${pendingDeliveries.length} webhooks`,
        processed: pendingDeliveries.length,
        successful: successCount,
        failed: pendingDeliveries.length - successCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Webhook worker error:", error);
    return new Response(
      JSON.stringify({
        error: "Webhook processing failed",
        errorCode: "WORKER_ERROR"
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }
      }
    );
  }
});

async function processWebhook(supabase: any, delivery: any) {
  const startTime = Date.now();

  if (!isSafeUrl(delivery.endpoint_url)) {
    await supabase
      .from("webhook_deliveries")
      .update({
        delivery_status: "failed",
        error_message: "Endpoint URL is not permitted",
        delivered_at: new Date().toISOString()
      })
      .eq("id", delivery.id);
    return;
  }

  try {
    const { data: webhook } = await supabase
      .from("merchant_webhooks")
      .select("signing_secret")
      .eq("id", delivery.webhook_id)
      .maybeSingle();

    if (!webhook) {
      await supabase
        .from("webhook_deliveries")
        .update({
          delivery_status: "failed",
          error_message: "Webhook configuration not found",
          delivered_at: new Date().toISOString()
        })
        .eq("id", delivery.id);
      return;
    }

    const signature = await generateSignature(
      JSON.stringify(delivery.payload),
      webhook.signing_secret
    );

    const headers = {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
      "X-Webhook-Event": delivery.event_type,
      "X-Webhook-Event-ID": delivery.event_id,
      "X-Webhook-Delivery-ID": delivery.id,
      "User-Agent": "Natively-Webhooks/1.0"
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(delivery.endpoint_url, {
      method: delivery.http_method || "POST",
      headers,
      body: JSON.stringify({
        event_type: delivery.event_type,
        event_id: delivery.event_id,
        timestamp: delivery.created_at,
        data: delivery.payload
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    if (response.ok) {
      await supabase
        .from("webhook_deliveries")
        .update({
          delivery_status: "success",
          status_code: response.status,
          response_body: responseBody.substring(0, 5000),
          response_time_ms: responseTime,
          delivered_at: new Date().toISOString()
        })
        .eq("id", delivery.id);

      await supabase
        .from("merchant_webhooks")
        .update({
          last_success_at: new Date().toISOString(),
          failure_count: 0
        })
        .eq("id", delivery.webhook_id);

    } else {
      await handleFailure(supabase, delivery, response.status, responseBody, responseTime);
    }

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    await handleFailure(supabase, delivery, 0, error.message, responseTime);
  }
}

async function handleFailure(
  supabase: any,
  delivery: any,
  statusCode: number,
  errorMessage: string,
  responseTime: number
) {
  const attemptNumber = delivery.attempt_number || 1;

  if (attemptNumber >= MAX_RETRIES) {
    await supabase
      .from("webhook_deliveries")
      .update({
        delivery_status: "failed",
        status_code: statusCode,
        response_body: errorMessage.substring(0, 5000),
        response_time_ms: responseTime,
        error_message: `Max retries (${MAX_RETRIES}) exceeded`,
        delivered_at: new Date().toISOString()
      })
      .eq("id", delivery.id);

    const { data: webhook } = await supabase
      .from("merchant_webhooks")
      .select("failure_count")
      .eq("id", delivery.webhook_id)
      .maybeSingle();

    const failureCount = (webhook?.failure_count || 0) + 1;

    const updateData: any = {
      failure_count: failureCount,
      last_failure_at: new Date().toISOString()
    };

    if (failureCount >= 10) {
      updateData.is_active = false;
      updateData.disabled_at = new Date().toISOString();
      updateData.disabled_reason = `Automatically disabled after ${failureCount} consecutive failures`;
    }

    await supabase
      .from("merchant_webhooks")
      .update(updateData)
      .eq("id", delivery.webhook_id);

  } else {
    const nextRetryDelay = RETRY_DELAYS[attemptNumber - 1] || 7200;
    const nextRetryAt = new Date(Date.now() + nextRetryDelay * 1000);

    await supabase
      .from("webhook_deliveries")
      .update({
        delivery_status: "retrying",
        status_code: statusCode,
        response_body: errorMessage.substring(0, 5000),
        response_time_ms: responseTime,
        error_message: `Retry ${attemptNumber}/${MAX_RETRIES}`,
        attempt_number: attemptNumber + 1,
        next_retry_at: nextRetryAt.toISOString()
      })
      .eq("id", delivery.id);
  }
}

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
