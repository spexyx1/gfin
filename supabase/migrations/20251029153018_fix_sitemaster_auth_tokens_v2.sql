/*
  # Fix Sitemaster Authentication Tokens v2
  
  This migration fixes any missing or incorrect authentication tokens
  for the sitemaster account to ensure login works properly.
  
  Changes:
  - Update confirmation tokens to empty strings (not null)
  - Ensure email is confirmed
  - Ensure proper instance_id
  - Ensure aud field is correct
  - Skip generated columns
*/

-- Update sitemaster user to fix any authentication issues
UPDATE auth.users
SET 
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change_token_current = '',
  aud = 'authenticated',
  role = 'authenticated',
  email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'sitemaster@placeholder.ghetto.finance';

-- Ensure identity record exists and is correct
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  u.id::text,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'provider', 'email'
  ),
  'email',
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.email = 'sitemaster@placeholder.ghetto.finance'
ON CONFLICT (provider, provider_id) 
DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = now(),
  updated_at = now();

-- Verify the fix
DO $$
DECLARE
  user_check RECORD;
BEGIN
  SELECT 
    u.email,
    u.encrypted_password IS NOT NULL as has_password,
    u.email_confirmed_at IS NOT NULL as confirmed,
    u.confirmation_token,
    u.aud,
    u.role,
    (SELECT COUNT(*) FROM auth.identities WHERE user_id = u.id) as identity_count
  INTO user_check
  FROM auth.users u
  WHERE u.email = 'sitemaster@placeholder.ghetto.finance';

  IF user_check.email IS NULL THEN
    RAISE WARNING 'Sitemaster user not found!';
  ELSIF NOT user_check.has_password THEN
    RAISE WARNING 'Sitemaster has no password!';
  ELSIF NOT user_check.confirmed THEN
    RAISE WARNING 'Sitemaster email not confirmed!';
  ELSIF user_check.identity_count = 0 THEN
    RAISE WARNING 'Sitemaster has no identity record!';
  ELSE
    RAISE NOTICE '✓ Sitemaster authentication is properly configured';
    RAISE NOTICE '  Email: %', user_check.email;
    RAISE NOTICE '  Has Password: %', user_check.has_password;
    RAISE NOTICE '  Email Confirmed: %', user_check.confirmed;
    RAISE NOTICE '  Identities: %', user_check.identity_count;
    RAISE NOTICE '  Role: %', user_check.role;
    RAISE NOTICE '  Aud: %', user_check.aud;
  END IF;
END $$;
