/*
  # Create Seller Collateral System

  1. Purpose
    - Track seller GHETTO collateral deposits
    - Enforce 1-year lock period on collateral
    - Calculate 2:1 selling limit based on collateral after lock release
    - Manage collateral lifecycle and withdrawals

  2. New Tables
    
    ### seller_collateral
    Tracks individual collateral deposits by sellers
    - `id` (uuid, primary key) - Unique identifier
    - `seller_id` (uuid, foreign key) - Reference to profiles table
    - `amount` (numeric) - Amount of GHETTO deposited
    - `deposit_date` (timestamptz) - When collateral was deposited
    - `lock_release_date` (timestamptz) - Date when 1-year lock expires
    - `is_locked` (boolean) - Whether collateral is still locked
    - `is_withdrawn` (boolean) - Whether collateral has been withdrawn
    - `withdrawal_date` (timestamptz) - When collateral was withdrawn
    - `blockchain_tx_hash` (text) - Transaction hash from blockchain
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

    ### seller_selling_limits
    Tracks seller selling limits based on collateral
    - `id` (uuid, primary key) - Unique identifier
    - `seller_id` (uuid, foreign key) - Reference to profiles table
    - `total_collateral` (numeric) - Total unlocked collateral amount
    - `selling_limit` (numeric) - Maximum allowed selling amount (2:1 ratio)
    - `current_utilization` (numeric) - Amount currently being used
    - `available_limit` (numeric) - Remaining available selling capacity
    - `last_calculated_at` (timestamptz) - When limits were last calculated
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  3. Security
    - Enable RLS on all tables
    - Sellers can view their own collateral records
    - Only system can update selling limits
    - Site masters can view all collateral records

  4. Functions
    - Function to calculate selling limits from collateral
    - Function to check if collateral lock has expired
    - Function to update available selling limits
*/

-- Create seller_collateral table
CREATE TABLE IF NOT EXISTS seller_collateral (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  deposit_date timestamptz NOT NULL DEFAULT now(),
  lock_release_date timestamptz NOT NULL DEFAULT (now() + INTERVAL '1 year'),
  is_locked boolean NOT NULL DEFAULT true,
  is_withdrawn boolean NOT NULL DEFAULT false,
  withdrawal_date timestamptz,
  blockchain_tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create seller_selling_limits table
CREATE TABLE IF NOT EXISTS seller_selling_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  total_collateral numeric NOT NULL DEFAULT 0,
  selling_limit numeric NOT NULL DEFAULT 0,
  current_utilization numeric NOT NULL DEFAULT 0,
  available_limit numeric NOT NULL DEFAULT 0,
  last_calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE seller_collateral ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_selling_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_collateral

-- Sellers can view their own collateral
CREATE POLICY "Sellers can view own collateral"
  ON seller_collateral
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Site masters can view all collateral
CREATE POLICY "Site masters can view all collateral"
  ON seller_collateral
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.username = 'sitemaster'
    )
  );

-- Only authenticated sellers can insert their own collateral
CREATE POLICY "Sellers can insert own collateral"
  ON seller_collateral
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- Sellers can update their own collateral (for withdrawals)
CREATE POLICY "Sellers can update own collateral"
  ON seller_collateral
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- RLS Policies for seller_selling_limits

-- Sellers can view their own limits
CREATE POLICY "Sellers can view own limits"
  ON seller_selling_limits
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Site masters can view all limits
CREATE POLICY "Site masters can view all limits"
  ON seller_selling_limits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.username = 'sitemaster'
    )
  );

-- System can insert and update limits
CREATE POLICY "System can manage limits"
  ON seller_selling_limits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to check and unlock expired collateral
CREATE OR REPLACE FUNCTION unlock_expired_collateral()
RETURNS void AS $$
BEGIN
  UPDATE seller_collateral
  SET 
    is_locked = false,
    updated_at = now()
  WHERE 
    is_locked = true 
    AND lock_release_date <= now()
    AND is_withdrawn = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate and update seller selling limits
CREATE OR REPLACE FUNCTION calculate_seller_limits(p_seller_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_total_collateral numeric;
  v_selling_limit numeric;
  v_current_utilization numeric;
  v_available_limit numeric;
BEGIN
  -- First, unlock any expired collateral
  PERFORM unlock_expired_collateral();
  
  -- Calculate total unlocked collateral
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_collateral
  FROM seller_collateral
  WHERE 
    seller_id = p_seller_id
    AND is_locked = false
    AND is_withdrawn = false;
  
  -- Calculate selling limit (2:1 ratio - can sell 2x their collateral)
  v_selling_limit := v_total_collateral * 2;
  
  -- Get current utilization from active orders
  SELECT COALESCE(SUM(amount), 0)
  INTO v_current_utilization
  FROM orders
  WHERE 
    seller_id = p_seller_id
    AND status IN ('created', 'funded', 'shipped', 'delivered', 'awaiting_release');
  
  -- Calculate available limit
  v_available_limit := v_selling_limit - v_current_utilization;
  
  -- Upsert into seller_selling_limits
  INSERT INTO seller_selling_limits (
    seller_id,
    total_collateral,
    selling_limit,
    current_utilization,
    available_limit,
    last_calculated_at
  ) VALUES (
    p_seller_id,
    v_total_collateral,
    v_selling_limit,
    v_current_utilization,
    v_available_limit,
    now()
  )
  ON CONFLICT (seller_id) DO UPDATE SET
    total_collateral = EXCLUDED.total_collateral,
    selling_limit = EXCLUDED.selling_limit,
    current_utilization = EXCLUDED.current_utilization,
    available_limit = EXCLUDED.available_limit,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'seller_id', p_seller_id,
    'total_collateral', v_total_collateral,
    'selling_limit', v_selling_limit,
    'current_utilization', v_current_utilization,
    'available_limit', v_available_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deposit collateral
CREATE OR REPLACE FUNCTION deposit_seller_collateral(
  p_seller_id uuid,
  p_amount numeric,
  p_tx_hash text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_collateral_id uuid;
  v_lock_release_date timestamptz;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Collateral amount must be positive';
  END IF;
  
  -- Calculate lock release date (1 year from now)
  v_lock_release_date := now() + INTERVAL '1 year';
  
  -- Insert collateral record
  INSERT INTO seller_collateral (
    seller_id,
    amount,
    deposit_date,
    lock_release_date,
    is_locked,
    blockchain_tx_hash
  ) VALUES (
    p_seller_id,
    p_amount,
    now(),
    v_lock_release_date,
    true,
    p_tx_hash
  )
  RETURNING id INTO v_collateral_id;
  
  -- Update seller profile to mark as seller
  UPDATE profiles
  SET is_seller = true
  WHERE id = p_seller_id;
  
  -- Recalculate limits (won't affect limit until lock expires)
  PERFORM calculate_seller_limits(p_seller_id);
  
  RETURN jsonb_build_object(
    'collateral_id', v_collateral_id,
    'amount', p_amount,
    'lock_release_date', v_lock_release_date,
    'status', 'deposited'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to withdraw unlocked collateral
CREATE OR REPLACE FUNCTION withdraw_seller_collateral(
  p_seller_id uuid,
  p_collateral_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_collateral seller_collateral%ROWTYPE;
  v_can_withdraw boolean;
BEGIN
  -- Get collateral record
  SELECT * INTO v_collateral
  FROM seller_collateral
  WHERE id = p_collateral_id AND seller_id = p_seller_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Collateral not found or does not belong to seller';
  END IF;
  
  -- Check if already withdrawn
  IF v_collateral.is_withdrawn THEN
    RAISE EXCEPTION 'Collateral already withdrawn';
  END IF;
  
  -- Check if lock has expired
  IF v_collateral.is_locked AND v_collateral.lock_release_date > now() THEN
    RAISE EXCEPTION 'Collateral is still locked until %', v_collateral.lock_release_date;
  END IF;
  
  -- Check if seller has active orders that require this collateral
  PERFORM calculate_seller_limits(p_seller_id);
  
  -- Mark as withdrawn
  UPDATE seller_collateral
  SET 
    is_withdrawn = true,
    withdrawal_date = now(),
    updated_at = now()
  WHERE id = p_collateral_id;
  
  -- Recalculate limits
  PERFORM calculate_seller_limits(p_seller_id);
  
  RETURN jsonb_build_object(
    'collateral_id', p_collateral_id,
    'amount', v_collateral.amount,
    'status', 'withdrawn'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS seller_collateral_seller_id_idx ON seller_collateral(seller_id);
CREATE INDEX IF NOT EXISTS seller_collateral_lock_status_idx ON seller_collateral(is_locked, lock_release_date);
CREATE INDEX IF NOT EXISTS seller_selling_limits_seller_id_idx ON seller_selling_limits(seller_id);

-- Create triggers for updated_at
CREATE TRIGGER seller_collateral_updated_at
  BEFORE UPDATE ON seller_collateral
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER seller_selling_limits_updated_at
  BEFORE UPDATE ON seller_selling_limits
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION unlock_expired_collateral TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_seller_limits TO authenticated;
GRANT EXECUTE ON FUNCTION deposit_seller_collateral TO authenticated;
GRANT EXECUTE ON FUNCTION withdraw_seller_collateral TO authenticated;
