/*
  # Security Fix Part 5: Fix Always-True RLS Policies

  1. Changes
    - Fix RLS policies that have always-true WITH CHECK clauses
    - These policies effectively bypass row-level security

  2. Tables Affected
    - auto_moderation_logs: Restrict system inserts to service role only
    - business_inquiries: Remove unrestricted public insert access

  3. Security
    - Prevents unauthorized data insertion
    - Maintains proper access control
*/

-- Fix auto_moderation_logs policy
DROP POLICY IF EXISTS "System can create auto moderation logs" ON public.auto_moderation_logs;
-- Only allow service role to create auto moderation logs
-- Regular users and anon users should not be able to create these logs directly

-- Fix business_inquiries policy
DROP POLICY IF EXISTS "Anyone can submit business inquiries" ON public.business_inquiries;
CREATE POLICY "Anyone can submit business inquiries" ON public.business_inquiries
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Ensure the user_id matches authenticated user if they're logged in
    (auth.role() = 'authenticated' AND user_id = (SELECT auth.uid())) OR
    -- Allow anon users to create inquiries without user_id
    (auth.role() = 'anon' AND user_id IS NULL)
  );
