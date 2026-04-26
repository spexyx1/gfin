/*
  # Fix profiles RLS policies

  1. Issues resolved
    - SELECT policy "Authenticated users view profiles" used USING (true) which allows
      unauthenticated access. Replaced with an authenticated-only policy that respects
      stealth_mode (stealth users are only visible to themselves).
    - Duplicate UPDATE policies ("Users can update their own profile" and "Users update
      own profile") — drop both and replace with a single canonical policy.

  2. Security improvements
    - SELECT: authenticated users see non-stealth profiles + their own profile
    - UPDATE: uses (select auth.uid()) subquery form for RLS optimization

  3. No data migration needed.
*/

-- Drop the problematic always-true SELECT policy
DROP POLICY IF EXISTS "Authenticated users view profiles" ON profiles;

-- Drop both duplicate UPDATE policies
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;

-- Secure SELECT: authenticated users see non-stealth profiles and their own profile
CREATE POLICY "Authenticated users can view non-stealth profiles or own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    stealth_mode = false
    OR id = (SELECT auth.uid())
  );

-- Canonical UPDATE policy
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));
