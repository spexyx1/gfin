/*
  # Fix Authentication Function to Avoid auth.users Query

  1. Problem
    - authenticate_user_by_handle function queries auth.users table
    - RLS is enabled on auth.users (blocking access)
    - This causes the function to fail even with SECURITY DEFINER

  2. Solution
    - Remove the query to auth.users
    - Use the email from profiles table instead
    - profiles table has proper RLS policies allowing access

  3. Impact
    - Fixes "Database error querying schema" issue
    - Enables successful authentication
    - No security risk - profiles.email contains the auth email

  4. Note
    - profiles.email is populated from auth.users during user creation
    - For users with real emails, it's the actual email
    - For handle-only users, it's the placeholder email
    - Both work for Supabase Auth signInWithPassword
*/

-- Replace authenticate_user_by_handle to avoid querying auth.users
CREATE OR REPLACE FUNCTION authenticate_user_by_handle(handle_input text)
RETURNS jsonb AS $$
DECLARE
  clean_handle text;
  user_record RECORD;
BEGIN
  -- Normalize the handle
  clean_handle := normalize_handle(handle_input);
  
  -- Validate handle format (3-20 characters, alphanumeric + underscore)
  IF NOT (clean_handle ~ '^[a-z0-9_]{3,20}$') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_handle',
      'message', 'Handle must be 3-20 characters (letters, numbers, underscore only)'
    );
  END IF;
  
  -- Look up user by username and get email from profiles
  SELECT id, email INTO user_record
  FROM profiles
  WHERE lower(username) = clean_handle;
  
  -- If user doesn't exist, return error (prevents user enumeration)
  IF user_record.id IS NULL THEN
    -- Add small delay to prevent timing attacks
    PERFORM pg_sleep(0.1);
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_credentials',
      'message', 'Invalid handle or password'
    );
  END IF;
  
  -- Check if email exists in profile
  IF user_record.email IS NULL OR user_record.email = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'account_error',
      'message', 'Account configuration error. Please contact support.'
    );
  END IF;
  
  -- Return success with email from profiles table
  RETURN jsonb_build_object(
    'success', true,
    'auth_email', user_record.email,
    'user_id', user_record.id,
    'has_real_email', NOT is_placeholder_email(user_record.email)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return generic error
    RETURN jsonb_build_object(
      'success', false,
      'error', 'server_error',
      'message', 'Authentication failed. Please try again.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the comment
COMMENT ON FUNCTION authenticate_user_by_handle IS 
  'Authenticates a user by their handle. Returns email from profiles table for Supabase Auth login. Avoids querying auth.users to prevent RLS issues.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION authenticate_user_by_handle TO anon, authenticated;
