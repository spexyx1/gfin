/*
  # Make Email Optional for User Registration

  1. Changes
    - Make email field nullable in profiles table
    - Allow users to register with only @handle
    - Email becomes optional but username remains required
    - Users can add email later if needed

  2. Updates
    - ALTER profiles.email to allow NULL values
    - Update unique constraint to handle NULL emails properly
    - Keep username as required and unique

  3. Security
    - RLS policies remain unchanged
    - Username-based authentication still works
    - Email-based authentication only works if email is provided

  4. Notes
    - Existing users with emails are unaffected
    - New users can register with username + password only
    - Email can be added via profile update later
*/

-- Make email nullable in profiles table
ALTER TABLE profiles 
ALTER COLUMN email DROP NOT NULL;

-- Update the unique constraint on email to handle NULLs properly
-- PostgreSQL treats NULL as distinct values, so multiple NULL emails are allowed
-- This is the desired behavior - multiple users can have no email

-- Create a partial unique index that only enforces uniqueness for non-NULL emails
DROP INDEX IF EXISTS profiles_email_idx;
CREATE UNIQUE INDEX profiles_email_unique_idx 
ON profiles(email) 
WHERE email IS NOT NULL;

-- Add a regular index for email lookups (including NULLs)
CREATE INDEX profiles_email_lookup_idx ON profiles(email);

-- Update the handle_new_user function to handle optional emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(COALESCE(NEW.email, 'user_' || NEW.id::text), '@', 1)),
    NEW.email,  -- This can now be NULL
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(COALESCE(NEW.email, 'user_' || NEW.id::text), '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to generate a unique placeholder email for auth.users
-- Since Supabase Auth requires an email, we'll generate a unique one for handle-only users
CREATE OR REPLACE FUNCTION generate_placeholder_email(p_username TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Generate a unique placeholder email using the username and a timestamp
  RETURN p_username || '+' || extract(epoch from now())::bigint || '@placeholder.ghetto.finance';
END;
$$ LANGUAGE plpgsql;

-- Create a function to register users with optional email
CREATE OR REPLACE FUNCTION register_user_with_handle(
  p_username TEXT,
  p_password TEXT,
  p_display_name TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_auth_email TEXT;
  v_encrypted_pw TEXT;
BEGIN
  -- Clean username
  p_username := CASE 
    WHEN p_username LIKE '@%' THEN substring(p_username from 2)
    ELSE p_username
  END;
  
  -- Validate username
  IF NOT (p_username ~ '^[a-zA-Z0-9_]{3,20}$') THEN
    RAISE EXCEPTION 'Username must be 3-20 characters and contain only letters, numbers, and underscores';
  END IF;
  
  -- Check if username is taken
  IF EXISTS (SELECT 1 FROM profiles WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already taken';
  END IF;
  
  -- Check if email is provided and already taken
  IF p_email IS NOT NULL AND EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email already registered';
  END IF;
  
  -- Determine auth email (use provided email or generate placeholder)
  IF p_email IS NOT NULL AND p_email != '' THEN
    v_auth_email := p_email;
  ELSE
    v_auth_email := generate_placeholder_email(p_username);
  END IF;
  
  -- Generate user ID and hash password
  v_user_id := gen_random_uuid();
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    is_sso_user,
    is_anonymous
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_auth_email,
    v_encrypted_pw,
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('username', p_username, 'display_name', p_display_name),
    now(),
    now(),
    'authenticated',
    'authenticated',
    false,
    false
  );
  
  -- The trigger will create the profile, but let's ensure it has the right email
  -- Wait a moment for trigger
  PERFORM pg_sleep(0.05);
  
  -- Update profile with actual email (or NULL if not provided)
  UPDATE profiles 
  SET email = CASE WHEN p_email IS NOT NULL AND p_email != '' THEN p_email ELSE NULL END
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'username', p_username,
    'email', p_email,
    'auth_email', v_auth_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION register_user_with_handle TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_placeholder_email TO anon, authenticated;
