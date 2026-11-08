export type MailFolder = 'inbox' | 'sent' | 'drafts' | 'starred' | 'archive' | 'spam' | 'trash';
export type StoredFolder = Exclude<MailFolder, 'starred'>;

export interface Mailbox {
  id: string;
  address: string;
  display_name: string | null;
  signature: string | null;
  is_catch_all: boolean;
  can_receive: boolean;
  active: boolean;
}

export interface MailMessage {
  id: string;
  mailbox_id: string;
  thread_id: string;
  direction: 'inbound' | 'outbound';
  folder: StoredFolder;
  previous_folder: StoredFolder | null;
  from_address: string;
  from_name: string;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  reply_to: string | null;
  delivered_to: string | null;
  subject: string;
  body_html: string;
  body_text: string;
  snippet: string;
  message_id_header: string | null;
  in_reply_to: string | null;
  references_header: string | null;
  status: string;
  error: string | null;
  is_read: boolean;
  is_starred: boolean;
  labels: string[];
  has_attachments: boolean;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MailAttachment {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  storage_path: string;
  content_id: string | null;
}

export interface MailLabel {
  id: string;
  name: string;
  color: string;
}

export interface MailFilter {
  folder: MailFolder;
  label: string | null;
  address: string | null;
  search: string;
}

export interface ComposeSeed {
  draftId?: string;
  mailboxId?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  threadId?: string;
  inReplyTo?: string | null;
  references?: string | null;
  forwardAttachments?: MailAttachment[];
}

export const messageDate = (m: MailMessage) => m.received_at || m.sent_at || m.created_at;

export const formatListDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatFullDate = (iso: string) =>
  new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export const senderLabel = (m: MailMessage) =>
  m.direction === 'outbound'
    ? `To: ${m.to_addresses.join(', ') || '(no recipients)'}`
    : m.from_name || m.from_address || 'Unknown sender';

export const initials = (name: string) => {
  const clean = name.replace(/<.*?>/g, '').replace(/^To:\s*/, '').trim();
  const parts = clean.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
};

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const textToHtml = (text: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#111">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;

export const makeSnippet = (text: string) => text.replace(/\s+/g, ' ').trim().slice(0, 180);

export const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

export const parseAddressList = (raw: string) =>
  raw
    .split(/[,;\s]+/)
    .map((s) => s.replace(/^.*<(.+)>$/, '$1').trim().toLowerCase())
    .filter(Boolean);

export const FOLDER_LABELS: Record<MailFolder, string> = {
  inbox: 'Inbox',
  starred: 'Starred',
  sent: 'Sent',
  drafts: 'Drafts',
  archive: 'Archive',
  spam: 'Spam',
  trash: 'Trash',
};

export const DEFAULT_FROM_KEY = 'gf.mail.defaultFrom';
