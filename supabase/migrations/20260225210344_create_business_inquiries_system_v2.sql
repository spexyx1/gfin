/*
  # Create Business Inquiries System

  ## Purpose
  Enables users to submit business inquiries through the ContactForm, which are then
  reviewed and responded to by Sitemaster in their dashboard.

  ## New Tables

  ### business_inquiries
  - `id` (uuid, primary key) - Unique inquiry identifier
  - `name` (text) - Name of the person submitting the inquiry
  - `email` (text) - Contact email address
  - `subject` (text) - Subject/category of the inquiry
  - `message` (text) - The inquiry message content
  - `status` (text) - Current status: pending | reviewing | responded | closed
  - `response` (text, nullable) - Sitemaster's response to the inquiry
  - `responded_by` (uuid, nullable, FK to profiles) - Sitemaster who responded
  - `responded_at` (timestamptz, nullable) - When the response was sent
  - `user_id` (uuid, nullable, FK to profiles) - If submitted by a logged-in user
  - `created_at` (timestamptz) - When the inquiry was submitted
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on business_inquiries
  - Users can view only their own inquiries
  - Sitemasters can view and respond to all inquiries
  - Anonymous users can insert inquiries (for contact form)

  ## Notes
  1. Both logged-in users and anonymous visitors can submit inquiries
  2. Email validation should be done client-side
  3. Sitemasters can see all inquiries and respond to them
  4. Users receive responses via email (handled by application logic)
*/

CREATE TABLE IF NOT EXISTS business_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'responded', 'closed')),
  response text,
  responded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  responded_at timestamptz,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_inquiries_status_idx ON business_inquiries(status);
CREATE INDEX IF NOT EXISTS business_inquiries_user_id_idx ON business_inquiries(user_id);
CREATE INDEX IF NOT EXISTS business_inquiries_created_at_idx ON business_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS business_inquiries_responded_by_idx ON business_inquiries(responded_by);

ALTER TABLE business_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit business inquiries"
  ON business_inquiries FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view their own inquiries"
  ON business_inquiries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Sitemasters can view all inquiries"
  ON business_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'sitemaster'
      AND active = true
    )
  );

CREATE POLICY "Sitemasters can update inquiries"
  ON business_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'sitemaster'
      AND active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'sitemaster'
      AND active = true
    )
  );

CREATE OR REPLACE FUNCTION update_business_inquiry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_inquiries_updated_at
  BEFORE UPDATE ON business_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_business_inquiry_timestamp();
