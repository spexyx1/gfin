/*
  # Create orders table for escrow order management

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `buyer_id` (uuid, references profiles.id)
      - `seller_id` (uuid, references profiles.id)
      - `product_id` (uuid, references products.id)
      - `amount` (numeric, order amount in USDC)
      - `seller_hold_amount` (numeric, 10% security deposit)
      - `status` (text, order status)
      - `seller_agreed` (boolean, seller agreement status)
      - `description` (text, order description)
      - `shipped_at` (timestamptz, shipping timestamp)
      - `delivered_at` (timestamptz, delivery timestamp)
      - `dispute_reason` (text, dispute reason if applicable)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)

  2. Security
    - Enable RLS on `orders` table
    - Add policy for buyers and sellers to view their own orders
    - Add policy for order participants to update order status
    - Add policy for authenticated users to create orders

  3. Functions
    - Create trigger to update updated_at timestamp
    - Create function to calculate seller hold amount
    - Create function to validate order status transitions

  4. Indexes
    - Create indexes for better query performance
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  seller_hold_amount numeric NOT NULL DEFAULT 0 CHECK (seller_hold_amount >= 0),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'funded', 'shipped', 'delivered', 'completed', 'disputed', 'cancelled')),
  seller_agreed boolean DEFAULT false,
  description text NOT NULL,
  shipped_at timestamptz,
  delivered_at timestamptz,
  dispute_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure buyer and seller are different
  CONSTRAINT different_buyer_seller CHECK (buyer_id != seller_id)
);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Authenticated users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Order participants can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Create trigger for updated_at
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_seller_id_idx ON orders(seller_id);
CREATE INDEX IF NOT EXISTS orders_product_id_idx ON orders(product_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);

-- Create function to calculate seller hold amount (10% of order value)
CREATE OR REPLACE FUNCTION calculate_seller_hold_amount(order_amount numeric)
RETURNS numeric AS $$
BEGIN
  RETURN order_amount * 0.1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to validate order status transitions
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
      IF NEW.status NOT IN ('delivered', 'disputed') THEN
        RAISE EXCEPTION 'Invalid status transition from shipped to %', NEW.status;
      END IF;
    WHEN 'delivered' THEN
      IF NEW.status NOT IN ('completed', 'disputed') THEN
        RAISE EXCEPTION 'Invalid status transition from delivered to %', NEW.status;
      END IF;
    WHEN 'completed' THEN
      -- Completed orders cannot change status
      IF NEW.status != 'completed' THEN
        RAISE EXCEPTION 'Cannot change status of completed order';
      END IF;
    WHEN 'disputed' THEN
      IF NEW.status NOT IN ('completed', 'cancelled') THEN
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

-- Create trigger for status validation
CREATE TRIGGER validate_order_status_transition_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_status_transition();

-- Create function to automatically set seller hold amount on insert
CREATE OR REPLACE FUNCTION set_seller_hold_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seller_hold_amount = 0 THEN
    NEW.seller_hold_amount = calculate_seller_hold_amount(NEW.amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set seller hold amount
CREATE TRIGGER set_seller_hold_amount_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_seller_hold_amount();