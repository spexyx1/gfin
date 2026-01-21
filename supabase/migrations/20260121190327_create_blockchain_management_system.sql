/*
  # Blockchain Management System for Token & Escrow Tracking

  ## Overview
  This migration creates a comprehensive blockchain tracking system for the Polygon-based
  GHETTO token and Escrow smart contracts. It enables the sitemaster dashboard to monitor
  all on-chain activities, token holders, transactions, and analytics.

  ## New Tables

  ### 1. blockchain_transactions
  - Tracks all blockchain transactions initiated through the platform
  - Fields: tx_hash, contract_address, function_name, from_address, to_address, value, gas_used, status, etc.
  
  ### 2. token_holders
  - Maintains current state of all GHETTO token holders
  - Fields: wallet_address, balance, percentage_of_supply, first_seen, last_updated
  
  ### 3. token_transfers
  - Logs all token transfer events from the blockchain
  - Fields: tx_hash, from_address, to_address, amount, block_number, timestamp
  
  ### 4. contract_events
  - Stores all emitted events from both Token and Escrow contracts
  - Fields: contract_address, event_name, event_data, block_number, tx_hash, timestamp
  
  ### 5. token_allowances
  - Tracks approved spending limits for tokens
  - Fields: owner_address, spender_address, amount, contract_address
  
  ### 6. blockchain_analytics
  - Aggregated metrics and statistics (daily/weekly/monthly)
  - Fields: metric_type, metric_value, time_period, calculation_date
  
  ### 7. escrow_deal_tracking
  - Enhanced tracking for escrow contract interactions
  - Fields: order_id, on_chain_status, buyer_address, seller_address, amount, payment_token
  
  ### 8. blockchain_sync_status
  - Tracks synchronization progress with blockchain
  - Fields: contract_address, last_synced_block, sync_status, last_sync_time

  ## Security
  - RLS enabled on all tables
  - Only sitemasters can insert/update/delete
  - All users can view (for transparency)
  
  ## Indexes
  - Optimized indexes for wallet addresses, transaction hashes, and timestamps
  - Composite indexes for common query patterns
*/

-- Table 1: blockchain_transactions
CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash text UNIQUE NOT NULL,
  contract_address text NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('token', 'escrow', 'other')),
  function_name text NOT NULL,
  from_address text NOT NULL,
  to_address text,
  value_wei text,
  value_formatted numeric,
  gas_used bigint,
  gas_price_gwei numeric,
  total_cost_eth numeric,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed', 'reverted')),
  confirmations integer DEFAULT 0,
  block_number bigint,
  block_timestamp timestamptz,
  initiated_by uuid REFERENCES profiles(id),
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON blockchain_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_from ON blockchain_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_to ON blockchain_transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_contract ON blockchain_transactions(contract_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_timestamp ON blockchain_transactions(block_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_block ON blockchain_transactions(block_number DESC);

-- Table 2: token_holders
CREATE TABLE IF NOT EXISTS token_holders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  balance_wei text NOT NULL DEFAULT '0',
  percentage_of_supply numeric DEFAULT 0,
  is_contract boolean DEFAULT false,
  is_blacklisted boolean DEFAULT false,
  is_whitelisted boolean DEFAULT false,
  first_seen_block bigint,
  first_seen_at timestamptz,
  last_transfer_at timestamptz,
  total_received numeric DEFAULT 0,
  total_sent numeric DEFAULT 0,
  transaction_count integer DEFAULT 0,
  user_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_holders_address ON token_holders(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_holders_balance ON token_holders(balance DESC);
CREATE INDEX IF NOT EXISTS idx_token_holders_user ON token_holders(user_id);
CREATE INDEX IF NOT EXISTS idx_token_holders_blacklisted ON token_holders(is_blacklisted);

-- Table 3: token_transfers
CREATE TABLE IF NOT EXISTS token_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash text NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount numeric NOT NULL,
  amount_wei text NOT NULL,
  token_contract text NOT NULL,
  block_number bigint NOT NULL,
  block_timestamp timestamptz NOT NULL,
  log_index integer,
  transfer_type text CHECK (transfer_type IN ('transfer', 'mint', 'burn', 'approval')),
  is_internal boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_transfers_hash ON token_transfers(tx_hash);
CREATE INDEX IF NOT EXISTS idx_token_transfers_from ON token_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_token_transfers_to ON token_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_token_transfers_block ON token_transfers(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_token_transfers_timestamp ON token_transfers(block_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_token_transfers_type ON token_transfers(transfer_type);

-- Table 4: contract_events
CREATE TABLE IF NOT EXISTS contract_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address text NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('token', 'escrow', 'other')),
  event_name text NOT NULL,
  event_signature text NOT NULL,
  event_data jsonb NOT NULL,
  indexed_params jsonb,
  tx_hash text NOT NULL,
  block_number bigint NOT NULL,
  block_timestamp timestamptz NOT NULL,
  log_index integer,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_events_address ON contract_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_contract_events_name ON contract_events(event_name);
CREATE INDEX IF NOT EXISTS idx_contract_events_hash ON contract_events(tx_hash);
CREATE INDEX IF NOT EXISTS idx_contract_events_block ON contract_events(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_contract_events_timestamp ON contract_events(block_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_contract_events_processed ON contract_events(processed) WHERE NOT processed;

-- Table 5: token_allowances
CREATE TABLE IF NOT EXISTS token_allowances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address text NOT NULL,
  spender_address text NOT NULL,
  amount numeric NOT NULL,
  amount_wei text NOT NULL,
  contract_address text NOT NULL,
  is_unlimited boolean DEFAULT false,
  last_updated_block bigint,
  last_updated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_address, spender_address, contract_address)
);

CREATE INDEX IF NOT EXISTS idx_token_allowances_owner ON token_allowances(owner_address);
CREATE INDEX IF NOT EXISTS idx_token_allowances_spender ON token_allowances(spender_address);
CREATE INDEX IF NOT EXISTS idx_token_allowances_contract ON token_allowances(contract_address);

-- Table 6: blockchain_analytics
CREATE TABLE IF NOT EXISTS blockchain_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_data jsonb,
  time_period text NOT NULL CHECK (time_period IN ('hourly', 'daily', 'weekly', 'monthly', 'all_time')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  calculation_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(metric_type, metric_name, time_period, period_start)
);

CREATE INDEX IF NOT EXISTS idx_blockchain_analytics_type ON blockchain_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_analytics_name ON blockchain_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_blockchain_analytics_period ON blockchain_analytics(time_period, period_start DESC);

-- Table 7: escrow_deal_tracking
CREATE TABLE IF NOT EXISTS escrow_deal_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  on_chain_order_id text NOT NULL,
  buyer_address text NOT NULL,
  seller_address text NOT NULL,
  amount numeric NOT NULL,
  amount_wei text NOT NULL,
  seller_hold_amount numeric,
  seller_hold_amount_wei text,
  payment_token_address text NOT NULL,
  payment_token_symbol text,
  on_chain_status text NOT NULL,
  created_tx_hash text,
  created_block bigint,
  created_at_chain timestamptz,
  funded_tx_hash text,
  funded_block bigint,
  funded_at_chain timestamptz,
  shipped_tx_hash text,
  shipped_block bigint,
  shipped_at_chain timestamptz,
  delivered_tx_hash text,
  delivered_block bigint,
  delivered_at_chain timestamptz,
  completed_tx_hash text,
  completed_block bigint,
  completed_at_chain timestamptz,
  disputed_tx_hash text,
  disputed_block bigint,
  disputed_at_chain timestamptz,
  cancelled_tx_hash text,
  cancelled_block bigint,
  cancelled_at_chain timestamptz,
  last_synced_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_tracking_order ON escrow_deal_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_tracking_on_chain_id ON escrow_deal_tracking(on_chain_order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_tracking_buyer ON escrow_deal_tracking(buyer_address);
CREATE INDEX IF NOT EXISTS idx_escrow_tracking_seller ON escrow_deal_tracking(seller_address);
CREATE INDEX IF NOT EXISTS idx_escrow_tracking_status ON escrow_deal_tracking(on_chain_status);

-- Table 8: blockchain_sync_status
CREATE TABLE IF NOT EXISTS blockchain_sync_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address text UNIQUE NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('token', 'escrow', 'other')),
  contract_name text NOT NULL,
  network text NOT NULL DEFAULT 'polygon',
  deployment_block bigint NOT NULL,
  last_synced_block bigint NOT NULL,
  current_block bigint,
  sync_status text NOT NULL CHECK (sync_status IN ('syncing', 'synced', 'error', 'paused')),
  sync_progress numeric DEFAULT 0,
  last_sync_time timestamptz,
  last_sync_duration_ms integer,
  error_message text,
  events_synced integer DEFAULT 0,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_status_address ON blockchain_sync_status(contract_address);
CREATE INDEX IF NOT EXISTS idx_sync_status_type ON blockchain_sync_status(contract_type);
CREATE INDEX IF NOT EXISTS idx_sync_status_status ON blockchain_sync_status(sync_status);

-- Enable Row Level Security
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_deal_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Sitemasters can do everything
CREATE POLICY "Sitemasters can manage blockchain_transactions"
  ON blockchain_transactions
  FOR ALL
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

CREATE POLICY "Sitemasters can manage token_holders"
  ON token_holders
  FOR ALL
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

CREATE POLICY "Sitemasters can manage token_transfers"
  ON token_transfers
  FOR ALL
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

CREATE POLICY "Sitemasters can manage contract_events"
  ON contract_events
  FOR ALL
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

CREATE POLICY "Sitemasters can manage token_allowances"
  ON token_allowances
  FOR ALL
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

CREATE POLICY "Sitemasters can manage blockchain_analytics"
  ON blockchain_analytics
  FOR ALL
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

CREATE POLICY "Sitemasters can manage escrow_deal_tracking"
  ON escrow_deal_tracking
  FOR ALL
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

CREATE POLICY "Sitemasters can manage blockchain_sync_status"
  ON blockchain_sync_status
  FOR ALL
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

-- Public read policies for transparency (authenticated users only)
CREATE POLICY "Users can view blockchain_transactions"
  ON blockchain_transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view token_holders"
  ON token_holders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view token_transfers"
  ON token_transfers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view contract_events"
  ON contract_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view blockchain_analytics"
  ON blockchain_analytics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their escrow deals"
  ON escrow_deal_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.wallet_address = buyer_address OR profiles.wallet_address = seller_address)
    )
  );

-- Functions for automated updates
CREATE OR REPLACE FUNCTION update_token_holder_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_supply numeric;
BEGIN
  -- Get total supply from blockchain_analytics or calculate
  SELECT COALESCE(SUM(balance), 0) INTO total_supply FROM token_holders;
  
  IF total_supply > 0 THEN
    -- Update percentages for all holders
    UPDATE token_holders
    SET percentage_of_supply = (balance / total_supply) * 100,
        updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_holder_percentages
AFTER INSERT OR UPDATE OF balance ON token_holders
FOR EACH ROW
EXECUTE FUNCTION update_token_holder_percentage();

-- Function to update blockchain transaction status
CREATE OR REPLACE FUNCTION update_blockchain_tx_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_blockchain_tx_updated_at
BEFORE UPDATE ON blockchain_transactions
FOR EACH ROW
EXECUTE FUNCTION update_blockchain_tx_updated_at();

CREATE TRIGGER set_token_holder_updated_at
BEFORE UPDATE ON token_holders
FOR EACH ROW
EXECUTE FUNCTION update_blockchain_tx_updated_at();

CREATE TRIGGER set_sync_status_updated_at
BEFORE UPDATE ON blockchain_sync_status
FOR EACH ROW
EXECUTE FUNCTION update_blockchain_tx_updated_at();
