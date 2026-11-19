import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LayoutDashboard, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMailUnread } from '../../hooks/useMailUnread';
import { supabase } from '../../lib/supabase';
import type { ComposeSeed, MailAttachment, MailFilter, MailLabel, MailMessage, Mailbox } from './mailTypes';
import { DEFAULT_FROM_KEY, FOLDER_LABELS, formatFullDate } from './mailTypes';
import {
  PAGE_SIZE, createLabel, deleteLabel, deleteForever, fetchAttachments, fetchLabels, fetchMailboxes, fetchMessages, fetchThread,
  moveMessages, restoreMessages, seedFromDraft, updateMessages,
} from './mailApi';
import { MailAccessDenied, MailLoading, MailSignIn } from './MailSignIn';
import { MailSidebar } from './MailSidebar';
import { MessageList } from './MessageList';
import { ThreadView, type ReplyMode, type ThreadAction } from './ThreadView';
import { ComposeModal } from './ComposeModal';
import { MailSettings } from './MailSettings';
import { ConfirmDialog } from './ConfirmDialog';

export interface PendingConfirm {
  kind: 'confirm' | 'warning';
  title: string;
  body: string;
  reasons?: string[];
  confirmLabel: string;
  run: () => Promise<void>;
}

const MAIL_FAVICON =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%23FFD700'/><path d='M14 22h36v22H14z' fill='none' stroke='%23000' stroke-width='4' stroke-linejoin='round'/><path d='M14 22l18 13 18-13' fill='none' stroke='%23000' stroke-width='4' stroke-linejoin='round'/></svg>";

function useMailDocument(unread: number) {
  useEffect(() => {
    const prevTitle = document.title;
    const icons = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]'));
    const prevHrefs = icons.map((l) => l.href);
    icons.forEach((l) => (l.href = MAIL_FAVICON));
    return () => {
      document.title = prevTitle;
      icons.forEach((l, i) => (l.href = prevHrefs[i]));
    };
  }, []);

  useEffect(() => {
    document.title = `${unread > 0 ? `(${unread}) ` : ''}Mail – ghetto.finance`;
  }, [unread]);
}

const htmlToText = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
const bodyText = (m: MailMessage) => (m.body_text?.trim() ? m.body_text : htmlToText(m.body_html || ''));

export function MailApp() {
  const { user, isLoading, login, logout } = useAuth();
  const [booted, setBooted] = useState(false);
  const [access, setAccess] = useState<'checking' | 'yes' | 'no'>('checking');

  useEffect(() => {
    if (!isLoading) setBooted(true);
  }, [isLoading]);

  useEffect(() => {
    if (!user || !supabase) {
      setAccess('checking');
      return;
    }
    let live = true;
    setAccess('checking');
    supabase.rpc('is_current_user_sitemaster').then(({ data, error }) => {
      if (live) setAccess(!error && data === true ? 'yes' : 'no');
    });
    return () => {
      live = false;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { unread, refresh: refreshUnread } = useMailUnread(access === 'yes');
  useMailDocument(unread);

  if (!booted) return <MailLoading />;
  if (!user) return <MailSignIn onSignIn={login} />;
  if (access === 'checking') return <MailLoading />;
  if (access === 'no') return <MailAccessDenied onSignOut={logout} />;
  return <Inbox unread={unread} refreshUnread={refreshUnread} onSignOut={logout} username={user.username} />;
}

interface InboxProps {
  unread: number;
  refreshUnread: () => void;
  onSignOut: () => void;
  username: string;
}

function Inbox({ unread, refreshUnread, onSignOut, username }: InboxProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<MailFilter>({ folder: 'inbox', label: null, address: null, search: '' });
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [labels, setLabels] = useState<MailLabel[]>([]);
  const [selected, setSelected] = useState<MailMessage | null>(null);
  const [thread, setThread] = useState<MailMessage[]>([]);
  const [threadAtts, setThreadAtts] = useState<MailAttachment[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [compose, setCompose] = useState<ComposeSeed | null>(null);
  const [composeKey, setComposeKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [defaultFrom, setDefaultFrom] = useState(() => localStorage.getItem(DEFAULT_FROM_KEY) ?? '');
  const reqId = useRef(0);

  const defaultMailboxId = useMemo(() => {
    const senders = mailboxes.filter((m) => m.active);
    return senders.find((m) => m.id === defaultFrom)?.id ?? senders.find((m) => m.address.startsWith('info@'))?.id ?? senders[0]?.id ?? '';
  }, [mailboxes, defaultFrom]);

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  };

  const loadList = useCallback(async (append = false) => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const offset = append ? messages.length : 0;
      const rows = await fetchMessages(filter, offset);
      if (id !== reqId.current) return;
      setMessages((prev) => (append ? [...prev, ...rows] : rows));
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      if (id === reqId.current) setError(err instanceof Error ? err.message : 'Could not load messages');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [filter, messages.length]);

  const loadThread = useCallback(async (m: MailMessage, quiet = false) => {
    if (!quiet) setThreadLoading(true);
    setThreadError('');
    try {
      const rows = await fetchThread(m.thread_id, m.folder === 'trash');
      const list = rows.length ? rows : [m];
      setThread(list);
      setThreadAtts(await fetchAttachments(list.filter((r) => r.has_attachments).map((r) => r.id)));
      return list;
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : 'Could not load conversation');
      return [];
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const loadMeta = useCallback(() => {
    fetchMailboxes().then(setMailboxes).catch(() => undefined);
    fetchLabels().then(setLabels).catch(() => undefined);
  }, []);

  useEffect(loadMeta, [loadMeta]);

  useEffect(() => {
    setMessages([]);
    loadList(false);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const latest = useRef({ loadList, loadThread, selected });
  latest.current = { loadList, loadThread, selected };

  useEffect(() => {
    if (!supabase) return;
    let timer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel(`mail-app-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_messages' }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          latest.current.loadList(false);
          if (latest.current.selected) latest.current.loadThread(latest.current.selected, true);
        }, 400);
      })
      .subscribe();
    return () => {
      clearTimeout(timer);
      supabase?.removeChannel(channel);
    };
  }, []);

  const changeFilter = (f: Partial<MailFilter>) => {
    setFilter((prev) => ({ ...prev, ...f, search: f.folder && f.folder !== prev.folder ? '' : f.search ?? prev.search }));
    setSelected(null);
    setThread([]);
    setSidebarOpen(false);
  };

  const openMessage = async (m: MailMessage) => {
    if (m.folder === 'drafts') {
      setCompose(seedFromDraft(m));
      setComposeKey((k) => k + 1);
      return;
    }
    setSelected(m);
    const list = await loadThread(m);
    const unreadIds = list.filter((r) => !r.is_read && r.direction === 'inbound').map((r) => r.id);
    if (unreadIds.length) {
      await updateMessages(unreadIds, { is_read: true }).catch(() => undefined);
      setMessages((prev) => prev.map((x) => (unreadIds.includes(x.id) ? { ...x, is_read: true } : x)));
      refreshUnread();
    }
  };

  const closeThread = () => {
    setSelected(null);
    setThread([]);
  };

  const runThreadAction = async (a: ThreadAction) => {
    const ms = thread;
    if (a === 'unread') {
      await updateMessages(ms.filter((m) => m.direction === 'inbound').map((m) => m.id), { is_read: false });
    } else if (a === 'delete') {
      await deleteForever(ms.map((m) => m.id));
    } else if (a === 'restore') {
      await restoreMessages(ms);
    } else {
      const target = a === 'notspam' ? 'inbox' : a;
      await moveMessages(ms.filter((m) => m.folder !== target && !(target === 'inbox' && m.direction === 'outbound')), target);
    }
    const labelsFor: Record<ThreadAction, string> = {
      archive: 'Archived', inbox: 'Moved to inbox', spam: 'Marked as spam', notspam: 'Moved to inbox', trash: 'Moved to trash',
      restore: 'Restored', delete: 'Deleted forever', unread: 'Marked unread',
    };
    showToast(labelsFor[a]);
    closeThread();
    refreshUnread();
    loadList(false);
  };

  const threadAction = (a: ThreadAction) => {
    const suspicious = thread.some((m) => m.is_suspicious);
    if (a === 'delete') {
      setPending({
        kind: 'confirm',
        title: 'Delete forever?',
        body: 'This conversation and its attachments will be permanently deleted. This cannot be undone.',
        confirmLabel: 'Delete forever',
        run: () => runThreadAction(a),
      });
    } else if (a === 'spam' && !suspicious) {
      setPending({
        kind: 'confirm',
        title: 'Report as spam?',
        body: 'The conversation will be moved to the Spam folder.',
        confirmLabel: 'Report spam',
        run: () => runThreadAction(a),
      });
    } else {
      setPending(null);
      runThreadAction(a).catch((err) => showToast(err instanceof Error ? err.message : 'Action failed', true));
    }
  };

  const bulk = async (ids: string[], action: 'read' | 'unread' | 'archive' | 'trash') => {
    const ms = messages.filter((m) => ids.includes(m.id));
    try {
      if (action === 'read' || action === 'unread') await updateMessages(ids, { is_read: action === 'read' });
      else await moveMessages(ms, action);
      if (selected && ids.includes(selected.id) && (action === 'archive' || action === 'trash')) closeThread();
      refreshUnread();
      await loadList(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', true);
    }
  };

  const toggleStar = async (m: MailMessage) => {
    const anyStarred = thread.length && selected?.thread_id === m.thread_id ? thread.some((t) => t.is_starred) : m.is_starred;
    const ids = anyStarred && selected?.thread_id === m.thread_id ? thread.filter((t) => t.is_starred).map((t) => t.id) : [m.id];
    const value = !anyStarred;
    setMessages((prev) => prev.map((x) => (ids.includes(x.id) ? { ...x, is_starred: value } : x)));
    setThread((prev) => prev.map((x) => (ids.includes(x.id) ? { ...x, is_starred: value } : x)));
    try {
      await updateMessages(ids, { is_starred: value });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update', true);
      loadList(false);
    }
  };

  const toggleLabel = async (name: string) => {
    const has = thread.some((m) => m.labels.includes(name));
    try {
      for (const m of thread) {
        const next = has ? m.labels.filter((l) => l !== name) : Array.from(new Set([...m.labels, name]));
        await updateMessages([m.id], { labels: next });
      }
      setThread((prev) => prev.map((m) => ({ ...m, labels: has ? m.labels.filter((l) => l !== name) : Array.from(new Set([...m.labels, name])) })));
      loadList(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update labels', true);
    }
  };

  const reply = (m: MailMessage, mode: ReplyMode) => {
    const own = new Set([...mailboxes.map((b) => b.address.toLowerCase()), (m.delivered_to ?? '').toLowerCase()]);
    const origin = m.direction === 'inbound' ? m.from_name ? `${m.from_name} <${m.from_address}>` : m.from_address : 'you';
    const text = bodyText(m);
    if (mode === 'forward') {
      setCompose({
        mailboxId: m.mailbox_id,
        subject: /^fwd?:/i.test(m.subject) ? m.subject : `Fwd: ${m.subject}`,
        body: `\n\n---------- Forwarded message ----------\nFrom: ${m.from_name ? `${m.from_name} <${m.from_address}>` : m.from_address}\nDate: ${formatFullDate(m.received_at || m.sent_at || m.created_at)}\nSubject: ${m.subject}\nTo: ${m.to_addresses.join(', ')}\n\n${text}`,
        forwardAttachments: threadAtts.filter((a) => a.message_id === m.id),
      });
    } else {
      const primary = m.direction === 'inbound' ? [m.reply_to || m.from_address] : m.to_addresses;
      const others = mode === 'replyAll' ? [...m.to_addresses, ...m.cc_addresses] : [];
      const to = Array.from(new Set(primary.map((a) => a.toLowerCase())));
      const cc = Array.from(new Set(others.map((a) => a.toLowerCase()))).filter((a) => !own.has(a) && !to.includes(a));
      const quoted = text.split('\n').map((l) => `> ${l}`).join('\n');
      setCompose({
        mailboxId: m.mailbox_id,
        to,
        cc,
        subject: /^re:/i.test(m.subject) ? m.subject : `Re: ${m.subject}`,
        body: `\n\nOn ${formatFullDate(m.received_at || m.sent_at || m.created_at)}, ${origin} wrote:\n${quoted}`,
        threadId: m.thread_id,
        inReplyTo: m.message_id_header,
        references: [m.references_header, m.message_id_header].filter(Boolean).join(' ') || null,
      });
    }
    setComposeKey((k) => k + 1);
  };

  const removeLabel = async (l: MailLabel) => {
    if (!window.confirm(`Delete the label "${l.name}"? Messages keep their content.`)) return;
    try {
      await deleteLabel(l.id);
      setLabels((prev) => prev.filter((x) => x.id !== l.id));
      if (filter.label === l.name) changeFilter({ label: null });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete label', true);
    }
  };

  const title = filter.label ? filter.label : filter.address ? filter.address : FOLDER_LABELS[filter.folder];

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0b0b0c] text-neutral-100 font-sans antialiased">
      <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-white/[0.06] bg-[#0e0e10]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#FFD700] text-black flex items-center justify-center">
            <Mail className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="text-sm font-semibold">Mail</p>
            <p className="text-[11px] text-neutral-500">ghetto.finance</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="hidden md:block text-xs text-neutral-500 mr-2">Signed in as {username}</span>
          <button onClick={() => navigate('/sitemaster')} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition">
            <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Back to dashboard</span>
          </button>
          <button onClick={onSignOut} className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white transition" title="Sign out" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex relative">
        {sidebarOpen && <div className="lg:hidden fixed inset-0 z-30 bg-black/60 animate-[fadeIn_.2s_ease-out]" onClick={() => setSidebarOpen(false)} />}
        <div className={`fixed lg:static z-40 top-0 bottom-0 left-0 w-64 shrink-0 transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <MailSidebar
            filter={filter}
            unread={unread}
            labels={labels}
            mailboxes={mailboxes}
            onChange={changeFilter}
            onCompose={() => {
              setCompose({});
              setComposeKey((k) => k + 1);
              setSidebarOpen(false);
            }}
            onSettings={() => {
              setSettingsOpen(true);
              setSidebarOpen(false);
            }}
            onCreateLabel={async (name, color) => {
              try {
                await createLabel(name, color);
                setLabels(await fetchLabels());
              } catch (err) {
                showToast(err instanceof Error ? err.message : 'Could not create label', true);
              }
            }}
            onDeleteLabel={removeLabel}
          />
        </div>

        <div className={`${selected ? 'hidden lg:flex' : 'flex'} w-full lg:w-[380px] xl:w-[420px] shrink-0 border-r border-white/[0.06] flex-col min-w-0`}>
          <MessageList
            title={title}
            messages={messages}
            labels={labels}
            loading={loading}
            error={error}
            hasMore={hasMore}
            selectedId={selected?.id ?? null}
            search={filter.search}
            onSearch={(search) => setFilter((prev) => ({ ...prev, search }))}
            onOpen={openMessage}
            onToggleStar={toggleStar}
            onLoadMore={() => loadList(true)}
            onRefresh={() => {
              loadList(false);
              refreshUnread();
            }}
            onMenu={() => setSidebarOpen(true)}
            onBulk={bulk}
          />
        </div>

        <div className={`${selected ? 'flex' : 'hidden lg:flex'} flex-1 min-w-0 flex-col`}>
          <ThreadView
            messages={thread}
            attachments={threadAtts}
            labels={labels}
            loading={threadLoading}
            error={threadError}
            onBack={closeThread}
            onAction={threadAction}
            onReply={reply}
            onToggleLabel={toggleLabel}
            onToggleStar={toggleStar}
          />
        </div>
      </div>

      {compose && (
        <ComposeModal
          key={composeKey}
          seed={compose}
          mailboxes={mailboxes}
          defaultMailboxId={defaultMailboxId}
          onClose={() => {
            setCompose(null);
            if (filter.folder === 'drafts') loadList(false);
          }}
          onSent={() => {
            setCompose(null);
            showToast('Message sent');
            loadList(false);
            if (selected) loadThread(selected, true);
          }}
        />
      )}

      {settingsOpen && (
        <MailSettings
          mailboxes={mailboxes}
          defaultMailboxId={defaultMailboxId}
          onDefaultChange={(id) => {
            localStorage.setItem(DEFAULT_FROM_KEY, id);
            setDefaultFrom(id);
          }}
          onMailboxesChanged={loadMeta}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {pending && (
        <ConfirmDialog
          kind={pending.kind}
          title={pending.title}
          body={pending.body}
          reasons={pending.reasons}
          confirmLabel={pending.confirmLabel}
          busy={false}
          onConfirm={() => {
            const run = pending.run;
            setPending(null);
            run().catch((err) => showToast(err instanceof Error ? err.message : 'Action failed', true));
          }}
          onCancel={() => setPending(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2.5 text-sm font-medium shadow-2xl animate-[mailPop_.2s_ease-out]">
          {toast.error ? <AlertCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />} {toast.msg}
        </div>
      )}
    </div>
  );
}
