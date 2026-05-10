import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '../utils/logger';

export function useSitemasterRole() {
  const [issitemaster, setIssitemaster] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIssitemaster(false);
      return;
    }

    if (!supabase) {
      logger.error('Supabase client not available', 'useSitemasterRole');
      setIssitemaster(false);
      return;
    }

    supabase
      .from('user_admin_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role_type', 'sitemaster')
      .eq('active', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          logger.error('Role check failed', 'useSitemasterRole', error);
          setIssitemaster(false);
          return;
        }
        setIssitemaster(!!data);
      });
  }, [user]);

  return { issitemaster };
}
