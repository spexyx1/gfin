import { useEffect, useState } from 'react';
import { AlertCircle, Bell, Check, CheckCircle2, Clock, Loader2, Mailbox as MailboxIcon, ScrollText, Send, X, XCircle } from 'lucide-react';
import type { Mailbox } from './mailTypes';
import { EMAIL_RE, formatFullDate } from './mailTypes';
import {
  fetchNotificationCategories, fetchNotificationLog, sendTestEmail, setCategoryEnabled, updateMailbox,
  type NotificationCategory, type NotificationLogRow,
} from './mailApi';

type Tab = 'mailboxes' | 'test' | 'log' | 'notifications';

interface Props {
  mailboxes: Mailbox[];
  defaultMailboxId: string;
  onDefaultChange: (id: string) => void;
  onMailboxesChanged: () => void;
  onClose: () => void;
}

const TABS: { id: Tab; label: string; icon: typeof Bell }[] = [
  { id: 'mailboxes', label: 'Addresses', icon: MailboxIcon },
  { id: 'test', label: 'Test email', icon: Send },
  { id: 'log', label: 'Delivery log', icon: ScrollText },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export function MailSettings({ mailboxes, defaultMailboxId, onDefaultChange, onMailboxesChanged, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('mailboxes');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]" onClick={onClose} />
      <div className="relative w-full max-w-xl h-full bg-[#111113] border-l border-white/10 flex flex-col animate-[mailSlideIn_.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold">Mail settings</h2>
            <p className="text-xs text-neutral-500">Sending addresses, testing and notification emails</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white" aria-label="Close settings">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-1 px-4 pt-3 border-b border-white/[0.06] overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition ${
                tab === id ? 'border-[#FFD700] text-white' : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'mailboxes' && (
            <MailboxesTab mailboxes={mailboxes} defaultMailboxId={defaultMailboxId} onDefaultChange={onDefaultChange} onSaved={onMailboxesChanged} />
          )}
          {tab === 'test' && <TestTab mailboxes={mailboxes.filter((m) => m.active)} defaultMailboxId={defaultMailboxId} />}
          {tab === 'log' && <LogTab />}
          {tab === 'notifications' && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}

function MailboxesTab({ mailboxes, defaultMailboxId, onDefaultChange, onSaved }: { mailboxes: Mailbox[]; defaultMailboxId: string; onDefaultChange: (id: string) => void; onSaved: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-400">Choose which address new emails come from by default, and set the name and signature for each.</p>
      {mailboxes.map((m) => (
        <MailboxCard key={m.id} mailbox={m} isDefault={m.id === defaultMailboxId} onMakeDefault={() => onDefaultChange(m.id)} onSaved={onSaved} />
      ))}
    </div>
  );
}

function MailboxCard({ mailbox, isDefault, onMakeDefault, onSaved }: { mailbox: Mailbox; isDefault: boolean; onMakeDefault: () => void; onSaved: () => void }) {
  const [name, setName] = useState(mailbox.display_name ?? '');
  const [signature, setSignature] = useState(mailbox.signature ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState('');
  const changed = name !== (mailbox.display_name ?? '') || signature !== (mailbox.signature ?? '');

  const save = async () => {
    setState('saving');
    setError('');
    try {
      await updateMailbox(mailbox.id, { display_name: name.trim().slice(0, 80), signature: signature.slice(0, 2000) });
      setState('saved');
      onSaved();
      setTimeout(() => setState('idle'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
      setState('idle');
    }
  };

  return (
    <div className={`rounded-xl border p-4 transition ${isDefault ? 'border-[#FFD700]/40 bg-[#FFD700]/[0.03]' : 'border-white/10 bg-white/[0.02]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium truncate">{mailbox.address}</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {mailbox.can_receive ? (mailbox.is_catch_all ? 'Receives all @ghetto.finance mail' : 'Receives mail') : 'Send only'}
            {!mailbox.active && ' · Inactive'}
          </p>
        </div>
        {isDefault ? (
          <span className="flex items-center gap-1 text-xs font-medium text-[#FFD700] shrink-0"><Check className="h-3.5 w-3.5" /> Default</span>
        ) : (
          mailbox.active && <button onClick={onMakeDefault} className="text-xs text-neutral-400 hover:text-white shrink-0 rounded-md border border-white/10 px-2 py-1">Make default</button>
        )}
      </div>
      <label className="block mt-4">
        <span className="text-xs font-medium text-neutral-400">Sender name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-[#FFD700]/50" />
      </label>
      <label className="block mt-3">
        <span className="text-xs font-medium text-neutral-400">Signature</span>
        <textarea value={signature} onChange={(e) => setSignature(e.target.value)} rows={3} placeholder="Added to the end of new emails" className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none resize-y focus:border-[#FFD700]/50 placeholder:text-neutral-600" />
      </label>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      {(changed || state !== 'idle') && (
        <div className="flex justify-end mt-3">
          <button onClick={save} disabled={state === 'saving' || !changed} className="flex items-center gap-1.5 rounded-lg bg-[#FFD700] text-black font-semibold px-4 py-1.5 text-sm hover:bg-[#ffe033] disabled:opacity-60 transition">
            {state === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {state === 'saved' ? <><Check className="h-3.5 w-3.5" /> Saved</> : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

function TestTab({ mailboxes, defaultMailboxId }: { mailboxes: Mailbox[]; defaultMailboxId: string }) {
  const [from, setFrom] = useState(defaultMailboxId);
  const [to, setTo] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = to.trim().toLowerCase();
    if (!EMAIL_RE.test(addr)) {
      setState('error');
      setMessage('Enter a valid email address.');
      return;
    }
    setState('sending');
    setMessage('');
    try {
      await sendTestEmail(from, addr);
      setState('sent');
      setMessage(`Test email sent to ${addr}. It also appears in your Sent folder.`);
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'Sending failed');
    }
  };

  return (
    <form onSubmit={send} className="space-y-4">
      <p className="text-sm text-neutral-400">Send a quick test to make sure outgoing email is working.</p>
      <label className="block">
        <span className="text-xs font-medium text-neutral-400">Send from</span>
        <select value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none [&>option]:bg-[#141416]">
          {mailboxes.map((m) => <option key={m.id} value={m.id}>{m.address}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-neutral-400">Send to</span>
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@example.com" className="mt-1 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm outline-none focus:border-[#FFD700]/50 placeholder:text-neutral-600" />
      </label>
      <button type="submit" disabled={state === 'sending'} className="flex items-center gap-2 rounded-lg bg-[#FFD700] text-black font-semibold px-4 py-2 text-sm hover:bg-[#ffe033] disabled:opacity-60 transition">
        {state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send test
      </button>
      {message && (
        <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm border ${state === 'sent' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-red-500/20 bg-red-500/10 text-red-300'}`}>
          {state === 'sent' ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />} {message}
        </div>
      )}
    </form>
  );
}

const STATUS_STYLE: Record<string, { cls: string; icon: typeof Check }> = {
  sent: { cls: 'text-emerald-300 bg-emerald-500/10', icon: CheckCircle2 },
  delivered: { cls: 'text-emerald-300 bg-emerald-500/10', icon: CheckCircle2 },
  failed: { cls: 'text-red-300 bg-red-500/10', icon: XCircle },
  bounced: { cls: 'text-red-300 bg-red-500/10', icon: XCircle },
  skipped: { cls: 'text-neutral-400 bg-white/5', icon: Clock },
};

function LogTab() {
  const [rows, setRows] = useState<NotificationLogRow[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotificationLog().then(setRows).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!rows) return <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-400">The latest 50 notification emails sent to users. Mail you send yourself is in the Sent folder.</p>
      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center">
          <ScrollText className="h-6 w-6 mx-auto text-neutral-600" />
          <p className="text-sm text-neutral-400 mt-2">No notification emails yet</p>
        </div>
      )}
      <ul className="space-y-2">
        {rows.map((r) => {
          const key = r.delivery_status || r.status;
          const style = STATUS_STYLE[key] ?? { cls: 'text-amber-300 bg-amber-500/10', icon: Clock };
          const Icon = style.icon;
          return (
            <li key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate flex-1">{r.subject || r.event_type}</p>
                <span className={`flex items-center gap-1 text-[11px] font-medium rounded-md px-2 py-0.5 capitalize ${style.cls}`}><Icon className="h-3 w-3" />{key}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1 truncate">
                {r.to_email || 'No address'} · {r.category} · {formatFullDate(r.sent_at || r.created_at)}
                {r.attempts > 1 && ` · ${r.attempts} attempts`}
              </p>
              {r.error && <p className="text-xs text-red-400 mt-1">{r.error}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NotificationsTab() {
  const [cats, setCats] = useState<NotificationCategory[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchNotificationCategories().then(setCats).catch((err) => setError(err.message));
  }, []);

  const toggle = async (c: NotificationCategory) => {
    setBusy(c.category);
    setError('');
    try {
      await setCategoryEnabled(c.category, !c.enabled);
      setCats((prev) => prev?.map((x) => (x.category === c.category ? { ...x, enabled: !c.enabled } : x)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update');
    } finally {
      setBusy(null);
    }
  };

  if (!cats) return error ? <p className="text-sm text-red-400">{error}</p> : <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-400">
        Automatic emails sent from yo@ghetto.finance. Turning a type off here stops it for everyone. Each user can also turn types off for themselves in their settings or from the unsubscribe link.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/10">
        {cats.map((c) => (
          <li key={c.category} className="flex items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{c.label}</p>
              {c.description && <p className="text-xs text-neutral-500 mt-0.5">{c.description}</p>}
            </div>
            <button
              onClick={() => toggle(c)}
              disabled={busy === c.category}
              role="switch"
              aria-checked={c.enabled}
              aria-label={`${c.label} emails`}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${c.enabled ? 'bg-[#FFD700]' : 'bg-neutral-700'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${c.enabled ? 'left-6' : 'left-1'}`} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
