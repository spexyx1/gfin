import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Loader2, Maximize2, Minimize2, Paperclip, Send, Trash2, X } from 'lucide-react';
import type { ComposeSeed, MailAttachment, Mailbox } from './mailTypes';
import { EMAIL_RE, formatBytes, parseAddressList } from './mailTypes';
import { copyAttachment, deleteForever, fetchAttachments, removeAttachment, saveDraft, sendDraft, uploadAttachment } from './mailApi';

const MAX_FILE = 25 * 1024 * 1024;
const MAX_TOTAL = 35 * 1024 * 1024;

interface Props {
  seed: ComposeSeed;
  mailboxes: Mailbox[];
  defaultMailboxId: string;
  onClose: () => void;
  onSent: () => void;
}

export function ComposeModal({ seed, mailboxes, defaultMailboxId, onClose, onSent }: Props) {
  const senders = mailboxes.filter((m) => m.active);
  const initialMailbox = seed.mailboxId && senders.some((m) => m.id === seed.mailboxId) ? seed.mailboxId : defaultMailboxId;
  const signatureFor = (id: string) => senders.find((m) => m.id === id)?.signature?.trim() ?? '';

  const [mailboxId, setMailboxId] = useState(initialMailbox);
  const [to, setTo] = useState((seed.to ?? []).join(', '));
  const [cc, setCc] = useState((seed.cc ?? []).join(', '));
  const [bcc, setBcc] = useState((seed.bcc ?? []).join(', '));
  const [showCc, setShowCc] = useState(Boolean(seed.cc?.length || seed.bcc?.length));
  const [subject, setSubject] = useState(seed.subject ?? '');
  const [body, setBody] = useState(() => {
    if (seed.draftId) return seed.body ?? '';
    const sig = signatureFor(initialMailbox);
    return `${sig ? `\n\n-- \n${sig}` : ''}${seed.body ?? ''}`;
  });
  const [attachments, setAttachments] = useState<MailAttachment[]>([]);
  const [draftId, setDraftId] = useState<string | null>(seed.draftId ?? null);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [maximized, setMaximized] = useState(false);

  const chain = useRef<Promise<string | null>>(Promise.resolve(seed.draftId ?? null));
  const fileInput = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const fields = useCallback(
    () => ({
      mailboxId,
      to: parseAddressList(to),
      cc: parseAddressList(cc),
      bcc: parseAddressList(bcc),
      subject,
      body,
      threadId: seed.threadId,
      inReplyTo: seed.inReplyTo,
      references: seed.references,
      hasAttachments: attachments.length > 0,
    }),
    [mailboxId, to, cc, bcc, subject, body, seed.threadId, seed.inReplyTo, seed.references, attachments.length],
  );

  const persist = useCallback(() => {
    const snapshot = fields();
    chain.current = chain.current
      .catch(() => draftId)
      .then(async (current) => {
        setSaveState('saving');
        const id = await saveDraft(current, snapshot);
        setDraftId(id);
        setSaveState('saved');
        return id;
      });
    chain.current.catch(() => setSaveState('error'));
    return chain.current;
  }, [fields, draftId]);

  useEffect(() => {
    if (seed.draftId) {
      fetchAttachments([seed.draftId]).then(setAttachments).catch(() => undefined);
    }
    if (seed.forwardAttachments?.length) {
      (async () => {
        setUploading(true);
        try {
          const id = await persist();
          if (!id) return;
          const copied: MailAttachment[] = [];
          for (const a of seed.forwardAttachments ?? []) copied.push(await copyAttachment(id, a));
          setAttachments((prev) => [...prev, ...copied]);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not include attachments');
        } finally {
          setUploading(false);
        }
      })();
    }
    if (seed.inReplyTo || seed.forwardAttachments || seed.subject?.startsWith('Fwd:')) {
      setTimeout(() => {
        bodyRef.current?.focus();
        bodyRef.current?.setSelectionRange(0, 0);
      }, 50);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      setDirty(false);
      persist();
    }, 1500);
    return () => clearTimeout(t);
  }, [dirty, persist, to, cc, bcc, subject, body, mailboxId]);

  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
    if (saveState === 'saved') setSaveState('idle');
  };

  const changeMailbox = (id: string) => {
    const oldSig = signatureFor(mailboxId);
    const newSig = signatureFor(id);
    if (oldSig && body.includes(`-- \n${oldSig}`)) setBody(body.replace(`-- \n${oldSig}`, newSig ? `-- \n${newSig}` : ''));
    edit(setMailboxId)(id);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    const list = Array.from(files);
    const tooBig = list.find((f) => f.size > MAX_FILE);
    if (tooBig) return setError(`${tooBig.name} is larger than 25 MB.`);
    const total = attachments.reduce((s, a) => s + a.size_bytes, 0) + list.reduce((s, f) => s + f.size, 0);
    if (total > MAX_TOTAL) return setError('Attachments can add up to 35 MB per email.');
    setUploading(true);
    try {
      const id = await persist();
      if (!id) throw new Error('Could not save draft');
      for (const f of list) {
        const att = await uploadAttachment(id, f);
        setAttachments((prev) => [...prev, att]);
      }
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const dropAttachment = async (a: MailAttachment) => {
    try {
      await removeAttachment(a);
      setAttachments((prev) => prev.filter((x) => x.id !== a.id));
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove attachment');
    }
  };

  const send = async () => {
    setError('');
    const f = fields();
    const all = [...f.to, ...f.cc, ...f.bcc];
    if (f.to.length === 0) return setError('Add at least one recipient.');
    const bad = all.find((a) => !EMAIL_RE.test(a));
    if (bad) return setError(`"${bad}" doesn't look like an email address.`);
    if (!f.subject.trim() && !window.confirm('Send without a subject?')) return;
    setSending(true);
    try {
      const id = await persist();
      if (!id) throw new Error('Could not save draft');
      await sendDraft(id);
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sending failed');
      setSending(false);
    }
  };

  const discard = async () => {
    if ((body.trim() || subject.trim() || to.trim()) && !window.confirm('Discard this draft?')) return;
    try {
      const id = await chain.current.catch(() => draftId);
      if (id) await deleteForever([id]);
    } catch {
      /* draft may already be gone */
    }
    onClose();
  };

  const close = async () => {
    if (dirty) await persist().catch(() => undefined);
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send();
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const inputCls = 'flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-neutral-600 py-2.5';
  const shell = maximized
    ? 'inset-0 sm:inset-6 sm:rounded-2xl'
    : 'inset-0 sm:inset-auto sm:right-6 sm:bottom-0 sm:w-[560px] sm:h-[600px] sm:rounded-t-2xl';

  return (
    <div className={`fixed z-50 ${shell} flex flex-col bg-[#141416] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] animate-[mailPop_.22s_ease-out]`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <p className="text-sm font-semibold flex-1 truncate">{subject || (seed.inReplyTo ? 'Reply' : 'New message')}</p>
        <span className="text-xs text-neutral-500 flex items-center gap-1">
          {saveState === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Saving</>}
          {saveState === 'saved' && <><Check className="h-3 w-3" /> Draft saved</>}
          {saveState === 'error' && <span className="text-red-400">Not saved</span>}
        </span>
        <button onClick={() => setMaximized((v) => !v)} className="hidden sm:block p-1.5 rounded-md text-neutral-400 hover:bg-white/5 hover:text-white" aria-label="Resize">
          {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        <button onClick={close} className="p-1.5 rounded-md text-neutral-400 hover:bg-white/5 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 divide-y divide-white/[0.06] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 w-10">From</span>
          <select value={mailboxId} onChange={(e) => changeMailbox(e.target.value)} className={`${inputCls} cursor-pointer [&>option]:bg-[#141416]`}>
            {senders.map((m) => (
              <option key={m.id} value={m.id}>{m.display_name ? `${m.display_name} <${m.address}>` : m.address}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 w-10">To</span>
          <input autoFocus={!seed.inReplyTo} value={to} onChange={(e) => edit(setTo)(e.target.value)} placeholder="name@example.com" className={inputCls} />
          {!showCc && <button onClick={() => setShowCc(true)} className="text-xs text-neutral-500 hover:text-white">Cc Bcc</button>}
        </div>
        {showCc && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 w-10">Cc</span>
              <input value={cc} onChange={(e) => edit(setCc)(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 w-10">Bcc</span>
              <input value={bcc} onChange={(e) => edit(setBcc)(e.target.value)} className={inputCls} />
            </div>
          </>
        )}
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 w-10">Subject</span>
          <input value={subject} onChange={(e) => edit(setSubject)(e.target.value)} className={`${inputCls} font-medium`} />
        </div>
      </div>

      <textarea
        ref={bodyRef}
        value={body}
        onChange={(e) => edit(setBody)(e.target.value)}
        placeholder="Write your message..."
        className="flex-1 min-h-0 w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-neutral-600"
      />

      {(attachments.length > 0 || uploading) && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-white/[0.06]">
          {attachments.map((a) => (
            <span key={a.id} className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 pl-2.5 pr-1.5 py-1 text-xs max-w-[220px]">
              <Paperclip className="h-3 w-3 text-neutral-500 shrink-0" />
              <span className="truncate">{a.filename}</span>
              <span className="text-neutral-500 shrink-0">{formatBytes(a.size_bytes)}</span>
              <button onClick={() => dropAttachment(a)} className="p-0.5 rounded text-neutral-500 hover:text-white" aria-label={`Remove ${a.filename}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {uploading && <span className="flex items-center gap-1.5 text-xs text-neutral-400"><Loader2 className="h-3 w-3 animate-spin" /> Uploading</span>}
        </div>
      )}

      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]">
        <button
          onClick={send}
          disabled={sending || uploading}
          className="flex items-center gap-2 rounded-lg bg-[#FFD700] text-black font-semibold px-5 py-2 text-sm hover:bg-[#ffe033] active:scale-[0.98] transition disabled:opacity-60"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Sending' : 'Send'}
        </button>
        <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <button onClick={() => fileInput.current?.click()} disabled={uploading} className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white transition" aria-label="Attach files" title="Attach files">
          <Paperclip className="h-4 w-4" />
        </button>
        <span className="hidden sm:block text-[11px] text-neutral-600 ml-1">Ctrl + Enter to send</span>
        <button onClick={discard} className="ml-auto p-2 rounded-lg text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition" aria-label="Discard draft" title="Discard draft">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
