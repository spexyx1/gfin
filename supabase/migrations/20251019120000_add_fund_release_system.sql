/*
  # Add Fund Release System to Escrow Orders

  1. Changes to Existing Tables
    - Add new columns to `orders` table:
      - `delivery_confirmed_at` (timestamptz) - when buyer confirms delivery
      - `funds_release_deadline` (timestamptz) - deadline for fund release
      - `funds_released_at` (timestamptz) - when funds were released
      - `auto_release_eligible` (boolean) - flag for automatic release eligibility
      - `funded_at` (timestamptz) - when order was funded (for 30-day calculation)

    - Update status enum to include:
      - 'awaiting_release' - delivery confirmed, waiting for buyer to release funds
      - 'funds_released' - funds have been released to seller

  2. New Tables
    - `fund_release_requests` - track fund release history
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders.id)
      - `requested_by` (uuid, references profiles.id)
      - `request_type` (text, 'manual' or 'auto')
      - `status` (text, 'pending', 'completed', 'failed')
      - `created_at` (timestamptz)

  3. Security
    - Update RLS policies for new status values
    - Add policies for fund_release_requests table

  4. Functions
    - `calculate_release_deadline()` - calculates fund release deadline
    - `check_auto_release_eligibility()` - finds orders eligible for auto-release
    - `process_auto_release()` - processes a single auto-release
    - Update status transition validation for new statuses

  5. Triggers
    - `update_release_deadline` - automatically sets deadline on status change
*/

-- Add new columns to orders table
DO $$
BEGIN
  -- Add delivery_confirmed_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_confirmed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_confirmed_at timestamptz;
  END IF;

  -- Add funds_release_deadline if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'funds_release_deadline'
  ) THEN
    ALTER TABLE orders ADD COLUMN funds_release_deadline timestamptz;
  END IF;

  -- Add funds_released_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'funds_released_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN funds_released_at timestamptz;
  END IF;

  -- Add auto_release_eligible if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'auto_release_eligible'
  ) THEN
    ALTER TABLE orders ADD COLUMN auto_release_eligible boolean DEFAULT false;
  END IF;

  -- Add funded_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'funded_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN funded_at timestamptz;
  END IF;

  -- Add payment_token if not exists (for tracking which token was used)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_token'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_token text DEFAULT 'GHETTO';
  END IF;

  -- Add currency if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'currency'
  ) THEN
    ALTER TABLE orders ADD COLUMN currency text DEFAULT 'GHETTO';
  END IF;

  -- Add tracking columns if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'carrier'
  ) THEN
    ALTER TABLE orders ADD COLUMN carrier text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'estimated_delivery'
  ) THEN
    ALTER TABLE orders ADD COLUMN estimated_delivery timestamptz;
  END IF;
END $$;

-- Drop the old status constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new status constraint with additional statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('created', 'funded', 'shipped', 'delivered', 'awaiting_release', 'funds_released', 'completed', 'disputed', 'cancelled'));

-- Create fund_release_requests table
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

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS orders_delivery_confirmed_at_idx ON orders(delivery_confirmed_at);
CREATE INDEX IF NOT EXISTS orders_funds_release_deadline_idx ON orders(funds_release_deadline);
CREATE INDEX IF NOT EXISTS orders_auto_release_eligible_idx ON orders(auto_release_eligible);
CREATE INDEX IF NOT EXISTS orders_funded_at_idx ON orders(funded_at);

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
  IF NEW.status = 'funded' AND OLD.status != 'funded' THEN
    NEW.funded_at := now();
    NEW.auto_release_eligible := true;
    -- Calculate initial 30-day deadline
    NEW.funds_release_deadline := now() + interval '30 days';
  END IF;

  -- Update delivery_confirmed_at when status changes to delivered
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivery_confirmed_at := now();
  END IF;

  -- When delivery is confirmed, move to awaiting_release and recalculate deadline
  IF NEW.status = 'awaiting_release' AND OLD.status != 'awaiting_release' THEN
    -- Recalculate deadline based on delivery confirmation (7 days)
    v_deadline := calculate_release_deadline(NEW.id);
    NEW.funds_release_deadline := v_deadline;
  END IF;

  -- When funds are released, move to completed after a short delay
  IF NEW.status = 'funds_released' AND OLD.status != 'funds_released' THEN
    NEW.funds_released_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS update_release_deadline_trigger ON orders;

-- Create trigger for release deadline updates
CREATE TRIGGER update_release_deadline_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_release_deadline();

-- Update the status validation function to include new statuses
CREATE OR REPLACE FUNCTION validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow any status change for new records
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Validate status transitions
  CASE OLD.status
    WHEN 'created' THEN
      IF NEW.status NOT IN ('funded', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from created to %', NEW.status;
      END IF;
    WHEN 'funded' THEN
      IF NEW.status NOT IN ('shipped', 'disputed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from funded to %', NEW.status;
      END IF;
    WHEN 'shipped' THEN
      IF NEW.status NOT IN ('delivered', 'disputed', 'funds_released') THEN
        RAISE EXCEPTION 'Invalid status transition from shipped to %', NEW.status;
      END IF;
    WHEN 'delivered' THEN
      IF NEW.status NOT IN ('awaiting_release', 'disputed') THEN
        RAISE EXCEPTION 'Invalid status transition from delivered to %', NEW.status;
      END IF;
    WHEN 'awaiting_release' THEN
      IF NEW.status NOT IN ('funds_released', 'disputed') THEN
        RAISE EXCEPTION 'Invalid status transition from awaiting_release to %', NEW.status;
      END IF;
    WHEN 'funds_released' THEN
      IF NEW.status NOT IN ('completed') THEN
        RAISE EXCEPTION 'Invalid status transition from funds_released to %', NEW.status;
      END IF;
    WHEN 'completed' THEN
      -- Completed orders cannot change status
      IF NEW.status != 'completed' THEN
        RAISE EXCEPTION 'Cannot change status of completed order';
      END IF;
    WHEN 'disputed' THEN
      IF NEW.status NOT IN ('completed', 'cancelled', 'funds_released') THEN
        RAISE EXCEPTION 'Invalid status transition from disputed to %', NEW.status;
      END IF;
    WHEN 'cancelled' THEN
      -- Cancelled orders cannot change status
      IF NEW.status != 'cancelled' THEN
        RAISE EXCEPTION 'Cannot change status of cancelled order';
      END IF;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN orders.delivery_confirmed_at IS 'Timestamp when buyer confirmed delivery';
COMMENT ON COLUMN orders.funds_release_deadline IS 'Deadline for fund release: 7 days after delivery confirmation or 30 days after funding';
COMMENT ON COLUMN orders.funds_released_at IS 'Timestamp when funds were released to seller';
COMMENT ON COLUMN orders.auto_release_eligible IS 'Whether order is eligible for automatic fund release';
COMMENT ON COLUMN orders.funded_at IS 'Timestamp when order was funded (for 30-day auto-release calculation)';

COMMENT ON TABLE fund_release_requests IS 'Tracks fund release requests and their status';
COMMENT ON FUNCTION calculate_release_deadline IS 'Calculates fund release deadline: 7 days after delivery or 30 days after funding';
COMMENT ON FUNCTION check_auto_release_eligibility IS 'Returns orders eligible for automatic fund release';
