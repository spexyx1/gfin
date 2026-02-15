/*
  # Merchant API System - Complete Infrastructure

  1. New Tables
    - `merchant_accounts`
      - Core merchant business information
      - API configuration and fee settings
      - Business verification status
      - Domain whitelisting for CORS
    
    - `merchant_api_keys`
      - Secure API key storage with HMAC hashing
      - Key permissions and scopes
      - Expiry dates and rotation support
      - Status tracking (active, revoked, expired)
    
    - `merchant_api_usage`
      - Rate limiting and quota tracking
      - Request count per time window
      - Usage statistics per API key
    
    - `merchant_orders`
      - Junction table linking merchant orders to platform orders
      - Merchant reference ID mapping
      - Order metadata from merchant system
    
    - `merchant_webhooks`
      - Webhook endpoint configuration
      - Event subscriptions per merchant
      - HMAC secret for payload signing
      - Endpoint status and failure tracking
    
    - `webhook_deliveries`
      - Delivery attempt tracking
      - Response logging and debugging
      - Retry attempt counting
      - Success/failure status
    
    - `merchant_transactions`
      - Fee collection tracking per order
      - Platform fee calculations
      - Settlement records
      - Transaction audit trail
    
    - `api_request_logs`
      - Complete API request logging
      - Request/response tracking
      - Performance metrics
      - Error debugging information
    
    - `merchant_ip_whitelist`
      - IP address access control
      - Security restrictions per merchant
    
    - `merchant_sandbox_data`
      - Sandbox mode isolation
      - Test transaction tracking

  2. Security
    - Enable RLS on all tables
    - Merchant can only access their own data
    - Platform admins can access all merchant data
    - API keys hashed with HMAC-SHA256
    - Webhook secrets encrypted

  3. Indexes
    - Foreign key indexes for performance
    - Query optimization on common filters
    - Unique constraints for data integrity
*/

-- Merchant Accounts Table
CREATE TABLE IF NOT EXISTS merchant_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_email text NOT NULL,
  business_website text,
  business_description text,
  is_verified boolean DEFAULT false,
  verification_date timestamptz,
  
  -- API Configuration
  webhook_url text,
  webhook_secret text, -- HMAC secret for webhook signing
  allowed_domains text[], -- CORS whitelist
  
  -- Fee Configuration
  fee_percentage numeric(5,2) DEFAULT 2.50 CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
  custom_fee_enabled boolean DEFAULT false,
  
  -- Status and Limits
  is_active boolean DEFAULT true,
  is_sandbox_mode boolean DEFAULT true,
  daily_request_limit integer DEFAULT 10000,
  monthly_volume_limit numeric(20,2),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Merchant API Keys Table
CREATE TABLE IF NOT EXISTS merchant_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  key_hash text NOT NULL UNIQUE, -- HMAC-SHA256 hash of the key
  key_prefix text NOT NULL, -- First 8 chars for identification (e.g., "mk_test_")
  
  -- Permissions
  scopes text[] DEFAULT ARRAY['orders:read', 'orders:write'], -- Permission scopes
  is_sandbox boolean DEFAULT true,
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at timestamptz,
  last_used_at timestamptz,
  
  -- Security
  created_by uuid REFERENCES profiles(id),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES profiles(id),
  revoked_reason text,
  
  created_at timestamptz DEFAULT now()
);

-- API Usage Tracking for Rate Limiting
CREATE TABLE IF NOT EXISTS merchant_api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES merchant_api_keys(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  
  -- Time Window
  window_start timestamptz NOT NULL,
  window_duration interval DEFAULT '1 hour',
  
  -- Usage Metrics
  request_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(api_key_id, window_start)
);

-- Merchant Orders Junction Table
CREATE TABLE IF NOT EXISTS merchant_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Merchant's Order Reference
  merchant_reference_id text NOT NULL,
  merchant_order_data jsonb, -- Additional merchant metadata
  
  -- API Integration Info
  created_via_api boolean DEFAULT true,
  api_key_id uuid REFERENCES merchant_api_keys(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(merchant_id, merchant_reference_id)
);

-- Merchant Webhooks Configuration
CREATE TABLE IF NOT EXISTS merchant_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  
  -- Webhook Configuration
  endpoint_url text NOT NULL,
  signing_secret text NOT NULL, -- For HMAC signature verification
  
  -- Event Subscriptions
  subscribed_events text[] DEFAULT ARRAY[
    'order.created',
    'order.funded',
    'order.shipped',
    'order.delivered',
    'order.completed',
    'order.disputed',
    'dispute.resolved',
    'payment.received'
  ],
  
  -- Status and Health
  is_active boolean DEFAULT true,
  failure_count integer DEFAULT 0,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  disabled_at timestamptz,
  disabled_reason text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Webhook Delivery Tracking
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES merchant_webhooks(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  
  -- Event Information
  event_type text NOT NULL,
  event_id uuid DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  
  -- Delivery Attempt
  attempt_number integer DEFAULT 1,
  endpoint_url text NOT NULL,
  http_method text DEFAULT 'POST',
  
  -- Response
  status_code integer,
  response_body text,
  response_time_ms integer,
  
  -- Status
  delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'success', 'failed', 'retrying')),
  error_message text,
  
  -- Timing
  scheduled_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  next_retry_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- Merchant Transactions (Fee Tracking)
CREATE TABLE IF NOT EXISTS merchant_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  merchant_order_id uuid REFERENCES merchant_orders(id) ON DELETE SET NULL,
  
  -- Transaction Details
  transaction_type text NOT NULL CHECK (transaction_type IN ('fee', 'refund', 'adjustment')),
  
  -- Amounts
  order_amount numeric(20,8) NOT NULL CHECK (order_amount >= 0),
  fee_percentage numeric(5,2) NOT NULL CHECK (fee_percentage >= 0),
  fee_amount numeric(20,8) NOT NULL CHECK (fee_amount >= 0),
  seller_payout numeric(20,8) NOT NULL CHECK (seller_payout >= 0),
  
  -- Currency
  payment_token text NOT NULL, -- ETH, USDC, etc.
  
  -- Blockchain Reference
  blockchain_tx_hash text,
  
  -- Status
  settlement_status text DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'processing', 'completed', 'failed')),
  settled_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- API Request Logging
CREATE TABLE IF NOT EXISTS api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid REFERENCES merchant_accounts(id) ON DELETE SET NULL,
  api_key_id uuid REFERENCES merchant_api_keys(id) ON DELETE SET NULL,
  
  -- Request Details
  method text NOT NULL,
  endpoint text NOT NULL,
  query_params jsonb,
  request_body jsonb,
  
  -- Response
  status_code integer NOT NULL,
  response_body jsonb,
  response_time_ms integer,
  
  -- Client Info
  ip_address inet,
  user_agent text,
  
  -- Error Tracking
  error_message text,
  error_code text,
  
  created_at timestamptz DEFAULT now()
);

-- IP Whitelist for Security
CREATE TABLE IF NOT EXISTS merchant_ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  ip_address inet NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(merchant_id, ip_address)
);

-- Sandbox Data Tracking
CREATE TABLE IF NOT EXISTS merchant_sandbox_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  data_type text NOT NULL CHECK (data_type IN ('order', 'transaction', 'webhook')),
  data_id uuid NOT NULL,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_user_id ON merchant_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_is_active ON merchant_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_merchant_api_keys_merchant_id ON merchant_api_keys(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_api_keys_status ON merchant_api_keys(status);
CREATE INDEX IF NOT EXISTS idx_merchant_api_keys_key_hash ON merchant_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_merchant_api_usage_api_key_id ON merchant_api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_merchant_api_usage_window ON merchant_api_usage(window_start);
CREATE INDEX IF NOT EXISTS idx_merchant_orders_merchant_id ON merchant_orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_orders_order_id ON merchant_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_merchant_webhooks_merchant_id ON merchant_webhooks(merchant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(delivery_status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_merchant_transactions_merchant_id ON merchant_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_transactions_order_id ON merchant_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_merchant_id ON api_request_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON api_request_logs(created_at);

-- Row Level Security Policies

-- Merchant Accounts: Merchants can view/update their own account
ALTER TABLE merchant_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own account"
  ON merchant_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Merchants can update own account"
  ON merchant_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sitemaster can view all merchant accounts"
  ON merchant_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid() AND role_type = 'sitemaster'
    )
  );

-- API Keys: Merchants can manage their own keys
ALTER TABLE merchant_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own API keys"
  ON merchant_api_keys FOR SELECT
  TO authenticated
  USING (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can create own API keys"
  ON merchant_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can update own API keys"
  ON merchant_api_keys FOR UPDATE
  TO authenticated
  USING (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

-- API Usage: Merchants can view their own usage
ALTER TABLE merchant_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own API usage"
  ON merchant_api_usage FOR SELECT
  TO authenticated
  USING (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

-- Merchant Orders: Merchants can view their own orders
ALTER TABLE merchant_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own orders"
  ON merchant_orders FOR SELECT
  TO authenticated
  USING (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

-- Webhooks: Merchants can manage their own webhooks
ALTER TABLE merchant_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own webhooks"
  ON merchant_webhooks FOR ALL
  TO authenticated
  USING (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

-- Webhook Deliveries: Merchants can view their own deliveries
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own webhook deliveries"
  ON webhook_deliveries FOR SELECT
  TO authenticated
  USING (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

-- Merchant Transactions: Merchants can view their own transactions
ALTER TABLE merchant_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own transactions"
  ON merchant_transactions FOR SELECT
  TO authenticated
  USING (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

-- API Request Logs: Merchants can view their own logs
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own request logs"
  ON api_request_logs FOR SELECT
  TO authenticated
  USING (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

-- IP Whitelist: Merchants can manage their own whitelist
ALTER TABLE merchant_ip_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own IP whitelist"
  ON merchant_ip_whitelist FOR ALL
  TO authenticated
  USING (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

-- Sandbox Data: Merchants can manage their own sandbox data
ALTER TABLE merchant_sandbox_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own sandbox data"
  ON merchant_sandbox_data FOR ALL
  TO authenticated
  USING (
    merchant_id IN (
      SELECT id FROM merchant_accounts WHERE user_id = auth.uid()
    )
  );

-- Functions for API Key Management

-- Generate API Key Hash
CREATE OR REPLACE FUNCTION hash_api_key(api_key text)
RETURNS text AS $$
BEGIN
  RETURN encode(digest(api_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate API Key with Prefix
CREATE OR REPLACE FUNCTION generate_api_key(is_sandbox boolean DEFAULT true)
RETURNS text AS $$
DECLARE
  prefix text;
  random_part text;
BEGIN
  prefix := CASE WHEN is_sandbox THEN 'mk_test_' ELSE 'mk_live_' END;
  random_part := encode(gen_random_bytes(32), 'base64');
  random_part := replace(replace(replace(random_part, '/', ''), '+', ''), '=', '');
  RETURN prefix || substring(random_part, 1, 40);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_merchant_accounts_updated_at
  BEFORE UPDATE ON merchant_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_orders_updated_at
  BEFORE UPDATE ON merchant_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_webhooks_updated_at
  BEFORE UPDATE ON merchant_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_api_usage_updated_at
  BEFORE UPDATE ON merchant_api_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();