/*
  # Add tables for the referral system

  1. New Tables
    - `referral_codes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id, unique)
      - `code` (text, unique, the actual referral code)
      - `created_at` (timestamptz)

    - `referred_users`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, references profiles.id)
      - `referred_user_id` (uuid, references profiles.id, unique)
      - `account_reward_claimed` (boolean)
      - `first_purchase_reward_claimed` (boolean)
      - `created_at` (timestamptz)

    - `referral_balances`
      - `user_id` (uuid, primary key, references profiles.id)
      - `balance_ghetto` (numeric)
      - `updated_at` (timestamptz)

    - `referral_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id, referrer's ID)
      - `type` (text, e.g., 'signup_reward', 'first_purchase_reward', 'commission', 'redemption')
      - `amount_ghetto` (numeric)
      - `source_id` (uuid, optional, e.g., referred_user_id, order_id)
      - `created_at` (timestamptz)

    - `platform_settings`
      - `key` (text, primary key)
      - `value` (text)

  2. Security
    - Enable RLS on all new tables
    - Add policies for user-specific access and owner-only updates for settings
*/

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create referred_users table
CREATE TABLE IF NOT EXISTS referred_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_reward_claimed boolean DEFAULT false,
  first_purchase_reward_claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create referral_balances table
CREATE TABLE IF NOT EXISTS referral_balances (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance_ghetto numeric DEFAULT 0 CHECK (balance_ghetto >= 0),
  updated_at timestamptz DEFAULT now()
);

-- Create referral_transactions table
CREATE TABLE IF NOT EXISTS referral_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('signup_reward', 'first_purchase_reward', 'commission', 'redemption')),
  amount_ghetto numeric NOT NULL,
  source_id uuid, -- Can be referred_user_id or order_id
  created_at timestamptz DEFAULT now()
);

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- Enable Row Level Security
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referred_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral code"
  ON referral_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code"
  ON referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referred_users
CREATE POLICY "Referrers can view their referred users"
  ON referred_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Referred users can view their referrer"
  ON referred_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_user_id);

CREATE POLICY "Referred users can be inserted by authenticated users"
  ON referred_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referred_user_id);

CREATE POLICY "Referrers can update their referred users (e.g., claim status)"
  ON referred_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = referrer_id);

-- RLS Policies for referral_balances
CREATE POLICY "Users can view their own referral balance"
  ON referral_balances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral balance (for redemption)"
  ON referral_balances
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral balance"
  ON referral_balances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referral_transactions
CREATE POLICY "Users can view their own referral transactions"
  ON referral_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral transactions"
  ON referral_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for platform_settings
CREATE POLICY "Everyone can read platform settings"
  ON platform_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update platform settings"
  ON platform_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = (SELECT id FROM profiles WHERE username = 'sitemaster')); -- Assuming 'sitemaster' is the admin user

-- Initial platform settings for referral rewards
INSERT INTO platform_settings (key, value) VALUES
('referral_signup_reward_ghetto', '0.1'),
('referral_first_purchase_reward_ghetto', '0.25'),
('referral_commission_rate_percent', '0.15'), -- 0.15%
('referral_min_redeem_ghetto', '10.0');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS referral_codes_user_id_idx ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS referred_users_referrer_id_idx ON referred_users(referrer_id);
CREATE INDEX IF NOT EXISTS referred_users_referred_user_id_idx ON referred_users(referred_user_id);
CREATE INDEX IF NOT EXISTS referral_transactions_user_id_idx ON referral_transactions(user_id);
CREATE INDEX IF NOT EXISTS referral_transactions_source_id_idx ON referral_transactions(source_id);