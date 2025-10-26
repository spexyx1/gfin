/*
  # Fix Login for Username-Only Accounts

  1. New Functions
    - `get_auth_email_by_user_id` - Retrieves the auth email for a user ID
      This allows the frontend to get the auth.users email for username-only accounts
      where profiles.email is NULL

  2. Changes
    - Create a SECURITY DEFINER function to safely query auth.users
    - Only returns the email, not other sensitive auth data
    - Can be called by authenticated and anonymous users (needed for login)

  3. Security
    - Function is SECURITY DEFINER to access auth schema
    - Only returns email field, no passwords or sensitive data
    - Required for username-based login to work properly
*/

-- Create function to get auth email by user ID
CREATE OR REPLACE FUNCTION get_auth_email_by_user_id(user_id uuid)
RETURNS text AS $$
DECLARE
  user_email text;
BEGIN
  -- Get the email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated users (needed for login)
GRANT EXECUTE ON FUNCTION get_auth_email_by_user_id TO anon, authenticated;
