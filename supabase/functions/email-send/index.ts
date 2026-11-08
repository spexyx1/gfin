import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

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

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const MAX_RECIPIENTS = 50;

const cleanList = (list: unknown): string[] =>
  Array.isArray(list)
    ? list.map((v) => String(v).trim().toLowerCase()).filter((v) => EMAIL_RE.test(v))
    : [];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return json({ error: "Not signed in" }, 401);

    const { data: isSitemaster } = await userClient.rpc("is_current_user_sitemaster");
    if (isSitemaster !== true) return json({ error: "Not allowed" }, 403);

    const body = await req.json().catch(() => ({}));
    const messageId = typeof body?.message_id === "string" ? body.message_id : "";
    if (!messageId) return json({ error: "message_id is required" }, 400);

    const admin = createClient(url, serviceKey);

    const { data: msg, error: msgErr } = await admin
      .from("email_messages")
      .select("*")
      .eq("id", messageId)
      .maybeSingle();
    if (msgErr || !msg) return json({ error: "Draft not found" }, 404);
    if (msg.direction !== "outbound" || msg.folder !== "drafts" || !["draft", "failed"].includes(msg.status)) {
      return json({ error: "Only drafts can be sent" }, 400);
    }

    const { data: mailbox } = await admin
      .from("email_mailboxes")
      .select("address, display_name, active")
      .eq("id", msg.mailbox_id)
      .maybeSingle();
    if (!mailbox || !mailbox.active) return json({ error: "Sending address is not available" }, 400);

    const to = cleanList(msg.to_addresses);
    const cc = cleanList(msg.cc_addresses);
    const bcc = cleanList(msg.bcc_addresses);
    if (to.length === 0) return json({ error: "Add at least one valid recipient" }, 400);
    if (to.length + cc.length + bcc.length > MAX_RECIPIENTS) {
      return json({ error: `No more than ${MAX_RECIPIENTS} recipients` }, 400);
    }

    const { data: atts } = await admin
      .from("email_attachments")
      .select("filename, content_type, storage_path")
      .eq("message_id", messageId);

    const attachments: { filename: string; content: string; content_type?: string }[] = [];
    for (const a of atts ?? []) {
      const { data: file, error: dlErr } = await admin.storage.from("email-attachments").download(a.storage_path);
      if (dlErr || !file) return json({ error: `Could not read attachment ${a.filename}` }, 500);
      attachments.push({
        filename: a.filename,
        content: encodeBase64(new Uint8Array(await file.arrayBuffer())),
        content_type: a.content_type ?? undefined,
      });
    }

    const headers: Record<string, string> = {};
    if (msg.in_reply_to) headers["In-Reply-To"] = msg.in_reply_to;
    if (msg.references_header) headers["References"] = msg.references_header;

    const fromName = (mailbox.display_name ?? "").replace(/[<>"]/g, "").trim();
    const payload: Record<string, unknown> = {
      from: fromName ? `${fromName} <${mailbox.address}>` : mailbox.address,
      to,
      subject: msg.subject || "(no subject)",
      html: msg.body_html || undefined,
      text: msg.body_text || undefined,
    };
    if (cc.length) payload.cc = cc;
    if (bcc.length) payload.bcc = bcc;
    if (msg.reply_to && EMAIL_RE.test(msg.reply_to)) payload.reply_to = msg.reply_to;
    if (Object.keys(headers).length) payload.headers = headers;
    if (attachments.length) payload.attachments = attachments;

    await admin.from("email_messages").update({ status: "queued", error: null }).eq("id", messageId);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json().catch(() => ({}));

    if (!res.ok || !result?.id) {
      const reason = typeof result?.message === "string" ? result.message : "The email provider rejected the message";
      await admin.from("email_messages").update({ status: "failed", error: reason }).eq("id", messageId);
      await admin.from("email_activity_log").insert({
        actor_id: userId, action: "send_failed", message_id: messageId, details: { reason },
      });
      return json({ error: reason }, 502);
    }

    const now = new Date().toISOString();
    await admin
      .from("email_messages")
      .update({
        folder: "sent",
        status: "sent",
        sent_at: now,
        resend_id: result.id,
        to_addresses: to,
        cc_addresses: cc,
        bcc_addresses: bcc,
        from_address: mailbox.address,
        from_name: mailbox.display_name,
        is_read: true,
        error: null,
      })
      .eq("id", messageId);

    await admin.from("email_activity_log").insert({
      actor_id: userId, action: "sent", message_id: messageId, details: { to, resend_id: result.id },
    });

    return json({ ok: true, id: result.id });
  } catch (err) {
    console.error("email-send error", err);
    return json({ error: "Something went wrong while sending" }, 500);
  }
});
