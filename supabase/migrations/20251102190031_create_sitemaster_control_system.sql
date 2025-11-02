/*
  # Create Comprehensive Sitemaster Control System

  Creates complete admin control infrastructure for sitemaster.
*/

-- Drop existing incomplete table
DROP TABLE IF EXISTS platform_settings CASCADE;

-- Assign sitemaster role
INSERT INTO user_admin_roles (user_id, role_type, assigned_by, active)
SELECT 
  id,
  'sitemaster'::admin_role_type,
  id,
  true
FROM profiles
WHERE username = 'sitemaster'
ON CONFLICT (user_id, role_type) DO UPDATE
SET active = true, assigned_at = now();

-- Create platform_settings table
CREATE TABLE platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  setting_type text NOT NULL,
  description text,
  category text NOT NULL,
  editable boolean DEFAULT true,
  last_updated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create feature_toggles table
CREATE TABLE IF NOT EXISTS feature_toggles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL UNIQUE,
  enabled boolean DEFAULT true,
  description text,
  affects_users text[],
  last_toggled_by uuid REFERENCES profiles(id),
  last_toggled_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create rate_configurations table
CREATE TABLE IF NOT EXISTS rate_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_name text NOT NULL UNIQUE,
  rate_value numeric NOT NULL,
  rate_type text NOT NULL,
  min_value numeric,
  max_value numeric,
  description text,
  category text NOT NULL,
  active boolean DEFAULT true,
  last_updated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Sitemaster manages platform settings" ON platform_settings;
CREATE POLICY "Sitemaster manages platform settings"
  ON platform_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'sitemaster'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Users view platform settings" ON platform_settings;
CREATE POLICY "Users view platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Sitemaster manages feature toggles" ON feature_toggles;
CREATE POLICY "Sitemaster manages feature toggles"
  ON feature_toggles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'sitemaster'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Users view feature toggles" ON feature_toggles;
CREATE POLICY "Users view feature toggles"
  ON feature_toggles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Sitemaster manages rate configurations" ON rate_configurations;
CREATE POLICY "Sitemaster manages rate configurations"
  ON rate_configurations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'sitemaster'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Users view rate configurations" ON rate_configurations;
CREATE POLICY "Users view rate configurations"
  ON rate_configurations FOR SELECT
  TO authenticated
  USING (true);

-- Insert default settings
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description, category) VALUES
  ('platform_name', '"GHETTO FINANCE"', 'string', 'Platform display name', 'general'),
  ('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', 'general'),
  ('new_user_registration', 'true', 'boolean', 'Allow new user signups', 'general'),
  ('max_login_attempts', '5', 'number', 'Maximum login attempts', 'security'),
  ('min_escrow_amount_usdc', '1', 'number', 'Minimum escrow amount', 'escrow');

INSERT INTO feature_toggles (feature_name, enabled, description, affects_users) VALUES
  ('marketplace', true, 'Main marketplace', ARRAY['all']),
  ('social_platform', true, 'Social features', ARRAY['all']),
  ('messaging', true, 'Direct messaging', ARRAY['all']),
  ('auctions', true, 'Auction listings', ARRAY['sellers']),
  ('escrow_system', true, 'Escrow protection', ARRAY['all']);

INSERT INTO rate_configurations (rate_name, rate_value, rate_type, min_value, max_value, description, category) VALUES
  ('platform_fee_percentage', 2.5, 'percentage', 0, 10, 'Platform transaction fee', 'fees'),
  ('seller_collateral_percentage', 100, 'percentage', 50, 200, 'Seller security deposit', 'collateral'),
  ('auto_release_days', 7, 'fixed', 3, 30, 'Auto-release days', 'escrow');

-- Create indexes
CREATE INDEX idx_platform_settings_category ON platform_settings(category);
CREATE INDEX idx_feature_toggles_enabled ON feature_toggles(enabled);
CREATE INDEX idx_rate_configurations_category ON rate_configurations(category);
