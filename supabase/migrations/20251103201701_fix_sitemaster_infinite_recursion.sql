/*
  # Fix Sitemaster Infinite Recursion Issue

  1. Problem
    - "Admins can view roles" policy queries user_admin_roles within user_admin_roles
    - This causes infinite recursion and blocks ALL database access
    - Multiple conflicting policies from different migrations

  2. Solution
    - Drop ALL existing problematic policies on user_admin_roles
    - Create simple, non-recursive policies:
      * Users can view their own roles (no recursion)
      * Service role has full access (for admin operations)
    - Update platform_settings policies to avoid recursion
    
  3. Security
    - Users can only see their own admin roles
    - Admin functions use service role (bypasses RLS)
    - Frontend checks admin status via simple user_id lookup
*/

-- Drop ALL existing policies on user_admin_roles to start fresh
DROP POLICY IF EXISTS "Admins can view roles" ON user_admin_roles;
DROP POLICY IF EXISTS "Sitemaster manages user roles" ON user_admin_roles;
DROP POLICY IF EXISTS "Users view own admin roles" ON user_admin_roles;
DROP POLICY IF EXISTS "Service role manages admin roles" ON user_admin_roles;

-- Create simple, non-recursive policy for users to view their own roles
CREATE POLICY "Users can view own admin roles"
  ON user_admin_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role has full access (no RLS checks)
CREATE POLICY "Service role full access to admin roles"
  ON user_admin_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix platform_settings policies (remove recursion)
DROP POLICY IF EXISTS "Sitemaster manages platform settings" ON platform_settings;
DROP POLICY IF EXISTS "Users view platform settings" ON platform_settings;

-- Simple read-only access for all authenticated users
CREATE POLICY "All users can view platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Service role manages settings (no recursion)
CREATE POLICY "Service role manages platform settings"
  ON platform_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix feature_toggles policies
DROP POLICY IF EXISTS "Sitemaster manages feature toggles" ON feature_toggles;
DROP POLICY IF EXISTS "Users view feature toggles" ON feature_toggles;

CREATE POLICY "All users can view feature toggles"
  ON feature_toggles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages feature toggles"
  ON feature_toggles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix rate_configurations policies
DROP POLICY IF EXISTS "Sitemaster manages rate configurations" ON rate_configurations;
DROP POLICY IF EXISTS "Users view rate configurations" ON rate_configurations;

CREATE POLICY "All users can view rate configurations"
  ON rate_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages rate configurations"
  ON rate_configurations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify sitemaster account exists and has the role
DO $$
DECLARE
  sitemaster_user_id uuid;
BEGIN
  -- Get sitemaster user ID
  SELECT id INTO sitemaster_user_id
  FROM profiles
  WHERE username = 'sitemaster'
  LIMIT 1;

  -- If sitemaster exists, ensure they have the role
  IF sitemaster_user_id IS NOT NULL THEN
    INSERT INTO user_admin_roles (user_id, role_type, assigned_by, active)
    VALUES (sitemaster_user_id, 'sitemaster', sitemaster_user_id, true)
    ON CONFLICT (user_id, role_type) DO UPDATE
    SET active = true, assigned_at = now();
    
    RAISE NOTICE 'Sitemaster role assigned to user: %', sitemaster_user_id;
  ELSE
    RAISE NOTICE 'No sitemaster user found - create one first';
  END IF;
END $$;
