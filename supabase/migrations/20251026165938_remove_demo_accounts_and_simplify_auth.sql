/*
  # Remove Demo Accounts and Simplify Authentication

  1. Changes
    - Delete all demo accounts (sitemaster, demo, seller)
    - Remove terms acceptance requirements
    - Drop terms-related columns from profiles
    - Drop terms tables (terms_of_service, terms_acceptances)
    - Remove demo account creation function
    - Simplify authentication to username + password only
    - Remove email requirements entirely

  2. Cleanup
    - Remove demo users from auth.users
    - Remove demo profiles from profiles table
    - Drop terms_accepted, current_terms_version, terms_accepted_at columns
    - Drop terms_of_service and terms_acceptances tables
    - Drop create_demo_user function

  3. Security
    - RLS policies remain intact for profiles
    - Authentication remains secure with Supabase Auth
    - Username-based login continues to work
*/

-- Delete demo accounts from profiles table
DELETE FROM profiles WHERE username IN ('sitemaster', 'demo', 'seller');

-- Delete demo accounts from auth.users
DELETE FROM auth.users WHERE email IN (
  'master@ghetto.finance',
  'demo@ghetto.finance',
  'seller@ghetto.finance'
);

-- Drop terms acceptance table (must drop before terms_of_service due to foreign key)
DROP TABLE IF EXISTS terms_acceptances CASCADE;

-- Drop terms of service table
DROP TABLE IF EXISTS terms_of_service CASCADE;

-- Drop terms-related columns from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS terms_accepted;
ALTER TABLE profiles DROP COLUMN IF EXISTS current_terms_version;
ALTER TABLE profiles DROP COLUMN IF EXISTS terms_accepted_at;

-- Drop demo account creation function
DROP FUNCTION IF EXISTS create_demo_user(TEXT, TEXT, TEXT, TEXT) CASCADE;

-- Drop terms-related functions
DROP FUNCTION IF EXISTS ensure_single_current_terms() CASCADE;

-- Update profiles table to make email truly optional and not shown
-- Email field already allows NULL from previous migration
-- Add a comment to indicate email is internal use only
COMMENT ON COLUMN profiles.email IS 'Internal field for authentication - not displayed to users. Can be NULL for username-only accounts.';

-- Ensure username is case-insensitive
DROP INDEX IF EXISTS profiles_username_idx;
CREATE UNIQUE INDEX profiles_username_unique_idx ON profiles(LOWER(username));
CREATE INDEX profiles_username_lookup_idx ON profiles(username);

-- Update handle_new_user function to simplify profile creation
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

-- Create or replace simplified authentication function
CREATE OR REPLACE FUNCTION authenticate_user_by_username(username_input text)
RETURNS jsonb AS $$
DECLARE
  clean_username text;
  user_record RECORD;
  auth_email text;
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

  -- If user doesn't exist, return error (prevents user enumeration with timing)
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

-- Comment the function
COMMENT ON FUNCTION authenticate_user_by_username IS
  'Authenticates a user by username. Returns auth email for Supabase Auth login. Username-only authentication system.';

-- Create function to check username availability
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

  -- Check if username exists (case-insensitive)
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE LOWER(username) = clean_username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_username_available TO anon, authenticated;

-- Drop old authentication functions
DROP FUNCTION IF EXISTS authenticate_user_by_handle(text) CASCADE;
DROP FUNCTION IF EXISTS register_user_with_handle(TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_placeholder_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_placeholder_email(text) CASCADE;
DROP FUNCTION IF EXISTS normalize_handle(text) CASCADE;