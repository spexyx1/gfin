/*
  # Atomic balance RPCs and server-side sitemaster enforcement

  ## Changes

  ### 1. Atomic card balance functions
  - `increment_card_balance(p_account_id, p_amount)` — used by card-load-initiate
  - `decrement_card_balance(p_account_id, p_amount)` — used by card-authorization-webhook
  Both use UPDATE with arithmetic in the DB to avoid read-modify-write race conditions.

  ### 2. Server-side sitemaster helper
  - `is_current_user_sitemaster()` — returns true if the calling auth.uid() holds the
    sitemaster role in user_admin_roles. SECURITY DEFINER with fixed search_path so it
    cannot be hijacked. Used in RLS policies instead of client-supplied claims.

  ### 3. Search-path hardening on existing SECURITY DEFINER functions
  - Re-applies SET search_path to existing functions that were missing it.
*/

-- ─── Atomic balance helpers ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_card_balance(
  p_account_id uuid,
  p_amount     numeric
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  UPDATE public.card_accounts
  SET
    available_balance = available_balance + p_amount,
    ledger_balance    = ledger_balance    + p_amount,
    updated_at        = now()
  WHERE id = p_account_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_card_balance(
  p_account_id uuid,
  p_amount     numeric
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  UPDATE public.card_accounts
  SET
    available_balance = available_balance - p_amount,
    pending_balance   = pending_balance   + p_amount,
    updated_at        = now()
  WHERE id = p_account_id
    AND available_balance >= p_amount;
$$;

-- ─── Server-side sitemaster check ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_current_user_sitemaster()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_admin_roles
    WHERE user_id  = auth.uid()
      AND role_type = 'sitemaster'
      AND active    = true
  );
$$;

-- ─── Harden existing SECURITY DEFINER functions ────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'authenticate'
  ) THEN
    EXECUTE $f$
      ALTER FUNCTION public.authenticate(text, text)
        SET search_path = pg_catalog, public
    $f$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'add_email_to_account'
  ) THEN
    EXECUTE $f$
      ALTER FUNCTION public.add_email_to_account(uuid, text)
        SET search_path = pg_catalog, public
    $f$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN
    EXECUTE $f$
      ALTER FUNCTION public.handle_new_user()
        SET search_path = pg_catalog, public
    $f$;
  END IF;
END $$;
