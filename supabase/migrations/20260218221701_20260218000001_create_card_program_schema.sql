/*
  # Card Program Schema — GHETTO Finance Debit Card

  ## Overview
  Creates the full database schema for the GHETTO Finance debit card program.
  Processor-agnostic design: all processor-specific identifiers stored as opaque tokens.
  Valid admin roles: sitemaster, treasurer, mediator, sub_moderator

  ## New Tables
  1. card_program_config — single-row program configuration
  2. kyc_verifications — KYC status tracking (no raw PII stored)
  3. issued_cards — card tokens and fulfillment status
  4. card_accounts — debit spend ledger
  5. card_transactions — every authorization and settlement
  6. card_disputes — Reg E chargeback queue
  7. card_loads — funding events
  8. merchant_card_enrollment — manually enrolled merchants (gas stations etc)
  9. fraud_rules — configurable velocity/pattern rules
  10. fraud_events — rule trigger log

  ## Security
  RLS enabled on all tables. Users see only their own data.
  Admin roles (sitemaster, treasurer, mediator) see all data.
*/

-- ============================================================
-- card_program_config
-- ============================================================
CREATE TABLE IF NOT EXISTS card_program_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name text NOT NULL DEFAULT 'GHETTO Finance Debit',
  program_status text NOT NULL DEFAULT 'staging'
    CHECK (program_status IN ('staging', 'active', 'suspended')),
  bin_sponsor_bank text NOT NULL DEFAULT '',
  card_network text NOT NULL DEFAULT 'Visa'
    CHECK (card_network IN ('Visa', 'Mastercard')),
  processor_name text NOT NULL DEFAULT '',
  processor_environment text NOT NULL DEFAULT 'sandbox'
    CHECK (processor_environment IN ('sandbox', 'production')),
  base_interchange_rate numeric(6,4) NOT NULL DEFAULT 0.0150,
  merchant_fee_cap numeric(6,4) NOT NULL DEFAULT 0.0150,
  gas_station_rate numeric(6,4) NOT NULL DEFAULT 0.0090,
  gas_station_promo_duration_months integer NOT NULL DEFAULT 12,
  daily_load_limit_usd numeric(12,2) NOT NULL DEFAULT 5000.00,
  per_transaction_load_limit_usd numeric(12,2) NOT NULL DEFAULT 2500.00,
  monthly_load_limit_usd numeric(12,2) NOT NULL DEFAULT 10000.00,
  kyc_provider_name text NOT NULL DEFAULT '',
  kyc_environment text NOT NULL DEFAULT 'sandbox'
    CHECK (kyc_environment IN ('sandbox', 'production')),
  physical_card_lead_time_days integer NOT NULL DEFAULT 7,
  chargeback_ratio_alert_threshold numeric(6,4) NOT NULL DEFAULT 0.0090,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO card_program_config DEFAULT VALUES
  ON CONFLICT DO NOTHING;

ALTER TABLE card_program_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read card program config"
  ON card_program_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'treasurer')
        AND active = true
    )
  );

CREATE POLICY "Sitemaster can update card program config"
  ON card_program_config FOR UPDATE
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

-- ============================================================
-- kyc_verifications
-- ============================================================
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kyc_provider text NOT NULL DEFAULT '',
  external_verification_id text NOT NULL DEFAULT '',
  document_type text NOT NULL DEFAULT 'government_id'
    CHECK (document_type IN ('government_id', 'passport', 'drivers_license', 'other')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'manual_review', 'expired')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_id uuid REFERENCES auth.users(id),
  reviewer_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(status);

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC verification"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC verifications"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'mediator', 'sub_moderator')
        AND active = true
    )
  );

CREATE POLICY "Admins can update KYC verifications"
  ON kyc_verifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'mediator')
        AND active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'mediator')
        AND active = true
    )
  );

CREATE POLICY "Users can insert own KYC verifications"
  ON kyc_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- issued_cards
-- ============================================================
CREATE TABLE IF NOT EXISTS issued_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type text NOT NULL DEFAULT 'virtual'
    CHECK (card_type IN ('virtual', 'physical')),
  card_status text NOT NULL DEFAULT 'pending'
    CHECK (card_status IN ('pending', 'active', 'frozen', 'cancelled', 'expired')),
  card_token text NOT NULL DEFAULT '',
  last_four text NOT NULL DEFAULT ''
    CHECK (last_four ~ '^\d{4}$' OR last_four = ''),
  expiry_month integer CHECK (expiry_month BETWEEN 1 AND 12),
  expiry_year integer CHECK (expiry_year >= 2024),
  card_program_tier text NOT NULL DEFAULT 'standard'
    CHECK (card_program_tier IN ('standard', 'gas_partner')),
  physical_card_fulfillment_status text NOT NULL DEFAULT 'not_requested'
    CHECK (physical_card_fulfillment_status IN ('not_requested', 'ordered', 'shipped', 'delivered')),
  shipping_address_line1 text NOT NULL DEFAULT '',
  shipping_address_line2 text NOT NULL DEFAULT '',
  shipping_city text NOT NULL DEFAULT '',
  shipping_state text NOT NULL DEFAULT '',
  shipping_zip text NOT NULL DEFAULT '',
  is_activated boolean NOT NULL DEFAULT false,
  is_pin_set boolean NOT NULL DEFAULT false,
  activated_at timestamptz,
  issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_issued_cards_user_id ON issued_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_issued_cards_status ON issued_cards(card_status);

ALTER TABLE issued_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
  ON issued_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all cards"
  ON issued_cards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'treasurer')
        AND active = true
    )
  );

CREATE POLICY "Sitemaster can update cards"
  ON issued_cards FOR UPDATE
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

CREATE POLICY "Users can update own card fields"
  ON issued_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- card_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS card_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid REFERENCES issued_cards(id),
  account_type text NOT NULL DEFAULT 'debit'
    CHECK (account_type IN ('debit', 'prepaid')),
  account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'frozen', 'closed', 'pending')),
  currency text NOT NULL DEFAULT 'USD',
  available_balance numeric(14,2) NOT NULL DEFAULT 0.00,
  pending_balance numeric(14,2) NOT NULL DEFAULT 0.00,
  ledger_balance numeric(14,2) NOT NULL DEFAULT 0.00,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT available_balance_non_negative CHECK (available_balance >= 0),
  CONSTRAINT pending_balance_non_negative CHECK (pending_balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_card_accounts_user_id ON card_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_card_accounts_card_id ON card_accounts(card_id);

ALTER TABLE card_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card accounts"
  ON card_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all card accounts"
  ON card_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'treasurer')
        AND active = true
    )
  );

-- ============================================================
-- card_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS card_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES issued_cards(id),
  account_id uuid NOT NULL REFERENCES card_accounts(id),
  merchant_name text NOT NULL DEFAULT '',
  merchant_mcc text NOT NULL DEFAULT '',
  merchant_city text NOT NULL DEFAULT '',
  merchant_state text NOT NULL DEFAULT '',
  authorization_amount numeric(12,2) NOT NULL DEFAULT 0.00,
  settled_amount numeric(12,2),
  interchange_fee_collected numeric(10,4) NOT NULL DEFAULT 0.00,
  platform_fee_collected numeric(10,4) NOT NULL DEFAULT 0.00,
  net_fee_to_platform numeric(10,4) NOT NULL DEFAULT 0.00,
  transaction_status text NOT NULL DEFAULT 'authorized'
    CHECK (transaction_status IN ('authorized', 'settled', 'declined', 'reversed', 'pending')),
  authorization_code text NOT NULL DEFAULT '',
  is_gas_station boolean NOT NULL DEFAULT false,
  processor_transaction_id text NOT NULL DEFAULT '',
  declined_reason text NOT NULL DEFAULT '',
  authorized_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_transactions_card_id ON card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_account_id ON card_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_status ON card_transactions(transaction_status);
CREATE INDEX IF NOT EXISTS idx_card_transactions_authorized_at ON card_transactions(authorized_at);
CREATE INDEX IF NOT EXISTS idx_card_transactions_is_gas_station ON card_transactions(is_gas_station);

ALTER TABLE card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card transactions"
  ON card_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM issued_cards
      WHERE id = card_transactions.card_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all card transactions"
  ON card_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'treasurer', 'mediator')
        AND active = true
    )
  );

-- ============================================================
-- card_disputes
-- ============================================================
CREATE TABLE IF NOT EXISTS card_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES issued_cards(id),
  transaction_id uuid REFERENCES card_transactions(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  dispute_reason text NOT NULL DEFAULT 'unauthorized'
    CHECK (dispute_reason IN ('unauthorized', 'duplicate', 'item_not_received', 'item_not_as_described', 'other')),
  cardholder_description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'investigating', 'evidence_requested', 'resolved_approved', 'resolved_denied', 'escalated')),
  resolution_amount numeric(12,2),
  resolution_notes text NOT NULL DEFAULT '',
  evidence_files text[] NOT NULL DEFAULT '{}',
  resolved_by uuid REFERENCES auth.users(id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_disputes_card_id ON card_disputes(card_id);
CREATE INDEX IF NOT EXISTS idx_card_disputes_user_id ON card_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_card_disputes_status ON card_disputes(status);
CREATE INDEX IF NOT EXISTS idx_card_disputes_opened_at ON card_disputes(opened_at);

ALTER TABLE card_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card disputes"
  ON card_disputes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own card disputes"
  ON card_disputes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all card disputes"
  ON card_disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'mediator', 'treasurer')
        AND active = true
    )
  );

CREATE POLICY "Admins can update card disputes"
  ON card_disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'mediator')
        AND active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'mediator')
        AND active = true
    )
  );

-- ============================================================
-- card_loads
-- ============================================================
CREATE TABLE IF NOT EXISTS card_loads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  account_id uuid NOT NULL REFERENCES card_accounts(id),
  source_type text NOT NULL DEFAULT 'crypto_wallet'
    CHECK (source_type IN ('crypto_wallet', 'bank_transfer')),
  source_asset text NOT NULL DEFAULT '',
  source_amount numeric(24,8) NOT NULL DEFAULT 0,
  usd_amount numeric(12,2) NOT NULL DEFAULT 0.00,
  conversion_rate numeric(18,8) NOT NULL DEFAULT 1,
  processor_load_id text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed')),
  failure_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usd_amount_positive CHECK (usd_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_card_loads_user_id ON card_loads(user_id);
CREATE INDEX IF NOT EXISTS idx_card_loads_account_id ON card_loads(account_id);
CREATE INDEX IF NOT EXISTS idx_card_loads_status ON card_loads(status);

ALTER TABLE card_loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card loads"
  ON card_loads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own card loads"
  ON card_loads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all card loads"
  ON card_loads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'treasurer')
        AND active = true
    )
  );

-- ============================================================
-- merchant_card_enrollment
-- ============================================================
CREATE TABLE IF NOT EXISTS merchant_card_enrollment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  mcc text NOT NULL DEFAULT '5541',
  is_gas_station boolean NOT NULL DEFAULT false,
  address_line1 text NOT NULL DEFAULT '',
  address_line2 text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  zip text NOT NULL DEFAULT '',
  latitude numeric(10,7),
  longitude numeric(11,7),
  station_brand text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  negotiated_rate numeric(6,4) NOT NULL DEFAULT 0.0150
    CHECK (negotiated_rate <= 0.0150),
  promotional_rate numeric(6,4)
    CHECK (promotional_rate IS NULL OR promotional_rate <= 0.0150),
  promotional_rate_expiry date,
  decal_fulfillment_status text NOT NULL DEFAULT 'not_sent'
    CHECK (decal_fulfillment_status IN ('not_sent', 'ordered', 'shipped', 'delivered')),
  acceptance_status text NOT NULL DEFAULT 'active'
    CHECK (acceptance_status IN ('active', 'suspended', 'pending')),
  enrolled_by uuid REFERENCES auth.users(id),
  notes text NOT NULL DEFAULT '',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_card_enrollment_is_gas_station ON merchant_card_enrollment(is_gas_station);
CREATE INDEX IF NOT EXISTS idx_merchant_card_enrollment_acceptance_status ON merchant_card_enrollment(acceptance_status);
CREATE INDEX IF NOT EXISTS idx_merchant_card_enrollment_mcc ON merchant_card_enrollment(mcc);

ALTER TABLE merchant_card_enrollment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active merchants"
  ON merchant_card_enrollment FOR SELECT
  TO authenticated
  USING (acceptance_status = 'active');

CREATE POLICY "Admins can view all merchants"
  ON merchant_card_enrollment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'treasurer')
        AND active = true
    )
  );

CREATE POLICY "Sitemaster can insert merchants"
  ON merchant_card_enrollment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type = 'sitemaster'
        AND active = true
    )
  );

CREATE POLICY "Sitemaster can update merchants"
  ON merchant_card_enrollment FOR UPDATE
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

-- ============================================================
-- fraud_rules
-- ============================================================
CREATE TABLE IF NOT EXISTS fraud_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_type text NOT NULL DEFAULT 'velocity'
    CHECK (rule_type IN ('velocity', 'geo', 'mcc', 'amount', 'pattern')),
  parameters jsonb NOT NULL DEFAULT '{}',
  action text NOT NULL DEFAULT 'flag'
    CHECK (action IN ('flag', 'decline', 'freeze_card')),
  is_enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_rules_is_enabled ON fraud_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_fraud_rules_rule_type ON fraud_rules(rule_type);

ALTER TABLE fraud_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud rules"
  ON fraud_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'treasurer')
        AND active = true
    )
  );

CREATE POLICY "Sitemaster can insert fraud rules"
  ON fraud_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type = 'sitemaster'
        AND active = true
    )
  );

CREATE POLICY "Sitemaster can update fraud rules"
  ON fraud_rules FOR UPDATE
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

-- ============================================================
-- fraud_events
-- ============================================================
CREATE TABLE IF NOT EXISTS fraud_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES issued_cards(id),
  transaction_id uuid REFERENCES card_transactions(id),
  rule_id uuid REFERENCES fraud_rules(id),
  rule_name text NOT NULL DEFAULT '',
  action_taken text NOT NULL DEFAULT 'flag'
    CHECK (action_taken IN ('flag', 'decline', 'freeze_card')),
  event_details jsonb NOT NULL DEFAULT '{}',
  resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_events_card_id ON fraud_events(card_id);
CREATE INDEX IF NOT EXISTS idx_fraud_events_created_at ON fraud_events(created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_events_resolved ON fraud_events(resolved);

ALTER TABLE fraud_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud events"
  ON fraud_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
        AND role_type IN ('sitemaster', 'treasurer', 'mediator')
        AND active = true
    )
  );

-- ============================================================
-- Seed default fraud rules
-- ============================================================
INSERT INTO fraud_rules (rule_name, rule_type, parameters, action, is_enabled) VALUES
  (
    'Gas station velocity — 3+ transactions in 10 minutes',
    'velocity',
    '{"mcc_codes": ["5541", "5542"], "max_count": 3, "window_minutes": 10}',
    'decline',
    true
  ),
  (
    'Excessive declines — 5+ declines in 1 hour',
    'velocity',
    '{"event_type": "decline", "max_count": 5, "window_minutes": 60}',
    'freeze_card',
    true
  ),
  (
    'First large transaction — over $500 within 24h of activation',
    'pattern',
    '{"min_amount": 500, "hours_since_activation": 24}',
    'flag',
    true
  ),
  (
    'International transaction — country mismatch',
    'geo',
    '{"check_country_mismatch": true}',
    'flag',
    true
  ),
  (
    'High single transaction amount — over $2000',
    'amount',
    '{"max_amount": 2000}',
    'flag',
    true
  )
ON CONFLICT DO NOTHING;
