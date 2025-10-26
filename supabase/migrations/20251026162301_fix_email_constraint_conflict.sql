/*
  # Fix Email Constraint Conflict

  1. Problem
    - profiles table has UNIQUE constraint on email column
    - But email can be NULL (from earlier migration)
    - This creates conflicting constraints that cause auth schema errors
    - Partial unique index already exists for non-NULL emails

  2. Solution
    - Drop the old UNIQUE constraint on email
    - Keep the partial unique index (profiles_email_unique_idx)
    - This allows NULL emails while enforcing uniqueness for real emails

  3. Impact
    - Fixes "Database error querying schema" during authentication
    - Maintains email uniqueness for non-NULL values
    - Allows multiple users with NULL emails (handle-only accounts)
*/

-- Drop the conflicting UNIQUE constraint on email
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- Verify the partial unique index still exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'profiles_email_unique_idx'
  ) THEN
    -- Recreate it if somehow missing
    CREATE UNIQUE INDEX profiles_email_unique_idx 
    ON profiles(email) 
    WHERE email IS NOT NULL;
    
    RAISE NOTICE 'Recreated profiles_email_unique_idx';
  ELSE
    RAISE NOTICE 'profiles_email_unique_idx already exists';
  END IF;
END $$;

-- Verify email uniqueness is still enforced for non-NULL emails
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT email, COUNT(*) as cnt
    FROM profiles
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate emails that need to be resolved', duplicate_count;
  ELSE
    RAISE NOTICE 'No duplicate emails found - email uniqueness is properly enforced';
  END IF;
END $$;
