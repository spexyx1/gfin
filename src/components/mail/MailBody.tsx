import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, FileText, Image as ImageIcon, Loader2, Paperclip } from 'lucide-react';
import type { MailAttachment, MailMessage } from './mailTypes';
import { formatBytes } from './mailTypes';
import { attachmentUrl } from './mailApi';
import { ConfirmDialog } from './ConfirmDialog';

const FRAME_BASE = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'; frame-src 'none'; form-action 'none'"><base target="_blank"><style>html,body{margin:0;padding:0;background:#fff;color:#111;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;word-wrap:break-word}img{max-width:100%;height:auto}body{padding:16px}blockquote{border-left:3px solid #ddd;margin:0 0 0 4px;padding-left:12px;color:#555}</style>`;

export function MailBody({ message }: { message: MailMessage }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(120);
  const html = message.body_html?.trim();

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => {
      const doc = el.contentDocument;
      if (doc?.body) setHeight(Math.min(Math.max(doc.documentElement.scrollHeight, 60), 20000));
    };
    el.addEventListener('load', measure);
    const t = setInterval(measure, 600);
    const stop = setTimeout(() => clearInterval(t), 5000);
    return () => {
      el.removeEventListener('load', measure);
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [html]);

  if (!html) {
    return <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-neutral-200">{message.body_text || '(empty message)'}</pre>;
  }

  return (
    <iframe
      ref={frame}
      title="Message content"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      srcDoc={FRAME_BASE + html}
      style={{ height }}
      className="w-full rounded-lg bg-white border-0"
    />
  );
}

const RISKY_TYPES = /executable|zip|rar|7z|tar|gz|script|ms-?dos|vnd\.microsoft|macro/i;

export function AttachmentChips({ attachments, senderDomain }: { attachments: MailAttachment[]; senderDomain: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [confirmAtt, setConfirmAtt] = useState<MailAttachment | null>(null);

  const open = async (a: MailAttachment) => {
    setBusy(a.id);
    setError('');
    try {
      const url = await attachmentUrl(a.storage_path, a.filename);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open attachment');
    } finally {
      setBusy(null);
    }
  };

  const request = (a: MailAttachment) => {
    const risky = RISKY_TYPES.test(a.content_type) || /\.(zip|rar|7z|tar|gz|exe|scr|bat|cmd|js|jar|htm|html?|docm|xlsm|lnk|iso|apk)$/i.test(a.filename);
    if (risky) {
      setConfirmAtt(a);
    } else {
      open(a);
    }
  };

  if (attachments.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="flex items-center gap-1.5 text-xs text-neutral-500 mb-2">
        <Paperclip className="h-3.5 w-3.5" /> {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
      </p>
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => {
          const Icon = a.content_type.startsWith('image/') ? ImageIcon : FileText;
          return (
            <button
              key={a.id}
              onClick={() => request(a)}
              className="group flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] pl-2.5 pr-3 py-2 text-left hover:border-[#FFD700]/40 hover:bg-white/[0.05] transition max-w-[240px]"
            >
              <Icon className="h-4 w-4 text-neutral-400 shrink-0" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-neutral-200">{a.filename}</span>
                <span className="block text-[11px] text-neutral-500">{formatBytes(a.size_bytes)}</span>
              </span>
              {busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" /> : <Download className="h-3.5 w-3.5 text-neutral-500 group-hover:text-[#FFD700] transition" />}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      {confirmAtt && (
        <ConfirmDialog
          kind="warning"
          title="Download this attachment?"
          body={`"${confirmAtt.filename}" contains a file type that can carry malware. Only open it if you trust the sender (${senderDomain || 'unknown sender'}) and expected this file.`}
          confirmLabel="Download anyway"
          onConfirm={() => {
            const a = confirmAtt;
            setConfirmAtt(null);
            open(a);
          }}
          onCancel={() => setConfirmAtt(null)}
          busy={busy !== null}
        />
      )}
    </div>
  );
}
