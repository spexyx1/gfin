import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle, Archive, ArrowLeft, ChevronDown, Forward, Inbox, Loader2, Mail, Reply, ReplyAll, RotateCcw, ShieldAlert, ShieldCheck, Star, Tag, Trash2, Check,
} from 'lucide-react';
import type { MailAttachment, MailLabel, MailMessage } from './mailTypes';
import { formatFullDate, initials, messageDate } from './mailTypes';
import { AttachmentChips, MailBody } from './MailBody';

export type ThreadAction = 'archive' | 'inbox' | 'spam' | 'notspam' | 'trash' | 'restore' | 'delete' | 'unread';
export type ReplyMode = 'reply' | 'replyAll' | 'forward';

interface Props {
  messages: MailMessage[];
  attachments: MailAttachment[];
  labels: MailLabel[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onAction: (a: ThreadAction) => Promise<void>;
  onReply: (m: MailMessage, mode: ReplyMode) => void;
  onToggleLabel: (name: string) => Promise<void>;
  onToggleStar: (m: MailMessage) => void;
}

export function ThreadView(p: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<ThreadAction | null>(null);
  const [actionError, setActionError] = useState('');
  const [labelMenu, setLabelMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const last = p.messages[p.messages.length - 1];
  const threadKey = p.messages[0]?.thread_id;

  useEffect(() => {
    setExpanded(new Set(last ? [last.id] : []));
    setActionError('');
  }, [threadKey, last?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!labelMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setLabelMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [labelMenu]);

  if (p.loading && p.messages.length === 0) {
    return <div className="h-full flex items-center justify-center bg-[#0b0b0c]"><Loader2 className="h-5 w-5 animate-spin text-neutral-500" /></div>;
  }

  if (!last) {
    return (
      <div className="h-full hidden lg:flex flex-col items-center justify-center text-center bg-[#0b0b0c] px-6">
        {p.error ? (
          <p className="text-sm text-red-400">{p.error}</p>
        ) : (
          <>
            <div className="h-16 w-16 rounded-2xl bg-[#FFD700]/10 flex items-center justify-center mb-4">
              <Mail className="h-7 w-7 text-[#FFD700]" />
            </div>
            <p className="font-medium">Select a message</p>
            <p className="text-sm text-neutral-500 mt-1">Pick a conversation from the list to read it here.</p>
          </>
        )}
      </div>
    );
  }

  const folder = last.folder;
  const threadLabels = Array.from(new Set(p.messages.flatMap((m) => m.labels)));
  const anyStarred = p.messages.some((m) => m.is_starred);

  const run = async (a: ThreadAction) => {
    if (a === 'delete' && !window.confirm('Delete this conversation forever? This cannot be undone.')) return;
    setBusy(a);
    setActionError('');
    try {
      await p.onAction(a);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const toggleOpen = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const actions: { a: ThreadAction; label: string; icon: typeof Archive; show: boolean; danger?: boolean }[] = [
    { a: 'archive', label: 'Archive', icon: Archive, show: folder === 'inbox' },
    { a: 'inbox', label: 'Move to inbox', icon: Inbox, show: folder === 'archive' },
    { a: 'spam', label: 'Report spam', icon: ShieldAlert, show: folder === 'inbox' || folder === 'archive' },
    { a: 'notspam', label: 'Not spam', icon: ShieldCheck, show: folder === 'spam' },
    { a: 'restore', label: 'Restore', icon: RotateCcw, show: folder === 'trash' },
    { a: 'trash', label: 'Move to trash', icon: Trash2, show: folder !== 'trash' },
    { a: 'delete', label: 'Delete forever', icon: Trash2, show: folder === 'trash' || folder === 'spam', danger: true },
    { a: 'unread', label: 'Mark unread', icon: Mail, show: last.direction === 'inbound' || p.messages.some((m) => m.direction === 'inbound') },
  ];

  return (
    <article className="h-full flex flex-col bg-[#0b0b0c] min-w-0 animate-[mailSlideIn_.2s_ease-out]">
      <header className="flex items-center gap-1 px-3 sm:px-5 py-2.5 border-b border-white/[0.06]">
        <button onClick={p.onBack} className="lg:hidden p-2 -ml-1 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white" aria-label="Back to list">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {actions.filter((x) => x.show).map(({ a, label, icon: Icon, danger }) => (
          <button
            key={a}
            onClick={() => run(a)}
            disabled={busy !== null}
            title={label}
            aria-label={label}
            className={`p-2 rounded-lg transition disabled:opacity-40 ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
          >
            {busy === a ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
          </button>
        ))}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setLabelMenu((v) => !v)} title="Labels" aria-label="Labels" className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white transition">
            <Tag className="h-4 w-4" />
          </button>
          {labelMenu && (
            <div className="absolute left-0 top-full mt-1 z-20 w-52 rounded-xl border border-white/10 bg-[#141416] shadow-2xl p-1.5 animate-[fadeIn_.15s_ease-out]">
              {p.labels.length === 0 && <p className="px-3 py-2 text-xs text-neutral-500">Create labels from the sidebar.</p>}
              {p.labels.map((l) => {
                const on = threadLabels.includes(l.name);
                return (
                  <button key={l.id} onClick={() => p.onToggleLabel(l.name)} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-200 hover:bg-white/5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="flex-1 text-left truncate">{l.name}</span>
                    {on && <Check className="h-3.5 w-3.5 text-[#FFD700]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={() => p.onToggleStar(last)}
          title={anyStarred ? 'Unstar' : 'Star'}
          className={`ml-auto p-2 rounded-lg transition hover:bg-white/5 ${anyStarred ? 'text-[#FFD700]' : 'text-neutral-400 hover:text-white'}`}
        >
          <Star className="h-4 w-4" fill={anyStarred ? 'currentColor' : 'none'} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-tight">{last.subject || '(no subject)'}</h1>
          {(threadLabels.length > 0 || actionError) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {threadLabels.map((name) => {
                const color = p.labels.find((l) => l.name === name)?.color ?? '#a3a3a3';
                return <span key={name} className="text-xs font-medium rounded-md px-2 py-0.5" style={{ color, backgroundColor: `${color}1f` }}>{name}</span>;
              })}
              {actionError && <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle className="h-3.5 w-3.5" />{actionError}</span>}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {p.messages.map((m) => {
              const open = expanded.has(m.id);
              const who = m.direction === 'outbound' ? `${m.from_name || 'You'}` : m.from_name || m.from_address;
              const atts = p.attachments.filter((a) => a.message_id === m.id);
              return (
                <div key={m.id} className={`rounded-xl border transition ${open ? 'border-white/10 bg-white/[0.02]' : 'border-white/[0.05] hover:border-white/10'}`}>
                  <button onClick={() => toggleOpen(m.id)} className="w-full flex items-start gap-3 p-4 text-left">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${m.direction === 'outbound' ? 'bg-[#FFD700]/15 text-[#FFD700]' : 'bg-sky-500/15 text-sky-300'}`}>
                      {initials(who)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-semibold truncate">{who}</p>
                        {m.direction === 'inbound' && m.from_name && <p className="text-xs text-neutral-500 truncate">{m.from_address}</p>}
                        <span className="ml-auto text-xs text-neutral-500 shrink-0">{formatFullDate(messageDate(m))}</span>
                      </div>
                      {open ? (
                        <p className="text-xs text-neutral-500 mt-0.5 truncate">
                          to {m.to_addresses.join(', ') || m.delivered_to || '-'}
                          {m.cc_addresses.length > 0 && ` · cc ${m.cc_addresses.join(', ')}`}
                        </p>
                      ) : (
                        <p className="text-sm text-neutral-500 mt-0.5 truncate">{m.snippet}</p>
                      )}
                      {m.status === 'failed' && <p className="text-xs text-red-400 mt-1">Not delivered: {m.error || 'sending failed'}</p>}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-neutral-500 mt-1 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-4 pb-4 sm:pl-16 animate-[fadeIn_.2s_ease-out]">
                      <MailBody message={m} />
                      <AttachmentChips attachments={atts} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {folder !== 'trash' && folder !== 'spam' && (
            <div className="flex flex-wrap gap-2 mt-6">
              <ReplyBtn onClick={() => p.onReply(last, 'reply')} icon={Reply} label="Reply" primary />
              <ReplyBtn onClick={() => p.onReply(last, 'replyAll')} icon={ReplyAll} label="Reply all" />
              <ReplyBtn onClick={() => p.onReply(last, 'forward')} icon={Forward} label="Forward" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ReplyBtn({ onClick, icon: Icon, label, primary }: { onClick: () => void; icon: typeof Reply; label: string; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${
        primary ? 'bg-[#FFD700] text-black hover:bg-[#ffe033]' : 'border border-white/10 text-neutral-200 hover:bg-white/5'
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
