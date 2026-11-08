import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SITE_URL = "https://ghetto.finance";

const CATEGORY_COLUMNS: Record<string, string> = {
  account: "account_emails",
  orders: "order_updates",
  disputes: "dispute_updates",
  messages: "message_notifications",
  offers: "offer_notifications",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const columnsFor = (category: string): string[] =>
  category === "all" ? Object.values(CATEGORY_COLUMNS) : CATEGORY_COLUMNS[category] ? [CATEGORY_COLUMNS[category]] : [];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let token = url.searchParams.get("token") ?? "";
    let category = url.searchParams.get("category") ?? "all";
    let action = "unsubscribe";

    if (req.method === "GET") {
      const target = new URL("/unsubscribe", SITE_URL);
      if (token) target.searchParams.set("token", token);
      target.searchParams.set("category", category);
      return new Response(null, { status: 302, headers: { ...corsHeaders, Location: target.toString() } });
    }

    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const contentType = req.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      token = typeof body?.token === "string" ? body.token : token;
      category = typeof body?.category === "string" ? body.category : category;
      action = ["unsubscribe", "resubscribe", "status"].includes(body?.action) ? body.action : "unsubscribe";
    }

    if (!UUID_RE.test(token)) return json({ error: "This unsubscribe link is invalid" }, 400);
    const columns = columnsFor(category);
    if (columns.length === 0) return json({ error: "Unknown email type" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("id")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (!prefs) return json({ error: "This unsubscribe link is invalid or has expired" }, 404);

    const { data: cats } = await admin.from("email_notification_categories").select("category, label");
    const labels = Object.fromEntries((cats ?? []).map((c: { category: string; label: string }) => [c.category, c.label]));
    const label = category === "all" ? "All notification emails" : labels[category] ?? category;

    if (action !== "status") {
      const value = action === "resubscribe";
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const c of columns) update[c] = value;
      const { error } = await admin.from("notification_preferences").update(update).eq("id", prefs.id);
      if (error) return json({ error: "Could not update your preferences" }, 500);
    }

    return json({ ok: true, category, label, subscribed: action === "resubscribe" });
  } catch (err) {
    console.error("email-unsubscribe error", err);
    return json({ error: "Something went wrong" }, 500);
  }
});
