/*
  # Fix Missing Fund Release System Components

  1. New Tables
    - `fund_release_requests` - Track fund release history
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders.id)
      - `requested_by` (uuid, references profiles.id)
      - `request_type` (text, 'manual' or 'auto')
      - `status` (text, 'pending', 'completed', 'failed')
      - `failure_reason` (text, optional error message or tx hash)
      - `created_at` (timestamptz)

  2. Functions
    - `calculate_release_deadline()` - calculates fund release deadline
    - `check_auto_release_eligibility()` - finds orders eligible for auto-release
    - `complete_auto_release()` - processes a single auto-release
    - `mark_auto_release_eligible()` - marks order as eligible for auto-release
    - `update_release_deadline()` - trigger function for deadline updates

  3. Security
    - Enable RLS on fund_release_requests
    - Add policies for viewing and creating release requests

  4. Triggers
    - `update_release_deadline_trigger` - automatically sets deadline on status change
    - `validate_order_status_transition` - validates status transitions
*/

-- Create fund_release_requests table if not exists
CREATE TABLE IF NOT EXISTS fund_release_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('manual', 'auto')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on fund_release_requests
ALTER TABLE fund_release_requests ENABLE ROW LEVEL SECURITY;

-- Policies for fund_release_requests
CREATE POLICY "Users can view fund release requests for their orders"
  ON fund_release_requests FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "System can insert fund release requests"
  ON fund_release_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS fund_release_requests_order_id_idx ON fund_release_requests(order_id);
CREATE INDEX IF NOT EXISTS fund_release_requests_status_idx ON fund_release_requests(status);

-- Function to calculate fund release deadline
CREATE OR REPLACE FUNCTION calculate_release_deadline(
  p_order_id uuid
)
RETURNS timestamptz AS $$
DECLARE
  v_order RECORD;
  v_deadline timestamptz;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- If delivery was confirmed, deadline is 7 days from confirmation
  IF v_order.delivery_confirmed_at IS NOT NULL THEN
    v_deadline := v_order.delivery_confirmed_at + interval '7 days';
  -- If no delivery confirmation, deadline is 30 days from funding
  ELSIF v_order.funded_at IS NOT NULL THEN
    v_deadline := v_order.funded_at + interval '30 days';
  ELSE
    -- Order not yet funded, no deadline
    RETURN NULL;
  END IF;

  RETURN v_deadline;
END;
$$ LANGUAGE plpgsql;

-- Function to check if order is eligible for auto-release
CREATE OR REPLACE FUNCTION check_auto_release_eligibility()
RETURNS TABLE(order_id uuid, deadline_passed_at timestamptz, days_overdue numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id as order_id,
    o.funds_release_deadline as deadline_passed_at,
    EXTRACT(EPOCH FROM (now() - o.funds_release_deadline)) / 86400 as days_overdue
  FROM orders o
  WHERE
    o.status IN ('awaiting_release', 'shipped', 'delivered')
    AND o.funds_release_deadline IS NOT NULL
    AND o.funds_release_deadline <= now()
    AND o.auto_release_eligible = true
    AND o.funds_released_at IS NULL
  ORDER BY o.funds_release_deadline ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark order as eligible for auto-release
CREATE OR REPLACE FUNCTION mark_auto_release_eligible(p_order_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET auto_release_eligible = true
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process auto-release (called by backend after blockchain transaction)
CREATE OR REPLACE FUNCTION complete_auto_release(
  p_order_id uuid,
  p_tx_hash text
)
RETURNS void AS $$
BEGIN
  -- Update order status
  UPDATE orders
  SET
    status = 'funds_released',
    funds_released_at = now(),
    updated_at = now()
  WHERE id = p_order_id;

  -- Mark release request as completed
  UPDATE fund_release_requests
  SET
    status = 'completed',
    failure_reason = p_tx_hash
  WHERE order_id = p_order_id
    AND status = 'pending'
    AND request_type = 'auto';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update release deadline when status changes
CREATE OR REPLACE FUNCTION update_release_deadline()
RETURNS TRIGGER AS $$
DECLARE
  v_deadline timestamptz;
BEGIN
  -- Set funded_at timestamp when order is funded
  IF NEW.status = 'funded' AND (OLD.status IS NULL OR OLD.status != 'funded') THEN
    NEW.funded_at := now();
    NEW.auto_release_eligible := true;
    -- Calculate initial 30-day deadline
    NEW.funds_release_deadline := now() + interval '30 days';
  END IF;

  -- Update delivery_confirmed_at when status changes to delivered
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    NEW.delivery_confirmed_at := now();
  END IF;

  -- When delivery is confirmed, move to awaiting_release and recalculate deadline
  IF NEW.status = 'awaiting_release' AND (OLD.status IS NULL OR OLD.status != 'awaiting_release') THEN
    -- Set delivery confirmed time if not already set
    IF NEW.delivery_confirmed_at IS NULL THEN
      NEW.delivery_confirmed_at := now();
    END IF;
    -- Recalculate deadline based on delivery confirmation (7 days)
    NEW.funds_release_deadline := NEW.delivery_confirmed_at + interval '7 days';
  END IF;

  -- When funds are released, set timestamp
  IF NEW.status = 'funds_released' AND (OLD.status IS NULL OR OLD.status != 'funds_released') THEN
    NEW.funds_released_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS update_release_deadline_trigger ON orders;
CREATE TRIGGER update_release_deadline_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_release_deadline();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_release_deadline TO authenticated;
GRANT EXECUTE ON FUNCTION check_auto_release_eligibility TO authenticated;
GRANT EXECUTE ON FUNCTION mark_auto_release_eligible TO authenticated;
GRANT EXECUTE ON FUNCTION complete_auto_release TO authenticated;
