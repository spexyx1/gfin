/*
# Create Onboarding Rewards System

1. New Tables
  - `onboarding_steps` - Tracks completion and reward claims for new user onboarding
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users, not null, defaults to auth.uid())
    - `step_name` (text, not null) - One of: 'create_account', 'complete_profile', 'first_listing', 'first_purchase'
    - `completed_at` (timestamptz) - When the step was completed
    - `reward_claimed_at` (timestamptz) - When the reward was claimed
    - `reward_amount` (numeric, default 0) - Amount of GHETTO tokens rewarded
    - `created_at` (timestamptz)

  - `platform_stats_cache` - Cached platform statistics for the landing page
    - `id` (int, primary key, always 1 - singleton)
    - `total_users` (int)
    - `total_products` (int)
    - `total_transactions` (int)
    - `total_volume_ghetto` (numeric)
    - `updated_at` (timestamptz)

2. Security
  - RLS enabled on both tables
  - Users can only read/update their own onboarding steps
  - Platform stats readable by anyone (public data)
  - Sitemaster can manage platform stats

3. Functions
  - `claim_onboarding_reward` - Atomically claims a reward for a completed step
  - `refresh_platform_stats` - Updates the cached stats

4. Important Notes
  - Unique constraint on (user_id, step_name) to prevent duplicate steps
  - Reward amounts configurable via platform_settings table (already exists)
  - Stats cache avoids expensive COUNT queries on every page load
*/

-- Onboarding steps table
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  step_name text NOT NULL CHECK (step_name IN ('create_account', 'complete_profile', 'first_listing', 'first_purchase')),
  completed_at timestamptz,
  reward_claimed_at timestamptz,
  reward_amount numeric NOT NULL DEFAULT 0 CHECK (reward_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_name)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_user_id ON onboarding_steps(user_id);

ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own onboarding steps" ON onboarding_steps;
CREATE POLICY "Users can view own onboarding steps"
  ON onboarding_steps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding steps" ON onboarding_steps;
CREATE POLICY "Users can insert own onboarding steps"
  ON onboarding_steps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding steps" ON onboarding_steps;
CREATE POLICY "Users can update own onboarding steps"
  ON onboarding_steps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own onboarding steps" ON onboarding_steps;
CREATE POLICY "Users can delete own onboarding steps"
  ON onboarding_steps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Platform stats cache table (singleton row)
CREATE TABLE IF NOT EXISTS platform_stats_cache (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_users int NOT NULL DEFAULT 0,
  total_products int NOT NULL DEFAULT 0,
  total_transactions int NOT NULL DEFAULT 0,
  total_volume_ghetto numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_stats_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view platform stats" ON platform_stats_cache;
CREATE POLICY "Anyone can view platform stats"
  ON platform_stats_cache FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Sitemaster can insert platform stats" ON platform_stats_cache;
CREATE POLICY "Sitemaster can insert platform stats"
  ON platform_stats_cache FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_admin_roles
    WHERE user_admin_roles.user_id = auth.uid()
    AND user_admin_roles.role_type = 'sitemaster'
    AND user_admin_roles.active = true
  ));

DROP POLICY IF EXISTS "Sitemaster can update platform stats" ON platform_stats_cache;
CREATE POLICY "Sitemaster can update platform stats"
  ON platform_stats_cache FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_admin_roles
    WHERE user_admin_roles.user_id = auth.uid()
    AND user_admin_roles.role_type = 'sitemaster'
    AND user_admin_roles.active = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_admin_roles
    WHERE user_admin_roles.user_id = auth.uid()
    AND user_admin_roles.role_type = 'sitemaster'
    AND user_admin_roles.active = true
  ));

DROP POLICY IF EXISTS "Sitemaster can delete platform stats" ON platform_stats_cache;
CREATE POLICY "Sitemaster can delete platform stats"
  ON platform_stats_cache FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_admin_roles
    WHERE user_admin_roles.user_id = auth.uid()
    AND user_admin_roles.role_type = 'sitemaster'
    AND user_admin_roles.active = true
  ));

-- Seed the singleton row with current counts
INSERT INTO platform_stats_cache (id, total_users, total_products, total_transactions, total_volume_ghetto, updated_at)
VALUES (
  1,
  COALESCE((SELECT count(*) FROM profiles), 0),
  COALESCE((SELECT count(*) FROM products WHERE status = 'active'), 0),
  COALESCE((SELECT count(*) FROM orders WHERE status IN ('completed', 'funds_released', 'delivered')), 0),
  COALESCE((SELECT COALESCE(sum(amount), 0) FROM orders WHERE status IN ('completed', 'funds_released', 'delivered')), 0),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  total_users = EXCLUDED.total_users,
  total_products = EXCLUDED.total_products,
  total_transactions = EXCLUDED.total_transactions,
  total_volume_ghetto = EXCLUDED.total_volume_ghetto,
  updated_at = EXCLUDED.updated_at;

-- Function to claim an onboarding reward
CREATE OR REPLACE FUNCTION public.claim_onboarding_reward(p_step_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_reward_amount numeric;
  v_step record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT setting_value::numeric INTO v_reward_amount
  FROM platform_settings
  WHERE setting_key = 'onboarding_reward_' || p_step_name;

  IF v_reward_amount IS NULL THEN
    v_reward_amount := 10;
  END IF;

  SELECT * INTO v_step
  FROM onboarding_steps
  WHERE user_id = v_user_id AND step_name = p_step_name;

  IF v_step IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Step not found');
  END IF;

  IF v_step.completed_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Step not completed yet');
  END IF;

  IF v_step.reward_claimed_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward already claimed');
  END IF;

  UPDATE onboarding_steps
  SET reward_claimed_at = now(), reward_amount = v_reward_amount
  WHERE id = v_step.id;

  INSERT INTO referral_balances (user_id, balance_ghetto, updated_at)
  VALUES (v_user_id, v_reward_amount, now())
  ON CONFLICT (user_id) DO UPDATE
  SET balance_ghetto = referral_balances.balance_ghetto + v_reward_amount,
      updated_at = now();

  INSERT INTO referral_transactions (user_id, type, amount_ghetto, source_id)
  VALUES (v_user_id, 'signup_reward', v_reward_amount, v_step.id::text);

  RETURN jsonb_build_object('success', true, 'reward_amount', v_reward_amount);
END;
$$;

-- Function to refresh platform stats cache
CREATE OR REPLACE FUNCTION public.refresh_platform_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO platform_stats_cache (id, total_users, total_products, total_transactions, total_volume_ghetto, updated_at)
  VALUES (
    1,
    COALESCE((SELECT count(*) FROM profiles), 0),
    COALESCE((SELECT count(*) FROM products WHERE status = 'active'), 0),
    COALESCE((SELECT count(*) FROM orders WHERE status IN ('completed', 'funds_released', 'delivered')), 0),
    COALESCE((SELECT COALESCE(sum(amount), 0) FROM orders WHERE status IN ('completed', 'funds_released', 'delivered')), 0),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    total_products = EXCLUDED.total_products,
    total_transactions = EXCLUDED.total_transactions,
    total_volume_ghetto = EXCLUDED.total_volume_ghetto,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Seed default onboarding reward amounts into platform_settings
INSERT INTO platform_settings (setting_key, setting_value, setting_type, category)
VALUES
  ('onboarding_reward_create_account', '25', 'number', 'rewards'),
  ('onboarding_reward_complete_profile', '50', 'number', 'rewards'),
  ('onboarding_reward_first_listing', '75', 'number', 'rewards'),
  ('onboarding_reward_first_purchase', '100', 'number', 'rewards')
ON CONFLICT (setting_key) DO NOTHING;
