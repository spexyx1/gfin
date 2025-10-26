/*
  # Add RLS Policies for Auth Service on auth.users

  1. Problem
    - RLS is enabled on auth.users table (cannot be disabled without superuser)
    - No policies exist, blocking ALL access including Supabase Auth service
    - Causes "Database error querying schema" on login

  2. Solution
    - Add policies for supabase_auth_admin role (Supabase Auth service)
    - Add policies for authenticator role (connection pooler)
    - Allow these roles full access to auth.users
    - This enables Supabase Auth to function with RLS enabled

  3. Impact
    - Fixes login functionality
    - Maintains RLS enabled state (cannot change without superuser)
    - Grants necessary permissions to Supabase's internal auth services
    - No security risk - these are system roles, not user-facing

  4. Note
    - This is a workaround for RLS being enabled on auth.users
    - Ideally RLS should be disabled on auth.users (standard Supabase)
    - But without superuser access, policies are the only solution
*/

-- Drop policies if they exist (in case of re-run)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow auth service access" ON auth.users;
  DROP POLICY IF EXISTS "Allow authenticator access" ON auth.users;
END $$;

-- Create policy allowing supabase_auth_admin full access to auth.users
-- This is the role that Supabase Auth service uses
CREATE POLICY "Allow auth service access"
  ON auth.users
  FOR ALL
  TO supabase_auth_admin
  USING (true)
  WITH CHECK (true);

-- Create policy allowing authenticator full access to auth.users
-- This is the role that connection pooler uses
CREATE POLICY "Allow authenticator access"
  ON auth.users
  FOR ALL
  TO authenticator
  USING (true)
  WITH CHECK (true);

-- Verify policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'auth' 
    AND tablename = 'users'
    AND policyname IN ('Allow auth service access', 'Allow authenticator access');
  
  IF policy_count >= 2 THEN
    RAISE NOTICE 'Auth service policies created successfully - login should now work';
  ELSE
    RAISE WARNING 'Expected 2 policies but found %', policy_count;
  END IF;
END $$;
