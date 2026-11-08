import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { countUnread } from '../components/mail/mailApi';

export function useMailUnread(enabled: boolean) {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    countUnread().then(setUnread).catch(() => setUnread(0));
  }, []);

  useEffect(() => {
    if (!enabled || !supabase) {
      setUnread(0);
      return;
    }
    refresh();
    const channel = supabase
      .channel(`mail-unread-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_messages' }, refresh)
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
  }, [enabled, refresh]);

  return { unread, refresh };
}
