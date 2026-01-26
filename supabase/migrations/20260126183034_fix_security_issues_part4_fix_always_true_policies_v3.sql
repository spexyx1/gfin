/*
  # Security Fix - Part 4: Fix Always-True RLS Policies
  
  ## Overview
  This migration fixes RLS policies that have always-true conditions, which effectively
  bypass row-level security. Since these are system policies, we'll make them more restrictive.
  
  ## Changes
  1. Remove always-true policies that bypass security
  2. Replace with admin-only policies using correct enum values
*/

-- Remove the always-true policy from partnership_revenues
DROP POLICY IF EXISTS "System can create revenue records" ON public.partnership_revenues;

-- Add a more restrictive policy for partnership revenues
CREATE POLICY "Admins can manage revenue records"
  ON public.partnership_revenues FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = (select auth.uid())
      AND user_admin_roles.role_type = 'sitemaster'::admin_role_type
      AND user_admin_roles.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = (select auth.uid())
      AND user_admin_roles.role_type = 'sitemaster'::admin_role_type
      AND user_admin_roles.active = true
    )
  );

-- Remove the always-true policy from transaction_reputation
DROP POLICY IF EXISTS "System updates transaction reputation" ON public.transaction_reputation;

-- Add moderator-only policies for transaction_reputation
CREATE POLICY "Moderators manage transaction reputation"
  ON public.transaction_reputation FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = (select auth.uid())
      AND user_admin_roles.role_type IN ('sitemaster'::admin_role_type, 'mediator'::admin_role_type)
      AND user_admin_roles.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = (select auth.uid())
      AND user_admin_roles.role_type IN ('sitemaster'::admin_role_type, 'mediator'::admin_role_type)
      AND user_admin_roles.active = true
    )
  );

-- Remove the always-true policy from transaction_reputation_history
DROP POLICY IF EXISTS "System creates reputation history" ON public.transaction_reputation_history;

-- Add moderator-only policy for transaction_reputation_history
CREATE POLICY "Moderators create reputation history"
  ON public.transaction_reputation_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_admin_roles.user_id = (select auth.uid())
      AND user_admin_roles.role_type IN ('sitemaster'::admin_role_type, 'mediator'::admin_role_type)
      AND user_admin_roles.active = true
    )
  );
