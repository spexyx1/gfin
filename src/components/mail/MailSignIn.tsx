import { useState } from 'react';
import { ArrowLeft, Loader2, Lock, Mail, ShieldAlert } from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
}

function GateShell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full bg-[#FFD700]/10 blur-[120px]" />
      <div className="relative w-full max-w-sm animate-[fadeIn_.4s_ease-out]">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-[#FFD700] text-black flex items-center justify-center shadow-[0_8px_32px_rgba(255,215,0,0.25)]">
            <Mail className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight">Mail</p>
            <p className="text-xs text-neutral-400">ghetto.finance</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

interface SignInProps {
  onSignIn: (username: string, password: string) => Promise<void>;
}

export function MailSignIn({ onSignIn }: SignInProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSignIn(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Sign in failed. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <GateShell>
      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Sign in to Mail</h1>
          <p className="text-sm text-neutral-400 mt-1">Restricted to site administrators.</p>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-neutral-400">Username</span>
          <input
            autoFocus
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[#FFD700]/60 focus:ring-2 focus:ring-[#FFD700]/20 transition"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-neutral-400">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[#FFD700]/60 focus:ring-2 focus:ring-[#FFD700]/20 transition"
          />
        </label>
        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FFD700] text-black font-semibold py-2.5 text-sm hover:bg-[#ffe033] active:scale-[0.99] transition disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <a href="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-neutral-400 hover:text-white transition">
        <ArrowLeft className="h-4 w-4" /> Back to ghetto.finance
      </a>
    </GateShell>
  );
}

interface DeniedProps {
  onSignOut: () => void;
}

export function MailAccessDenied({ onSignOut }: DeniedProps) {
  return (
    <GateShell>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold">No access</h1>
        <p className="text-sm text-neutral-400 mt-2">Mail is only available to site administrators. Sign in with a different account or head back to the marketplace.</p>
        <div className="mt-6 flex gap-2">
          <a href="/" className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm hover:bg-white/5 transition">Marketplace</a>
          <button onClick={onSignOut} className="flex-1 rounded-lg bg-[#FFD700] text-black font-semibold py-2.5 text-sm hover:bg-[#ffe033] transition">
            Switch account
          </button>
        </div>
      </div>
    </GateShell>
  );
}

export function MailLoading() {
  return (
    <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
      <Loader2 className="h-6 w-6 text-[#FFD700] animate-spin" />
    </div>
  );
}
