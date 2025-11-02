/*
  # Fix Sitemaster Authentication Metadata

  ## Problem
  The sitemaster auth.users record is missing critical metadata fields that
  Supabase Auth requires, specifically the 'sub' field in raw_user_meta_data.

  ## Solution
  Update the sitemaster auth.users record with proper metadata structure
  matching the format used by Supabase Auth for user accounts.

  ## Changes
  - Update raw_user_meta_data to include 'sub' field (user ID)
  - Add email_verified and phone_verified flags
  - Set is_super_admin to null (like normal accounts)
  - Ensure metadata structure matches working accounts
*/

-- Fix sitemaster auth.users metadata
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_build_object(
    'sub', id::text,
    'email', email,
    'username', 'sitemaster',
    'display_name', 'Site Master',
    'email_verified', true,
    'phone_verified', false
  ),
  is_super_admin = null,
  updated_at = now()
WHERE id = '2e8ab394-5bba-4a21-baa7-a7c546e5d73c';

-- Verify the auth.identities record exists and is correct
DO $$
DECLARE
  identity_exists boolean;
BEGIN
  -- Check if identity exists
  SELECT EXISTS(
    SELECT 1 FROM auth.identities 
    WHERE user_id = '2e8ab394-5bba-4a21-baa7-a7c546e5d73c'
  ) INTO identity_exists;
  
  IF NOT identity_exists THEN
    -- Create identity record if missing
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      '2e8ab394-5bba-4a21-baa7-a7c546e5d73c',
      '2e8ab394-5bba-4a21-baa7-a7c546e5d73c'::text,
      jsonb_build_object(
        'sub', '2e8ab394-5bba-4a21-baa7-a7c546e5d73c'::text,
        'email', 'sitemaster@placeholder.ghetto.finance',
        'email_verified', true
      ),
      'email',
      now(),
      now(),
      now()
    );
    
    RAISE NOTICE 'Created identity record for sitemaster';
  ELSE
    -- Update existing identity to ensure it has proper structure
    UPDATE auth.identities
    SET
      identity_data = jsonb_build_object(
        'sub', '2e8ab394-5bba-4a21-baa7-a7c546e5d73c'::text,
        'email', 'sitemaster@placeholder.ghetto.finance',
        'email_verified', true
      ),
      updated_at = now()
    WHERE user_id = '2e8ab394-5bba-4a21-baa7-a7c546e5d73c';
    
    RAISE NOTICE 'Updated identity record for sitemaster';
  END IF;
END $$;

-- Log success
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sitemaster Authentication Fixed';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Username: sitemaster';
  RAISE NOTICE 'Password: keystone';
  RAISE NOTICE 'Status: Metadata updated to match working auth structure';
  RAISE NOTICE '========================================';
END $$;
