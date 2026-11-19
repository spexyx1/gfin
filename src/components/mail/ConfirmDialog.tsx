import { AlertTriangle, ShieldAlert } from 'lucide-react';

export interface ConfirmDialogProps {
  kind: 'confirm' | 'warning';
  title: string;
  body: string;
  reasons?: string[];
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export function ConfirmDialog({ kind, title, body, reasons, confirmLabel, onConfirm, onCancel, busy }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 animate-[fadeIn_.15s_ease-out]" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141416] shadow-2xl p-5 animate-[mailPop_.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${kind === 'warning' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
            {kind === 'warning' ? <ShieldAlert className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-snug">{title}</h3>
            <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{body}</p>
            {reasons && reasons.length > 0 && (
              <ul className="mt-2.5 space-y-1">
                {reasons.map((r) => (
                  <li key={r} className="flex items-start gap-1.5 text-xs text-amber-300">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-400 shrink-0" /> {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-200 hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50 ${
              kind === 'warning' ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-red-600 text-white hover:bg-red-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
