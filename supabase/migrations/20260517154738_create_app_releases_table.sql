/*
  # Create App Releases Table

  1. New Tables
    - `app_releases`
      - `id` (uuid, primary key)
      - `platform` (text) - 'android' or 'ios'
      - `version` (text) - semantic version string
      - `download_url` (text) - URL to APK file or TestFlight link
      - `changelog` (text) - release notes
      - `file_size_mb` (numeric) - file size in megabytes
      - `min_os_version` (text) - minimum OS version required
      - `release_date` (timestamptz) - when this version was released
      - `is_latest` (boolean) - whether this is the latest release for the platform
      - `created_at` (timestamptz) - record creation timestamp

  2. Security
    - Enable RLS on `app_releases` table
    - Add policy for public read access (anyone can view releases to download)
    - Add policy for sitemaster to manage releases

  3. Notes
    - The `is_latest` flag allows quick lookup of current versions
    - Only sitemaster/admin users can create or update releases
    - Public read access is intentional so unauthenticated users can view download info
*/

CREATE TABLE IF NOT EXISTS app_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('android', 'ios')),
  version text NOT NULL,
  download_url text NOT NULL,
  changelog text NOT NULL DEFAULT '',
  file_size_mb numeric NOT NULL DEFAULT 0,
  min_os_version text NOT NULL DEFAULT '',
  release_date timestamptz NOT NULL DEFAULT now(),
  is_latest boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_releases_platform_latest
  ON app_releases (platform, is_latest)
  WHERE is_latest = true;

ALTER TABLE app_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app releases"
  ON app_releases
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Sitemaster can insert app releases"
  ON app_releases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type = 'sitemaster'
      AND user_admin_roles.active = true
    )
  );

CREATE POLICY "Sitemaster can update app releases"
  ON app_releases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type = 'sitemaster'
      AND user_admin_roles.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type = 'sitemaster'
      AND user_admin_roles.active = true
    )
  );

CREATE POLICY "Sitemaster can delete app releases"
  ON app_releases
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type = 'sitemaster'
      AND user_admin_roles.active = true
    )
  );
