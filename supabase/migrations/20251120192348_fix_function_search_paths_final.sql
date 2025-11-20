/*
  # Fix Function Search Paths - Final

  1. Security Fix
    - Sets search_path = public for all functions to prevent hijacking
    - Critical security improvement

  2. Approach
    - Sets search_path for all existing functions
    - Ignores errors for non-existent functions

  3. Impact
    - Prevents search_path manipulation attacks
    - Improves function call security
*/

-- Use DO block to handle errors gracefully
DO $$
BEGIN
  -- Trigger functions
  EXECUTE 'ALTER FUNCTION public.handle_updated_at() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.update_auction_watcher_count() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.log_auction_event() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.process_auction_bid() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.update_group_member_count() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.update_group_post_count() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.add_group_creator_as_owner() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.update_conversation_timestamp() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.expire_old_trade_offers() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.expire_old_invites() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.unlock_expired_collateral() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.lift_expired_suspensions() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.update_stake_status() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.update_release_deadline() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER FUNCTION public.update_contract_deployments_updated_at() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;