import { useState } from 'react';
import { Archive, AtSign, FileText, Inbox, Plus, Send, Settings, ShieldAlert, Star, Tag, Trash2, X } from 'lucide-react';
import type { MailFilter, MailFolder, MailLabel, Mailbox } from './mailTypes';
import { FOLDER_LABELS } from './mailTypes';

const FOLDER_ICONS: Record<MailFolder, typeof Inbox> = {
  inbox: Inbox,
  starred: Star,
  sent: Send,
  drafts: FileText,
  archive: Archive,
  spam: ShieldAlert,
  trash: Trash2,
};

const FOLDERS: MailFolder[] = ['inbox', 'starred', 'sent', 'drafts', 'archive', 'spam', 'trash'];
const LABEL_COLORS = ['#FFD700', '#22c55e', '#3b82f6', '#f97316', '#ef4444', '#14b8a6', '#eab308'];

interface Props {
  filter: MailFilter;
  unread: number;
  labels: MailLabel[];
  mailboxes: Mailbox[];
  onChange: (f: Partial<MailFilter>) => void;
  onCompose: () => void;
  onSettings: () => void;
  onCreateLabel: (name: string, color: string) => Promise<void>;
  onDeleteLabel: (label: MailLabel) => void;
}

export function MailSidebar({ filter, unread, labels, mailboxes, onChange, onCompose, onSettings, onCreateLabel, onDeleteLabel }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(LABEL_COLORS[0]);

  const submitLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    await onCreateLabel(n.slice(0, 40), color);
    setName('');
    setAdding(false);
  };

  const navBtn = (active: boolean) =>
    `group w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
      active ? 'bg-[#FFD700]/10 text-[#FFD700] font-medium' : 'text-neutral-300 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <aside className="h-full flex flex-col bg-[#0e0e10] border-r border-white/[0.06]">
      <div className="p-4">
        <button
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FFD700] text-black font-semibold py-3 text-sm shadow-[0_8px_24px_rgba(255,215,0,0.18)] hover:bg-[#ffe033] hover:shadow-[0_8px_28px_rgba(255,215,0,0.3)] active:scale-[0.98] transition"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Compose
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-6">
        <div className="space-y-0.5">
          {FOLDERS.map((f) => {
            const Icon = FOLDER_ICONS[f];
            const active = filter.folder === f && !filter.label && !filter.address;
            return (
              <button key={f} onClick={() => onChange({ folder: f, label: null, address: null })} className={navBtn(active)}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{FOLDER_LABELS[f]}</span>
                {f === 'inbox' && unread > 0 && (
                  <span className="min-w-[22px] rounded-full bg-[#FFD700] text-black text-[11px] font-semibold px-1.5 py-0.5 text-center">
                    {unread > 999 ? '999+' : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Delivered to</p>
          <div className="space-y-0.5">
            {mailboxes.filter((m) => m.can_receive).map((m) => {
              const active = filter.address === m.address;
              return (
                <button key={m.id} onClick={() => onChange({ folder: 'inbox', label: null, address: active ? null : m.address })} className={navBtn(active)}>
                  <AtSign className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{m.address}</span>
                </button>
              );
            })}
            <AddressFilter current={filter.address} known={mailboxes.map((m) => m.address)} onApply={(address) => onChange({ folder: 'inbox', label: null, address })} />
          </div>
        </div>

        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Labels</p>
            <button onClick={() => setAdding((v) => !v)} className="text-neutral-500 hover:text-white transition" aria-label="Add label">
              {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          </div>
          {adding && (
            <form onSubmit={submitLabel} className="mx-2 mb-2 p-2 rounded-lg bg-white/[0.03] border border-white/10 animate-[fadeIn_.2s_ease-out]">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Label name"
                className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-600 px-1 py-1"
              />
              <div className="flex items-center gap-1.5 mt-2 px-1">
                {LABEL_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`h-4 w-4 rounded-full transition ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0e0e10]' : 'opacity-70 hover:opacity-100'}`}
                    aria-label={`Color ${c}`}
                  />
                ))}
                <button type="submit" className="ml-auto text-xs font-semibold text-[#FFD700] hover:underline">Add</button>
              </div>
            </form>
          )}
          <div className="space-y-0.5">
            {labels.length === 0 && !adding && <p className="px-3 py-1 text-xs text-neutral-600">No labels yet</p>}
            {labels.map((l) => {
              const active = filter.label === l.name;
              return (
                <div key={l.id} className="relative group">
                  <button onClick={() => onChange({ label: active ? null : l.name, address: null, folder: 'inbox' })} className={navBtn(active)}>
                    <Tag className="h-4 w-4 shrink-0" style={{ color: l.color }} />
                    <span className="flex-1 text-left truncate">{l.name}</span>
                  </button>
                  <button
                    onClick={() => onDeleteLabel(l)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition"
                    aria-label={`Delete label ${l.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-2 border-t border-white/[0.06]">
        <button onClick={onSettings} className={navBtn(false)}>
          <Settings className="h-4 w-4" /> Mail settings
        </button>
      </div>
    </aside>
  );
}

function AddressFilter({ current, known, onApply }: { current: string | null; known: string[]; onApply: (a: string | null) => void }) {
  const [value, setValue] = useState('');
  const custom = current && !known.includes(current) ? current : null;

  if (custom) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-[#FFD700]/10 text-[#FFD700]">
        <AtSign className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{custom}</span>
        <button onClick={() => onApply(null)} aria-label="Clear address filter"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim().toLowerCase();
        if (!v) return;
        onApply(v.includes('@') ? v : `${v}@ghetto.finance`);
        setValue('');
      }}
      className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-neutral-400 focus-within:bg-white/5"
    >
      <Plus className="h-4 w-4 shrink-0" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="any@ghetto.finance"
        className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-neutral-600 text-neutral-200"
      />
    </form>
  );
}
