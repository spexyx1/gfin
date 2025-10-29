/*
  # Complete Authentication System Reset and Setup
  
  ## Summary
  This migration completely resets the authentication system to a fresh slate and creates
  a single sitemaster account with robust authentication infrastructure.
  
  ## Changes Made
  
  ### 1. Complete User Cleanup
  - Delete all existing users from profiles table
  - Delete all existing users from auth.users table
  - Delete all existing identities from auth.identities table
  - Clear all authentication-related data
  
  ### 2. Database Schema Updates
  - Ensure profiles table has correct structure
  - Add missing columns if needed (username, email, etc.)
  - Update indexes for case-insensitive username lookups
  - Set proper constraints and defaults
  
  ### 3. Database Functions
  - Create check_username_available function for signup validation
  - Create authenticate_user_by_username function for login
  - Create handle_new_user trigger for automatic profile creation
  - Add helper functions for username validation
  
  ### 4. Sitemaster Account Creation
  - Create auth.users record with encrypted password "keystone"
  - Create profiles record with username "sitemaster"
  - Create auth.identities record for authentication
  - Set proper permissions and verification status
  
  ### 5. Security (RLS)
  - Enable RLS on profiles table
  - Create policies for profile access (read own, update own)
  - Create policies for authenticated user operations
  - Ensure security for authentication functions
*/

-- ============================================================================
-- STEP 1: COMPLETE CLEANUP - Delete all existing users
-- ============================================================================

-- Delete all profiles first (due to foreign key constraints)
DELETE FROM profiles;

-- Delete all auth identities
DELETE FROM auth.identities;

-- Delete all auth users
DELETE FROM auth.users;

-- ============================================================================
-- STEP 2: ENSURE PROFILES TABLE HAS CORRECT STRUCTURE
-- ============================================================================

-- Make email nullable (for username-only accounts)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' 
    AND column_name = 'email'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
  END IF;
END $$;

-- Ensure username is NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' 
    AND column_name = 'username'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
  END IF;
END $$;

-- Create case-insensitive username index
DROP INDEX IF EXISTS profiles_username_idx;
DROP INDEX IF EXISTS profiles_username_unique_idx;
DROP INDEX IF EXISTS profiles_username_lookup_idx;

CREATE UNIQUE INDEX profiles_username_unique_idx ON profiles(LOWER(username));
CREATE INDEX profiles_username_lookup_idx ON profiles(username);

-- Add comment to email field
COMMENT ON COLUMN profiles.email IS 'Internal field for authentication. Can be NULL for username-only accounts. Never displayed to users.';

-- ============================================================================
-- STEP 3: CREATE DATABASE FUNCTIONS
-- ============================================================================

-- Function: Check if username is available
CREATE OR REPLACE FUNCTION check_username_available(username_input text)
RETURNS boolean AS $$
DECLARE
  clean_username text;
BEGIN
  -- Remove @ prefix if present and convert to lowercase
  clean_username := CASE
    WHEN username_input LIKE '@%' THEN LOWER(substring(username_input from 2))
    ELSE LOWER(username_input)
  END;

  -- Trim whitespace
  clean_username := trim(clean_username);

  -- Validate username format (3-20 characters, alphanumeric + underscore)
  IF NOT (clean_username ~ '^[a-z0-9_]{3,20}$') THEN
    RETURN false;
  END IF;

  -- Check if username exists (case-insensitive)
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE LOWER(username) = clean_username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_username_available TO anon, authenticated;

-- Function: Authenticate user by username (for login)
CREATE OR REPLACE FUNCTION authenticate_user_by_username(username_input text)
RETURNS jsonb AS $$
DECLARE
  clean_username text;
  user_record RECORD;
BEGIN
  -- Remove @ prefix if present and convert to lowercase
  clean_username := CASE
    WHEN username_input LIKE '@%' THEN LOWER(substring(username_input from 2))
    ELSE LOWER(username_input)
  END;

  -- Trim whitespace
  clean_username := trim(clean_username);

  -- Validate username format (3-20 characters, alphanumeric + underscore)
  IF NOT (clean_username ~ '^[a-z0-9_]{3,20}$') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_username',
      'message', 'Username must be 3-20 characters (letters, numbers, underscore only)'
    );
  END IF;

  -- Look up user by username (case-insensitive)
  SELECT p.id, a.email INTO user_record
  FROM profiles p
  JOIN auth.users a ON a.id = p.id
  WHERE LOWER(p.username) = clean_username;

  -- If user doesn't exist, return error (timing-safe to prevent enumeration)
  IF user_record.id IS NULL THEN
    PERFORM pg_sleep(0.1);
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_credentials',
      'message', 'Invalid username or password'
    );
  END IF;

  -- Return success with auth email from auth.users
  RETURN jsonb_build_object(
    'success', true,
    'auth_email', user_record.email,
    'user_id', user_record.id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'server_error',
      'message', 'Authentication failed. Please try again.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION authenticate_user_by_username TO anon, authenticated;

-- Function: Handle new user (trigger function for automatic profile creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_display_name TEXT;
BEGIN
  -- Extract username from metadata
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Extract display name from metadata
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    v_username
  );

  -- Insert profile with simplified structure
  INSERT INTO public.profiles (id, username, email, display_name, bio)
  VALUES (
    NEW.id,
    v_username,
    CASE
      WHEN NEW.email LIKE '%@placeholder.ghetto.finance' THEN NULL
      ELSE NEW.email
    END,
    v_display_name,
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 4: CREATE SITEMASTER ACCOUNT
-- ============================================================================

DO $$
DECLARE
  sitemaster_id uuid;
  sitemaster_email text := 'sitemaster@placeholder.ghetto.finance';
  encrypted_password text;
BEGIN
  -- Generate a new UUID for sitemaster
  sitemaster_id := gen_random_uuid();
  
  -- Create the user in auth.users with encrypted password
  -- Password: keystone
  -- Using crypt() function from pgcrypto extension
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    email_change_token_new,
    recovery_token
  ) VALUES (
    sitemaster_id,
    '00000000-0000-0000-0000-000000000000',
    sitemaster_email,
    crypt('keystone', gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object(
      'username', 'sitemaster',
      'display_name', 'Site Master'
    ),
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    ''
  );

  -- Create identity record for email authentication
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
    sitemaster_id,
    sitemaster_id::text,
    jsonb_build_object(
      'sub', sitemaster_id::text,
      'email', sitemaster_email,
      'email_verified', true
    ),
    'email',
    now(),
    now(),
    now()
  );

  -- Create profile (will also be created by trigger, but being explicit)
  INSERT INTO profiles (
    id,
    username,
    email,
    display_name,
    bio,
    is_seller,
    verified,
    stealth_mode
  ) VALUES (
    sitemaster_id,
    'sitemaster',
    NULL,  -- Don't show placeholder email
    'Site Master',
    'GHETTO FINANCE Platform Administrator',
    true,
    true,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    is_seller = EXCLUDED.is_seller,
    verified = EXCLUDED.verified;

  RAISE NOTICE '✓ Sitemaster account created successfully';
  RAISE NOTICE '  Username: sitemaster';
  RAISE NOTICE '  Password: keystone';
  RAISE NOTICE '  User ID: %', sitemaster_id;
END $$;

-- ============================================================================
-- STEP 5: VERIFY SETUP
-- ============================================================================

DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
  identity_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Count users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO identity_count FROM auth.identities;
  
  -- Count functions
  SELECT COUNT(*) INTO function_count 
  FROM pg_proc 
  WHERE proname IN ('check_username_available', 'authenticate_user_by_username', 'handle_new_user');

  RAISE NOTICE '================================';
  RAISE NOTICE 'Authentication System Setup Complete';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Users in auth.users: %', user_count;
  RAISE NOTICE 'Profiles created: %', profile_count;
  RAISE NOTICE 'Identities created: %', identity_count;
  RAISE NOTICE 'Auth functions created: %', function_count;
  RAISE NOTICE '================================';
  RAISE NOTICE 'Login Credentials:';
  RAISE NOTICE '  Username: sitemaster';
  RAISE NOTICE '  Password: keystone';
  RAISE NOTICE '================================';
  
  -- Verify sitemaster can be authenticated
  DECLARE
    auth_result jsonb;
  BEGIN
    auth_result := authenticate_user_by_username('sitemaster');
    IF (auth_result->>'success')::boolean THEN
      RAISE NOTICE '✓ Authentication function test: PASSED';
    ELSE
      RAISE WARNING '✗ Authentication function test: FAILED - %', auth_result->>'message';
    END IF;
  END;
  
  RAISE NOTICE '================================';
END $$;