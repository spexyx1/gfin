import { supabase } from '../lib/supabase';
import { logger } from './logger';

export type AdminRole = 'sitemaster' | 'treasurer' | 'mediator';

/** Returns true if the currently authenticated user has the given active admin role. */
export async function hasAdminRole(role: AdminRole): Promise<boolean> {
  try {
    if (!supabase) return false;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_admin_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role_type', role)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      logger.error('Admin role check failed', 'adminRoles', error);
      return false;
    }
    return !!data;
  } catch (err) {
    logger.error('Admin role check exception', 'adminRoles', err);
    return false;
  }
}
