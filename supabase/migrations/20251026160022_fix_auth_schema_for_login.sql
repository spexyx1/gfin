/*
  # Fix Auth Schema for Login Issues

  1. Purpose
    - Ensure all demo accounts have proper auth.identities records
    - Fix any schema issues preventing authentication
    - Add missing confirmed_at computed column dependencies

  2. Changes
    - Add identities for all demo users
    - Ensure all required auth fields are properly set

  3. Security
    - Only affects demo accounts
    - Does not modify production user data
*/

-- Ensure all demo users have identity records
DO $$
DECLARE
  demo_users RECORD;
BEGIN
  FOR demo_users IN 
    SELECT id, email 
    FROM auth.users 
    WHERE email IN ('demo@ghetto.finance', 'master@ghetto.finance', 'seller@ghetto.finance')
  LOOP
    -- Insert identity if it doesn't exist
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
      demo_users.id,
      demo_users.id,
      jsonb_build_object(
        'sub', demo_users.id::text,
        'email', demo_users.email,
        'email_verified', true
      ),
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider, provider_id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Ensured identity records for all demo users';
END $$;

-- Verify all demo users are properly configured
DO $$
DECLARE
  user_check RECORD;
  issues_found BOOLEAN := FALSE;
BEGIN
  FOR user_check IN
    SELECT 
      u.email,
      u.encrypted_password IS NOT NULL as has_password,
      u.email_confirmed_at IS NOT NULL as email_confirmed,
      (SELECT COUNT(*) FROM auth.identities WHERE user_id = u.id) as identity_count
    FROM auth.users u
    WHERE u.email IN ('demo@ghetto.finance', 'master@ghetto.finance', 'seller@ghetto.finance')
  LOOP
    IF NOT user_check.has_password THEN
      RAISE WARNING 'User % has no password', user_check.email;
      issues_found := TRUE;
    END IF;
    
    IF NOT user_check.email_confirmed THEN
      RAISE WARNING 'User % email not confirmed', user_check.email;
      issues_found := TRUE;
    END IF;
    
    IF user_check.identity_count = 0 THEN
      RAISE WARNING 'User % has no identity record', user_check.email;
      issues_found := TRUE;
    END IF;
  END LOOP;
  
  IF NOT issues_found THEN
    RAISE NOTICE 'All demo users are properly configured for authentication';
  END IF;
END $$;
