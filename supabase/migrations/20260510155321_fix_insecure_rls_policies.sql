/*
  # Fix insecure RLS policies

  ## Changes

  1. suspension_overrides — "View suspension overrides" used USING(true) exposing all
     records to any authenticated user. Restrict to admins/moderators only.

  2. activity_logs — "Admins can view activity logs" was on {public} role (unauthenticated).
     Drop it; the authenticated-role policies already cover admin access.

  3. fund_release_requests — "Admins manage fund requests" uses FOR ALL which conflates
     SELECT/INSERT/UPDATE/DELETE into one policy. Split into explicit policies.

  4. partnership_revenues — same FOR ALL pattern, split into explicit policies.
*/

-- ─── suspension_overrides ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "View suspension overrides" ON public.suspension_overrides;

CREATE POLICY "Admins and moderators can view suspension overrides"
  ON public.suspension_overrides
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
        AND user_admin_roles.role_type = ANY (ARRAY[
          'sitemaster'::admin_role_type,
          'mediator'::admin_role_type,
          'sub_moderator'::admin_role_type
        ])
        AND user_admin_roles.active = true
    )
  );

-- ─── activity_logs ─────────────────────────────────────────────────────────

-- Drop the unauthenticated {public} policy — authenticated policies already cover admins
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;

-- ─── fund_release_requests — split FOR ALL into explicit policies ──────────

DROP POLICY IF EXISTS "Admins manage fund requests" ON public.fund_release_requests;

CREATE POLICY "Admins can select fund release requests"
  ON public.fund_release_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
        AND user_admin_roles.role_type = ANY (ARRAY['sitemaster'::admin_role_type, 'treasurer'::admin_role_type])
        AND user_admin_roles.active = true
    )
  );

CREATE POLICY "Admins can update fund release requests"
  ON public.fund_release_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
        AND user_admin_roles.role_type = ANY (ARRAY['sitemaster'::admin_role_type, 'treasurer'::admin_role_type])
        AND user_admin_roles.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
        AND user_admin_roles.role_type = ANY (ARRAY['sitemaster'::admin_role_type, 'treasurer'::admin_role_type])
        AND user_admin_roles.active = true
    )
  );

-- ─── partnership_revenues — split FOR ALL into explicit policies ───────────

DROP POLICY IF EXISTS "Admins can manage revenue records" ON public.partnership_revenues;

CREATE POLICY "Admins can select partnership revenues"
  ON public.partnership_revenues
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = ( SELECT auth.uid())
        AND user_admin_roles.role_type = 'sitemaster'::admin_role_type
        AND user_admin_roles.active = true
    )
  );

CREATE POLICY "Admins can insert partnership revenues"
  ON public.partnership_revenues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = ( SELECT auth.uid())
        AND user_admin_roles.role_type = 'sitemaster'::admin_role_type
        AND user_admin_roles.active = true
    )
  );

CREATE POLICY "Admins can update partnership revenues"
  ON public.partnership_revenues
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = ( SELECT auth.uid())
        AND user_admin_roles.role_type = 'sitemaster'::admin_role_type
        AND user_admin_roles.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = ( SELECT auth.uid())
        AND user_admin_roles.role_type = 'sitemaster'::admin_role_type
        AND user_admin_roles.active = true
    )
  );
