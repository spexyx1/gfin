/*
  # Add Language Preference to Profiles

  1. Changes
    - Add `preferred_language` column to `profiles` table
      - Type: text
      - Default: 'en' (English)
      - Stores user's preferred interface language (ISO 639-1 code)
    
  2. Performance
    - Add index on `preferred_language` for efficient filtering and analytics
  
  3. Notes
    - Supports 70 languages as defined in the frontend
    - Used for cross-device language sync when user is authenticated
    - Falls back to browser language or English if not set
*/

-- Add preferred_language column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language 
ON profiles(preferred_language);

-- Add check constraint to ensure valid language codes (basic validation)
ALTER TABLE profiles
ADD CONSTRAINT check_preferred_language_length 
CHECK (length(preferred_language) >= 2 AND length(preferred_language) <= 5);
