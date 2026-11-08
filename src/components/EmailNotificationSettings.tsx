import { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

type PrefKey = 'account_emails' | 'order_updates' | 'dispute_updates' | 'message_notifications' | 'offer_notifications';

const TYPES: { key: PrefKey; label: string; description: string }[] = [
  { key: 'account_emails', label: 'Account', description: 'Welcome and important account notices' },
  { key: 'order_updates', label: 'Orders', description: 'New orders, shipping and delivery updates' },
  { key: 'dispute_updates', label: 'Disputes', description: 'When a dispute is opened or resolved' },
  { key: 'message_notifications', label: 'Messages', description: 'New direct messages while you are away' },
  { key: 'offer_notifications', label: 'Offers', description: 'Offers made on your listings and replies to yours' },
];

type Prefs = Record<PrefKey, boolean> & { notification_email: string | null };

const DEFAULTS: Prefs = {
  account_emails: true, order_updates: true, dispute_updates: true, message_notifications: true, offer_notifications: true, notification_email: null,
};

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

export function EmailNotificationSettings({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setError('Email settings are unavailable right now.');
      return;
    }
    let live = true;
    (async () => {
      const [{ data, error: prefErr }, { data: authEmail }] = await Promise.all([
        supabase!
          .from('notification_preferences')
          .select('account_emails, order_updates, dispute_updates, message_notifications, offer_notifications, notification_email')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase!.rpc('get_auth_email_for_user'),
      ]);
      if (!live) return;
      if (prefErr) {
        logger.error('Failed to load email preferences', 'EmailNotificationSettings', prefErr);
        setError('Could not load your email settings.');
        return;
      }
      const loaded = { ...DEFAULTS, ...(data ?? {}) } as Prefs;
      setPrefs(loaded);
      setEmailDraft(loaded.notification_email ?? '');
      setAccountEmail(typeof authEmail === 'string' && EMAIL_RE.test(authEmail) ? authEmail : null);
    })();
    return () => {
      live = false;
    };
  }, [userId]);

  const save = async (patch: Partial<Prefs>, key: string) => {
    if (!supabase || !prefs) return;
    const next = { ...prefs, ...patch };
    setSaving(key);
    setError('');
    setPrefs(next);
    const { error: upErr } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    setSaving(null);
    if (upErr) {
      logger.error('Failed to save email preferences', 'EmailNotificationSettings', upErr);
      setPrefs(prefs);
      setError('Could not save your change. Please try again.');
      return false;
    }
    return true;
  };

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = emailDraft.trim().toLowerCase();
    if (value && !EMAIL_RE.test(value)) {
      setError('Enter a valid email address, or leave it empty.');
      return;
    }
    if (await save({ notification_email: value || null }, 'email')) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const allOff = prefs ? TYPES.every((t) => !prefs[t.key]) : false;
  const destination = prefs?.notification_email || accountEmail;

  return (
    <div className="luxe-glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-start gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-luxe-gold/10 flex items-center justify-center shrink-0">
          <Mail className="h-5 w-5 text-luxe-gold" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white">Email Notifications</h3>
          <p className="text-gray-400 text-sm mt-1">Choose which emails we send you. Every email also has an unsubscribe link.</p>
        </div>
      </div>

      {!prefs && !error && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {prefs && (
        <>
          <form onSubmit={saveEmail} className="mb-6">
            <label className="block text-white font-medium mb-1">Send emails to</label>
            <p className="text-gray-400 text-sm mb-2">
              {accountEmail ? `Leave empty to use your account email (${accountEmail}).` : 'Your account has no email, so add one here to receive notifications.'} Only you can see this.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder={accountEmail ?? 'you@example.com'}
                className="flex-1 px-4 py-3 luxe-glass border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-luxe-gold"
              />
              <button
                type="submit"
                disabled={saving === 'email' || emailDraft.trim().toLowerCase() === (prefs.notification_email ?? '')}
                className="px-5 py-3 rounded-lg bg-luxe-gold text-black font-bold disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {saving === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
            {!destination && <p className="mt-2 text-sm text-amber-300">No email on file, so we can't send you anything yet.</p>}
          </form>

          <div className="space-y-1 divide-y divide-white/5">
            {TYPES.map((t) => (
              <div key={t.key} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-white font-medium">{t.label}</p>
                  <p className="text-gray-400 text-sm">{t.description}</p>
                </div>
                <button
                  onClick={() => save({ [t.key]: !prefs[t.key] } as Partial<Prefs>, t.key)}
                  disabled={saving === t.key}
                  role="switch"
                  aria-checked={prefs[t.key]}
                  aria-label={`${t.label} emails`}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${prefs[t.key] ? 'bg-luxe-gold' : 'bg-gray-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs[t.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => save(Object.fromEntries(TYPES.map((t) => [t.key, allOff])) as Partial<Prefs>, 'all')}
              disabled={saving === 'all'}
              className="text-sm text-gray-400 hover:text-white underline-offset-4 hover:underline disabled:opacity-50"
            >
              {allOff ? 'Turn all emails back on' : 'Turn off all emails'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
