import { requireSupabase } from '../../lib/supabase';
import type { ComposeSeed, MailAttachment, MailFilter, MailLabel, MailMessage, Mailbox, StoredFolder } from './mailTypes';
import { makeSnippet, textToHtml } from './mailTypes';

export const PAGE_SIZE = 50;
const BUCKET = 'email-attachments';

const fail = (error: { message?: string } | null, fallback: string): never => {
  throw new Error(error?.message || fallback);
};

const cleanSearch = (s: string) => s.replace(/[,()*%\\:"']/g, ' ').trim();

export async function fetchMailboxes(): Promise<Mailbox[]> {
  const { data, error } = await requireSupabase()
    .from('email_mailboxes')
    .select('id, address, display_name, signature, is_catch_all, can_receive, active')
    .order('address');
  if (error) fail(error, 'Could not load mailboxes');
  return (data ?? []) as Mailbox[];
}

export async function updateMailbox(id: string, updates: { display_name?: string; signature?: string }) {
  const { error } = await requireSupabase()
    .from('email_mailboxes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) fail(error, 'Could not save mailbox');
}

export async function fetchMessages(filter: MailFilter, offset: number): Promise<MailMessage[]> {
  let q = requireSupabase().from('email_messages').select('*');
  if (filter.label) q = q.contains('labels', [filter.label]).not('folder', 'in', '(trash,drafts)');
  else if (filter.folder === 'starred') q = q.eq('is_starred', true).neq('folder', 'trash');
  else q = q.eq('folder', filter.folder);
  if (filter.address) q = q.ilike('delivered_to', filter.address);
  const term = cleanSearch(filter.search);
  if (term) {
    q = q.or(`subject.ilike.*${term}*,from_address.ilike.*${term}*,from_name.ilike.*${term}*,snippet.ilike.*${term}*`);
  }
  const orderCol = filter.folder === 'drafts' ? 'updated_at' : 'created_at';
  const { data, error } = await q.order(orderCol, { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
  if (error) fail(error, 'Could not load messages');
  return (data ?? []) as MailMessage[];
}

export async function fetchThread(threadId: string, includeTrash: boolean): Promise<MailMessage[]> {
  let q = requireSupabase().from('email_messages').select('*').eq('thread_id', threadId).neq('folder', 'drafts');
  if (!includeTrash) q = q.neq('folder', 'trash');
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error) fail(error, 'Could not load conversation');
  return (data ?? []) as MailMessage[];
}

export async function fetchAttachments(messageIds: string[]): Promise<MailAttachment[]> {
  if (messageIds.length === 0) return [];
  const { data, error } = await requireSupabase()
    .from('email_attachments')
    .select('id, message_id, filename, content_type, size_bytes, storage_path, content_id')
    .in('message_id', messageIds);
  if (error) fail(error, 'Could not load attachments');
  return (data ?? []) as MailAttachment[];
}

export async function attachmentUrl(path: string, download?: string) {
  const { data, error } = await requireSupabase().storage.from(BUCKET).createSignedUrl(path, 300, download ? { download } : undefined);
  if (error || !data) fail(error, 'Could not open attachment');
  return data!.signedUrl;
}

export async function updateMessages(ids: string[], updates: Partial<MailMessage>) {
  if (ids.length === 0) return;
  const { error } = await requireSupabase()
    .from('email_messages')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in('id', ids);
  if (error) fail(error, 'Could not update message');
}

export async function moveMessages(messages: MailMessage[], to: StoredFolder) {
  for (const m of messages) {
    await updateMessages([m.id], { folder: to, previous_folder: m.folder });
  }
}

export async function restoreMessages(messages: MailMessage[]) {
  for (const m of messages) {
    const back = m.previous_folder && m.previous_folder !== 'trash' && m.previous_folder !== 'spam'
      ? m.previous_folder
      : m.direction === 'outbound' ? 'sent' : 'inbox';
    await updateMessages([m.id], { folder: back, previous_folder: m.folder });
  }
}

export async function deleteForever(ids: string[]) {
  const client = requireSupabase();
  const atts = await fetchAttachments(ids);
  if (atts.length) await client.storage.from(BUCKET).remove(atts.map((a) => a.storage_path));
  const { error } = await client.from('email_messages').delete().in('id', ids);
  if (error) fail(error, 'Could not delete message');
  await client.from('email_activity_log').insert(ids.map((id) => ({ action: 'deleted', details: { message_id: id } })));
}

export async function fetchLabels(): Promise<MailLabel[]> {
  const { data, error } = await requireSupabase().from('email_labels').select('id, name, color').order('name');
  if (error) fail(error, 'Could not load labels');
  return (data ?? []) as MailLabel[];
}

export async function createLabel(name: string, color: string) {
  const { error } = await requireSupabase().from('email_labels').insert({ name, color });
  if (error) fail(error, 'Could not create label');
}

export async function deleteLabel(id: string) {
  const { error } = await requireSupabase().from('email_labels').delete().eq('id', id);
  if (error) fail(error, 'Could not delete label');
}

export async function countUnread(): Promise<number> {
  const { count, error } = await requireSupabase()
    .from('email_messages')
    .select('id', { count: 'exact', head: true })
    .eq('folder', 'inbox')
    .eq('is_read', false);
  if (error) return 0;
  return count ?? 0;
}

export interface DraftFields {
  mailboxId: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string | null;
  references?: string | null;
  hasAttachments: boolean;
}

export async function saveDraft(draftId: string | null, f: DraftFields): Promise<string> {
  const client = requireSupabase();
  const row = {
    mailbox_id: f.mailboxId,
    to_addresses: f.to,
    cc_addresses: f.cc,
    bcc_addresses: f.bcc,
    subject: f.subject,
    body_text: f.body,
    body_html: textToHtml(f.body),
    snippet: makeSnippet(f.body),
    in_reply_to: f.inReplyTo ?? null,
    references_header: f.references ?? null,
    has_attachments: f.hasAttachments,
    updated_at: new Date().toISOString(),
  };
  if (draftId) {
    const { error } = await client.from('email_messages').update(row).eq('id', draftId);
    if (error) fail(error, 'Could not save draft');
    return draftId;
  }
  const { data, error } = await client
    .from('email_messages')
    .insert({ ...row, direction: 'outbound', folder: 'drafts', status: 'draft', ...(f.threadId ? { thread_id: f.threadId } : {}) })
    .select('id')
    .maybeSingle();
  if (error || !data) fail(error, 'Could not save draft');
  return data!.id as string;
}

export async function uploadAttachment(messageId: string, file: File): Promise<MailAttachment> {
  const client = requireSupabase();
  const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(-120) || 'file';
  const path = `outbound/${messageId}/${crypto.randomUUID()}-${safeName}`;
  const { error: upErr } = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
  if (upErr) fail(upErr, `Could not upload ${file.name}`);
  const { data, error } = await client
    .from('email_attachments')
    .insert({ message_id: messageId, filename: file.name, content_type: file.type || 'application/octet-stream', size_bytes: file.size, storage_path: path })
    .select('id, message_id, filename, content_type, size_bytes, storage_path, content_id')
    .maybeSingle();
  if (error || !data) {
    await client.storage.from(BUCKET).remove([path]);
    fail(error, 'Could not attach file');
  }
  return data as MailAttachment;
}

export async function copyAttachment(messageId: string, source: MailAttachment): Promise<MailAttachment> {
  const client = requireSupabase();
  const safeName = source.filename.replace(/[^\w.\-]+/g, '_').slice(-120) || 'file';
  const path = `outbound/${messageId}/${crypto.randomUUID()}-${safeName}`;
  const { error: cpErr } = await client.storage.from(BUCKET).copy(source.storage_path, path);
  if (cpErr) fail(cpErr, `Could not copy ${source.filename}`);
  const { data, error } = await client
    .from('email_attachments')
    .insert({ message_id: messageId, filename: source.filename, content_type: source.content_type, size_bytes: source.size_bytes, storage_path: path })
    .select('id, message_id, filename, content_type, size_bytes, storage_path, content_id')
    .maybeSingle();
  if (error || !data) fail(error, 'Could not attach file');
  return data as MailAttachment;
}

export async function removeAttachment(att: MailAttachment) {
  const client = requireSupabase();
  await client.storage.from(BUCKET).remove([att.storage_path]);
  const { error } = await client.from('email_attachments').delete().eq('id', att.id);
  if (error) fail(error, 'Could not remove attachment');
}

export async function sendDraft(messageId: string) {
  const { data, error } = await requireSupabase().functions.invoke('email-send', { body: { message_id: messageId } });
  if (error) {
    let reason = 'Sending failed';
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json().catch(() => null);
      if (body?.error) reason = body.error;
    }
    throw new Error(reason);
  }
  if (!data?.ok) throw new Error(data?.error || 'Sending failed');
}

export async function sendTestEmail(mailboxId: string, to: string) {
  const body = `This is a test email from the ghetto.finance mail system.\n\nIf you can read this, sending works.\n\nSent ${new Date().toLocaleString()}`;
  const id = await saveDraft(null, { mailboxId, to: [to], cc: [], bcc: [], subject: 'Test email from ghetto.finance', body, hasAttachments: false });
  await sendDraft(id);
}

export interface NotificationLogRow {
  id: string;
  category: string;
  event_type: string;
  to_email: string | null;
  subject: string | null;
  status: string;
  delivery_status: string | null;
  error: string | null;
  attempts: number;
  created_at: string;
  sent_at: string | null;
}

export async function fetchNotificationLog(): Promise<NotificationLogRow[]> {
  const { data, error } = await requireSupabase()
    .from('email_notifications')
    .select('id, category, event_type, to_email, subject, status, delivery_status, error, attempts, created_at, sent_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) fail(error, 'Could not load delivery log');
  return (data ?? []) as NotificationLogRow[];
}

export interface NotificationCategory {
  category: string;
  label: string;
  description: string | null;
  enabled: boolean;
}

export async function fetchNotificationCategories(): Promise<NotificationCategory[]> {
  const { data, error } = await requireSupabase()
    .from('email_notification_categories')
    .select('category, label, description, enabled')
    .order('category');
  if (error) fail(error, 'Could not load notification types');
  return (data ?? []) as NotificationCategory[];
}

export async function setCategoryEnabled(category: string, enabled: boolean) {
  const { error } = await requireSupabase()
    .from('email_notification_categories')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('category', category);
  if (error) fail(error, 'Could not update notification type');
}

export const seedFromDraft = (m: MailMessage): ComposeSeed => ({
  draftId: m.id,
  mailboxId: m.mailbox_id,
  to: m.to_addresses,
  cc: m.cc_addresses,
  bcc: m.bcc_addresses,
  subject: m.subject,
  body: m.body_text,
  threadId: m.thread_id,
  inReplyTo: m.in_reply_to,
  references: m.references_header,
});
