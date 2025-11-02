/*
  # Replace Broken Sitemaster with Working Account

  ## Problem
  The original sitemaster account has a corrupted password hash created by
  PostgreSQL's crypt() function which is incompatible with Supabase Auth.

  ## Solution
  1. Delete the broken sitemaster account (2e8ab394-5bba-4a21-baa7-a7c546e5d73c)
  2. Rename the new working account from sitemaster_new to sitemaster
  3. Update profile to have proper admin info

  ## Changes
  - Remove broken sitemaster from profiles, auth.users, and auth.identities
  - Update new account (7746376e-96ef-4c4b-b37d-2296ff3ceed4) to be the official sitemaster
  - Preserve verified status and admin privileges
*/

-- Step 1: Delete the broken old sitemaster account
-- Delete profile first
DELETE FROM profiles WHERE id = '2e8ab394-5bba-4a21-baa7-a7c546e5d73c';

-- Delete auth records
DELETE FROM auth.identities WHERE user_id = '2e8ab394-5bba-4a21-baa7-a7c546e5d73c';
DELETE FROM auth.users WHERE id = '2e8ab394-5bba-4a21-baa7-a7c546e5d73c';

-- Step 2: Update the new account to be the official sitemaster
-- Update profile
UPDATE profiles
SET
  username = 'sitemaster',
  display_name = 'Site Master',
  bio = 'GHETTO FINANCE Platform Administrator',
  verified = true,
  is_seller = true,
  updated_at = now()
WHERE id = '7746376e-96ef-4c4b-b37d-2296ff3ceed4';

-- Update auth.users email to match expected pattern
UPDATE auth.users
SET
  email = 'sitemaster@placeholder.ghetto.finance',
  raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
    'username', 'sitemaster',
    'display_name', 'Site Master'
  ),
  updated_at = now()
WHERE id = '7746376e-96ef-4c4b-b37d-2296ff3ceed4';

-- Update identity data
UPDATE auth.identities
SET
  identity_data = jsonb_build_object(
    'sub', '7746376e-96ef-4c4b-b37d-2296ff3ceed4',
    'email', 'sitemaster@placeholder.ghetto.finance',
    'email_verified', true
  ),
  updated_at = now()
WHERE user_id = '7746376e-96ef-4c4b-b37d-2296ff3ceed4';

-- Step 3: Verify the change
DO $$
DECLARE
  profile_count INTEGER;
  auth_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles WHERE username = 'sitemaster';
  SELECT COUNT(*) INTO auth_count FROM auth.users WHERE email = 'sitemaster@placeholder.ghetto.finance';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sitemaster Account Replacement Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profiles with username sitemaster: %', profile_count;
  RAISE NOTICE 'Auth users with sitemaster email: %', auth_count;
  RAISE NOTICE '';
  RAISE NOTICE 'WORKING CREDENTIALS:';
  RAISE NOTICE '  Username: sitemaster';
  RAISE NOTICE '  Password: keystone';
  RAISE NOTICE '';
  RAISE NOTICE 'New User ID: 7746376e-96ef-4c4b-b37d-2296ff3ceed4';
  RAISE NOTICE '========================================';
END $$;
