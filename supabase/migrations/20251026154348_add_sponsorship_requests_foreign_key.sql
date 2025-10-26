/*
  # Add Foreign Key for Sponsorship Requests

  1. Changes
    - Add foreign key constraint from sponsorship_requests.seller_id to profiles.id
    - This enables Supabase PostgREST to properly join tables in queries

  2. Security
    - Foreign key ensures referential integrity
    - Sellers must exist in profiles table before creating sponsorship requests
    - CASCADE on delete to clean up requests when seller account is deleted
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sponsorship_requests_seller_id_fkey'
    AND table_name = 'sponsorship_requests'
  ) THEN
    ALTER TABLE sponsorship_requests
    ADD CONSTRAINT sponsorship_requests_seller_id_fkey
    FOREIGN KEY (seller_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;
