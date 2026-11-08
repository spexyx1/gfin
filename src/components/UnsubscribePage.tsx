import { useEffect, useState } from 'react';
import { ArrowLeft, BellOff, BellRing, Loader2, MailX } from 'lucide-react';
import { supabase } from '../lib/supabase';

type State = 'working' | 'unsubscribed' | 'resubscribed' | 'error';

async function callUnsubscribe(token: string, category: string, action: 'unsubscribe' | 'resubscribe') {
  if (!supabase) throw new Error('Service unavailable. Please try again later.');
  const { data, error } = await supabase.functions.invoke('email-unsubscribe', { body: { token, category, action } });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const body = ctx && typeof ctx.json === 'function' ? await ctx.json().catch(() => null) : null;
    throw new Error(body?.error || 'We could not update your email preferences.');
  }
  if (!data?.ok) throw new Error(data?.error || 'We could not update your email preferences.');
  return data as { label: string };
}

export function UnsubscribePage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') ?? '';
  const category = params.get('category') ?? 'all';
  const [state, setState] = useState<State>('working');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Email preferences – ghetto.finance';
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setState('error');
      setError('This unsubscribe link is incomplete. Open the link from your email again.');
      return;
    }
    callUnsubscribe(token, category, 'unsubscribe')
      .then((d) => {
        setLabel(d.label);
        setState('unsubscribed');
      })
      .catch((err) => {
        setError(err.message);
        setState('error');
      });
  }, [token, category]);

  const change = async (action: 'unsubscribe' | 'resubscribe') => {
    setBusy(true);
    setError('');
    try {
      const d = await callUnsubscribe(token, category, action);
      setLabel(d.label);
      setState(action === 'unsubscribe' ? 'unsubscribed' : 'resubscribed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const what = label ? label.toLowerCase() : 'these emails';

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-neutral-100 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full bg-[#FFD700]/10 blur-[120px]" />
      <div className="relative w-full max-w-md animate-[fadeIn_.4s_ease-out]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-8 text-center">
          {state === 'working' && (
            <>
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-[#FFD700]" />
              <p className="mt-4 text-sm text-neutral-400">Updating your email preferences...</p>
            </>
          )}
          {state === 'unsubscribed' && (
            <>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[#FFD700]/10 text-[#FFD700] flex items-center justify-center">
                <BellOff className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-xl font-semibold">You're unsubscribed</h1>
              <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                We won't send you {category === 'all' ? 'any more notification emails' : `${what} anymore`}. You can change this any time in your account settings.
              </p>
              <button onClick={() => change('resubscribe')} disabled={busy} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Undo, keep sending
              </button>
            </>
          )}
          {state === 'resubscribed' && (
            <>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <BellRing className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-xl font-semibold">You're subscribed again</h1>
              <p className="mt-2 text-sm text-neutral-400">We'll keep sending you {category === 'all' ? 'notification emails' : what}.</p>
              <button onClick={() => change('unsubscribe')} disabled={busy} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Unsubscribe instead
              </button>
            </>
          )}
          {state === 'error' && (
            <>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <MailX className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-xl font-semibold">Link not valid</h1>
              <p className="mt-2 text-sm text-neutral-400">{error}</p>
              <p className="mt-2 text-xs text-neutral-500">You can also manage emails from Settings after signing in.</p>
            </>
          )}
          {error && state !== 'error' && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
        <a href="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-neutral-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Go to ghetto.finance
        </a>
      </div>
    </div>
  );
}
