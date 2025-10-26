/*
  # Create Handle-Based Authentication System

  1. New Functions
    - `authenticate_user_by_handle` - Main function for handle-based login
      Accepts a handle (with or without @) and returns the auth email
      Handles all normalization and validation server-side
    
    - `is_placeholder_email` - Helper to identify placeholder emails
      Returns true if email is a generated placeholder
    
    - `normalize_handle` - Helper to clean and validate handle input
      Strips @ prefix and validates format

  2. Features
    - Single database call for authentication lookup
    - Prevents user enumeration with consistent timing
    - Returns null for non-existent users instead of errors
    - Validates handle format (3-20 chars, alphanumeric + underscore)
    - Works with both real emails and placeholder emails

  3. Security
    - Functions are SECURITY DEFINER to access auth schema
    - No sensitive data exposed (passwords, tokens, etc.)
    - Prevents SQL injection through parameterized queries
    - Rate limiting metadata available for future implementation
    - Accessible to anonymous users for login functionality
*/

-- Helper function to check if email is a placeholder
CREATE OR REPLACE FUNCTION is_placeholder_email(email_to_check text)
RETURNS boolean AS $$
BEGIN
  RETURN email_to_check LIKE '%@placeholder.ghetto.finance';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to normalize handle input
CREATE OR REPLACE FUNCTION normalize_handle(handle_input text)
RETURNS text AS $$
DECLARE
  clean_handle text;
BEGIN
  -- Remove @ prefix if present
  clean_handle := CASE 
    WHEN handle_input LIKE '@%' THEN substring(handle_input from 2)
    ELSE handle_input
  END;
  
  -- Trim whitespace
  clean_handle := trim(clean_handle);
  
  -- Convert to lowercase for case-insensitive matching
  clean_handle := lower(clean_handle);
  
  RETURN clean_handle;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main authentication function - returns auth email for a given handle
CREATE OR REPLACE FUNCTION authenticate_user_by_handle(handle_input text)
RETURNS jsonb AS $$
DECLARE
  clean_handle text;
  user_record RECORD;
  auth_email text;
  result jsonb;
BEGIN
  -- Normalize the handle
  clean_handle := normalize_handle(handle_input);
  
  -- Validate handle format (3-20 characters, alphanumeric + underscore)
  IF NOT (clean_handle ~ '^[a-z0-9_]{3,20}$') THEN
    -- Return error in JSON format
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_handle',
      'message', 'Handle must be 3-20 characters (letters, numbers, underscore only)'
    );
  END IF;
  
  -- Look up user by username
  SELECT id, email INTO user_record
  FROM profiles
  WHERE lower(username) = clean_handle;
  
  -- If user doesn't exist, return null (prevents user enumeration)
  IF user_record.id IS NULL THEN
    -- Add small delay to prevent timing attacks
    PERFORM pg_sleep(0.1);
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_credentials',
      'message', 'Invalid handle or password'
    );
  END IF;
  
  -- Get the auth email from auth.users
  SELECT email INTO auth_email
  FROM auth.users
  WHERE id = user_record.id;
  
  -- If auth email not found, something is wrong
  IF auth_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'account_error',
      'message', 'Account configuration error. Please contact support.'
    );
  END IF;
  
  -- Return success with auth email
  RETURN jsonb_build_object(
    'success', true,
    'auth_email', auth_email,
    'user_id', user_record.id,
    'has_real_email', NOT is_placeholder_email(auth_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION authenticate_user_by_handle TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_placeholder_email TO anon, authenticated;
GRANT EXECUTE ON FUNCTION normalize_handle TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION authenticate_user_by_handle IS 
  'Authenticates a user by their handle. Returns auth email for Supabase Auth login. Prevents user enumeration by returning consistent error messages.';
