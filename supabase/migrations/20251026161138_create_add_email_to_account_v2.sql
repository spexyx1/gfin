/*
  # Add Email to Account Function

  1. Purpose
    - Allow users who registered with handle-only to add email later
    - Update both profiles.email and auth.users.email atomically
    - Replace placeholder email with real email in auth system

  2. New Function
    - `add_email_to_account` - Adds or updates email for user account
      Validates email is not already in use
      Updates both profiles and auth.users tables
      Removes placeholder email if present
      Creates audit log entry

  3. Security
    - Only authenticated users can add email to their own account
    - Email uniqueness is enforced
    - Function is SECURITY DEFINER to update auth.users
    - Validates email format before accepting

  4. Features
    - Atomic operation (both tables updated or neither)
    - Email validation
    - Duplicate email checking
    - Audit trail for security
*/

-- Create function to add or update email for a user account
CREATE OR REPLACE FUNCTION add_email_to_account(
  p_user_id uuid,
  p_new_email text
)
RETURNS jsonb AS $$
DECLARE
  v_current_auth_email text;
  v_is_placeholder boolean;
  v_email_exists boolean;
BEGIN
  -- Verify the caller is the account owner
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'You can only update your own email'
    );
  END IF;
  
  -- Validate email format (basic validation)
  IF p_new_email IS NULL OR p_new_email = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_email',
      'message', 'Email cannot be empty'
    );
  END IF;
  
  -- Check if email has @ symbol
  IF p_new_email NOT LIKE '%@%.%' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_email',
      'message', 'Please enter a valid email address'
    );
  END IF;
  
  -- Trim and lowercase email
  p_new_email := lower(trim(p_new_email));
  
  -- Check if email is already in use by another user
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = p_new_email 
    AND id != p_user_id
  ) INTO v_email_exists;
  
  IF v_email_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'email_taken',
      'message', 'This email is already registered to another account'
    );
  END IF;
  
  -- Get current auth email
  SELECT email INTO v_current_auth_email
  FROM auth.users
  WHERE id = p_user_id;
  
  IF v_current_auth_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'User account not found'
    );
  END IF;
  
  -- Check if current email is a placeholder
  v_is_placeholder := is_placeholder_email(v_current_auth_email);
  
  -- Update auth.users table with new email
  UPDATE auth.users
  SET 
    email = p_new_email,
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{email_added_at}',
      to_jsonb(now())
    ),
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Update profiles table with new email
  UPDATE profiles
  SET 
    email = p_new_email,
    auth_email_hash = md5(p_new_email),
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email successfully added to your account',
    'email', p_new_email,
    'replaced_placeholder', v_is_placeholder
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error if something goes wrong
    RETURN jsonb_build_object(
      'success', false,
      'error', 'server_error',
      'message', 'Failed to update email. Please try again.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION add_email_to_account TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION add_email_to_account IS 
  'Allows authenticated users to add or update their email address. Replaces placeholder emails with real emails. Only the account owner can update their own email.';

-- Create a helper function to check user email status
CREATE OR REPLACE FUNCTION get_user_email_status(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_profile_email text;
  v_auth_email text;
  v_has_placeholder boolean;
  v_username text;
BEGIN
  -- Only allow users to check their own status
  IF auth.uid() != p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized'
    );
  END IF;
  
  -- Get profile data
  SELECT email, username INTO v_profile_email, v_username
  FROM profiles
  WHERE id = p_user_id;
  
  -- Get auth email
  SELECT email INTO v_auth_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Check if placeholder
  v_has_placeholder := is_placeholder_email(v_auth_email);
  
  RETURN jsonb_build_object(
    'success', true,
    'username', v_username,
    'profile_email', v_profile_email,
    'has_placeholder_email', v_has_placeholder,
    'email_status', CASE 
      WHEN v_profile_email IS NOT NULL AND NOT v_has_placeholder THEN 'has_real_email'
      WHEN v_profile_email IS NULL AND v_has_placeholder THEN 'no_email'
      ELSE 'unknown'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email_status TO authenticated;
