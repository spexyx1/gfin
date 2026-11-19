import { useEffect, useState } from 'react';
import { Archive, Loader2, Mail, MailOpen, Menu, Paperclip, RefreshCw, Search, Star, Trash2, AlertCircle, Inbox, X, ShieldAlert } from 'lucide-react';
import type { MailLabel, MailMessage } from './mailTypes';
import { formatListDate, initials, messageDate, senderLabel } from './mailTypes';

interface Props {
  title: string;
  messages: MailMessage[];
  labels: MailLabel[];
  loading: boolean;
  error: string;
  hasMore: boolean;
  selectedId: string | null;
  search: string;
  onSearch: (s: string) => void;
  onOpen: (m: MailMessage) => void;
  onToggleStar: (m: MailMessage) => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  onMenu: () => void;
  onBulk: (ids: string[], action: 'read' | 'unread' | 'archive' | 'trash') => Promise<void>;
}

const AVATAR_TONES = ['bg-amber-500/15 text-amber-300', 'bg-emerald-500/15 text-emerald-300', 'bg-sky-500/15 text-sky-300', 'bg-orange-500/15 text-orange-300', 'bg-teal-500/15 text-teal-300', 'bg-rose-500/15 text-rose-300'];
const toneFor = (s: string) => AVATAR_TONES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];

export function MessageList(p: Props) {
  const [query, setQuery] = useState(p.search);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => setQuery(p.search), [p.search]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (query !== p.search) p.onSearch(query);
    }, 350);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setChecked((prev) => new Set([...prev].filter((id) => p.messages.some((m) => m.id === id))));
  }, [p.messages]);

  const labelColor = (name: string) => p.labels.find((l) => l.name === name)?.color ?? '#a3a3a3';

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runBulk = async (action: 'read' | 'unread' | 'archive' | 'trash') => {
    setBulkBusy(true);
    try {
      await p.onBulk([...checked], action);
      setChecked(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  const allChecked = p.messages.length > 0 && checked.size === p.messages.length;

  return (
    <section className="h-full flex flex-col bg-[#0b0b0c] min-w-0">
      <header className="px-4 pt-4 pb-3 border-b border-white/[0.06] space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={p.onMenu} className="lg:hidden -ml-1 p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white" aria-label="Open folders">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold tracking-tight flex-1 truncate">{p.title}</h2>
          <button onClick={p.onRefresh} className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white transition" aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${p.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mail"
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] pl-9 pr-8 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-[#FFD700]/40 focus:bg-white/[0.06] transition"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-white" aria-label="Clear search">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {p.messages.length > 0 && (
          <div className="flex items-center gap-1 h-7">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={() => setChecked(allChecked ? new Set() : new Set(p.messages.map((m) => m.id)))}
              className="h-3.5 w-3.5 accent-[#FFD700] mr-2"
              aria-label="Select all"
            />
            {checked.size > 0 ? (
              <div className="flex items-center gap-0.5 animate-[fadeIn_.15s_ease-out]">
                <span className="text-xs text-neutral-400 mr-2">{checked.size} selected</span>
                {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin text-neutral-400" /> : (
                  <>
                    <BulkBtn label="Mark read" onClick={() => runBulk('read')}><MailOpen className="h-4 w-4" /></BulkBtn>
                    <BulkBtn label="Mark unread" onClick={() => runBulk('unread')}><Mail className="h-4 w-4" /></BulkBtn>
                    <BulkBtn label="Archive" onClick={() => runBulk('archive')}><Archive className="h-4 w-4" /></BulkBtn>
                    <BulkBtn label="Move to trash" onClick={() => runBulk('trash')}><Trash2 className="h-4 w-4" /></BulkBtn>
                  </>
                )}
              </div>
            ) : (
              <span className="text-xs text-neutral-500">{p.messages.length}{p.hasMore ? '+' : ''} messages</span>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {p.error && (
          <div className="m-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {p.error}
          </div>
        )}
        {p.loading && p.messages.length === 0 && (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-1/3 rounded bg-white/5" />
                  <div className="h-3 w-2/3 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!p.loading && !p.error && p.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Inbox className="h-6 w-6 text-neutral-500" />
            </div>
            <p className="font-medium">{p.search ? 'No matches' : 'Nothing here'}</p>
            <p className="text-sm text-neutral-500 mt-1">{p.search ? 'Try a different search.' : 'Messages will show up here as they arrive.'}</p>
          </div>
        )}
        <ul>
          {p.messages.map((m) => {
            const who = senderLabel(m);
            const unread = !m.is_read && m.direction === 'inbound';
            const active = p.selectedId === m.id;
            return (
              <li key={m.id} className="relative">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => p.onOpen(m)}
                  onKeyDown={(e) => e.key === 'Enter' && p.onOpen(m)}
                  className={`group flex gap-3 px-4 py-3 cursor-pointer border-b border-white/[0.04] transition ${
                    active ? 'bg-[#FFD700]/[0.07]' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {active && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#FFD700]" />}
                  <div className="relative shrink-0">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold transition-opacity ${toneFor(who)} ${checked.has(m.id) ? 'opacity-0' : 'group-hover:opacity-0'}`}>
                      {initials(who)}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked.has(m.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggle(m.id)}
                      className={`absolute inset-0 m-auto h-4 w-4 accent-[#FFD700] transition-opacity ${checked.has(m.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      aria-label="Select message"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {unread && <span className="h-2 w-2 rounded-full bg-[#FFD700] shrink-0" />}
                      <p className={`flex-1 truncate text-sm ${unread ? 'font-semibold text-white' : 'text-neutral-300'}`}>{who}</p>
                      {m.has_attachments && <Paperclip className="h-3.5 w-3.5 text-neutral-500 shrink-0" />}
                      <span className={`text-xs shrink-0 ${unread ? 'text-[#FFD700]' : 'text-neutral-500'}`}>{formatListDate(messageDate(m))}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={`flex-1 truncate text-sm ${unread ? 'text-neutral-100' : 'text-neutral-400'}`}>{m.subject || '(no subject)'}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          p.onToggleStar(m);
                        }}
                        className={`shrink-0 transition ${m.is_starred ? 'text-[#FFD700]' : 'text-neutral-600 opacity-0 group-hover:opacity-100 hover:text-neutral-300'}`}
                        aria-label={m.is_starred ? 'Unstar' : 'Star'}
                      >
                        <Star className="h-3.5 w-3.5" fill={m.is_starred ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <p className="truncate text-xs text-neutral-500 mt-0.5">{m.snippet}</p>
                    {(m.labels.length > 0 || m.status === 'failed' || (m.delivered_to && m.direction === 'inbound')) && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {m.status === 'failed' && <span className="text-[10px] font-medium rounded px-1.5 py-0.5 bg-red-500/15 text-red-300">Failed</span>}
                        {m.is_suspicious && (
                          <span className="flex items-center gap-1 text-[10px] font-medium rounded px-1.5 py-0.5 bg-amber-500/15 text-amber-300">
                            <ShieldAlert className="h-3 w-3" /> Suspicious
                          </span>
                        )}
                        {m.delivered_to && m.direction === 'inbound' && (
                          <span className="text-[10px] rounded px-1.5 py-0.5 bg-white/5 text-neutral-400">{m.delivered_to}</span>
                        )}
                        {m.labels.map((l) => (
                          <span key={l} className="text-[10px] font-medium rounded px-1.5 py-0.5" style={{ color: labelColor(l), backgroundColor: `${labelColor(l)}1f` }}>
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {p.hasMore && (
          <div className="p-4">
            <button onClick={p.onLoadMore} disabled={p.loading} className="w-full rounded-lg border border-white/10 py-2 text-sm text-neutral-300 hover:bg-white/5 transition disabled:opacity-50">
              {p.loading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function BulkBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="p-1.5 rounded-md text-neutral-400 hover:bg-white/5 hover:text-white transition">
      {children}
    </button>
  );
}
