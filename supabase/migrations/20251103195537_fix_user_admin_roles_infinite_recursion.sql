/*
  # Fix Infinite Recursion in user_admin_roles RLS Policy

  1. Changes
    - Drops the problematic "Sitemaster manages user roles" policy that causes infinite recursion
    - Creates a simple policy that allows users to view their own roles
    - Creates a separate policy for service role to manage all roles
    
  2. Security
    - Users can view their own admin roles
    - Role management should be done through the Supabase dashboard or service role functions
    - No policy checking user_admin_roles within user_admin_roles (prevents infinite recursion)
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Sitemaster manages user roles" ON user_admin_roles;

-- Keep the simple policy for users to view their own roles (already exists, but ensure it's correct)
DROP POLICY IF EXISTS "Users view own admin roles" ON user_admin_roles;
CREATE POLICY "Users view own admin roles"
  ON user_admin_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow service role full access (for administrative functions)
-- This policy doesn't cause recursion because it doesn't query the same table
DROP POLICY IF EXISTS "Service role manages admin roles" ON user_admin_roles;
CREATE POLICY "Service role manages admin roles"
  ON user_admin_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
