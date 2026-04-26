/*
  # Strengthen preferred_language constraint and restore query index

  1. Changes
    - Strengthens the `preferred_language` CHECK constraint on `profiles` to validate
      ISO-639-1 two-letter codes (lowercase a-z, exactly 2 chars) in addition to the
      existing length-only check. Also allows 5-char BCP-47 codes (e.g. zh-TW).
    - Restores `idx_profiles_preferred_language` index that was dropped in the March 2026
      security cleanup. Language-based profile lookups are active via LanguageContext.
    - No data loss: pure constraint tightening and index addition.

  2. Security
    - No RLS changes.

  3. Notes
    - Old constraint name was from migration 20260319083737. We drop it by name and replace.
*/

DO $$
BEGIN
  -- Drop old length-only check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles'
      AND constraint_name = 'profiles_preferred_language_check'
      AND constraint_type = 'CHECK'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_preferred_language_check;
  END IF;
END $$;

-- Re-add with proper ISO-639 / BCP-47 validation
ALTER TABLE profiles
  ADD CONSTRAINT profiles_preferred_language_check
  CHECK (
    preferred_language IS NULL
    OR (
      length(preferred_language) BETWEEN 2 AND 5
      AND preferred_language ~ '^[a-z]{2}(-[A-Z]{2})?$'
    )
  );

-- Restore index for language-preference lookups
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language
  ON profiles(preferred_language);
