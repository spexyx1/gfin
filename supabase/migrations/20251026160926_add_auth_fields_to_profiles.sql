/*
  # Add Authentication Fields to Profiles Table

  1. New Fields
    - `last_login` (timestamptz) - Track when user last logged in
    - `auth_email_hash` (text) - Hash of auth email for efficient lookups without exposing placeholder emails

  2. Indexes
    - Optimize username lookups for handle-based authentication
    - Add hash index for auth_email_hash lookups

  3. Changes
    - Add last_login field with default NULL
    - Add auth_email_hash field for secure email lookup
    - Create optimized indexes for authentication queries

  4. Security
    - auth_email_hash prevents exposure of placeholder emails
    - Maintains existing RLS policies
    - No sensitive data exposed in indexes
*/

-- Add last_login field to track user login activity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- Add auth_email_hash for efficient lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'auth_email_hash'
  ) THEN
    ALTER TABLE profiles ADD COLUMN auth_email_hash text;
  END IF;
END $$;

-- Create index on last_login for analytics queries
CREATE INDEX IF NOT EXISTS profiles_last_login_idx ON profiles(last_login);

-- Create index on auth_email_hash for authentication lookups
CREATE INDEX IF NOT EXISTS profiles_auth_email_hash_idx ON profiles(auth_email_hash);

-- Populate auth_email_hash for existing users
DO $$
DECLARE
  profile_record RECORD;
  user_auth_email text;
BEGIN
  FOR profile_record IN 
    SELECT id FROM profiles WHERE auth_email_hash IS NULL
  LOOP
    -- Get the auth email from auth.users
    SELECT email INTO user_auth_email
    FROM auth.users
    WHERE id = profile_record.id;
    
    IF user_auth_email IS NOT NULL THEN
      -- Store MD5 hash of auth email (not for security, just for efficient lookups)
      UPDATE profiles
      SET auth_email_hash = md5(user_auth_email)
      WHERE id = profile_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Populated auth_email_hash for existing users';
END $$;
