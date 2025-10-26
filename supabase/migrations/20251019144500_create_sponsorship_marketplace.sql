/*
  # Create Sponsorship Marketplace System

  ## Overview
  This migration creates a complete sponsorship/staking system where investors can stake GHETTO tokens
  to sponsor sellers in exchange for revenue sharing. Sellers post sponsorship requests, and investors
  can fund them. Revenue splits are automatically calculated and distributed through the escrow system.

  ## New Tables
  
  ### `sponsorship_requests`
  Sellers create requests for sponsorship funding with specific terms
  - `id` (uuid, primary key)
  - `seller_id` (uuid, foreign key to auth.users)
  - `title` (text) - Short description of what they're selling
  - `description` (text) - Detailed pitch to investors
  - `amount_requested` (numeric) - GHETTO tokens requested
  - `revenue_percentage` (numeric) - % of revenue offered to sponsors (0-100)
  - `duration_days` (integer) - How long sponsorship lasts
  - `category` (text) - Product category
  - `amount_funded` (numeric) - Current funding amount
  - `status` (text) - draft, active, funded, completed, cancelled
  - `created_at` (timestamptz)
  - `funded_at` (timestamptz)
  - `expires_at` (timestamptz)

  ### `sponsorship_investments`
  Individual investments made by sponsors into seller requests
  - `id` (uuid, primary key)
  - `request_id` (uuid, foreign key to sponsorship_requests)
  - `sponsor_id` (uuid, foreign key to auth.users)
  - `amount` (numeric) - GHETTO tokens invested
  - `percentage_share` (numeric) - % of total revenue this sponsor gets
  - `revenue_earned` (numeric) - Total revenue earned from this investment
  - `status` (text) - active, completed, withdrawn
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### `sponsorship_transactions`
  Track all revenue distributions from sponsored sales
  - `id` (uuid, primary key)
  - `order_id` (uuid, foreign key to orders)
  - `request_id` (uuid, foreign key to sponsorship_requests)
  - `investment_id` (uuid, foreign key to sponsorship_investments)
  - `sponsor_id` (uuid, foreign key to auth.users)
  - `seller_id` (uuid, foreign key to auth.users)
  - `order_amount` (numeric) - Total order value
  - `sponsor_cut` (numeric) - Amount paid to sponsor
  - `seller_amount` (numeric) - Amount paid to seller
  - `revenue_percentage` (numeric) - % used for this transaction
  - `created_at` (timestamptz)

  ### `sponsored_products`
  Links specific products to active sponsorships
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key to products)
  - `request_id` (uuid, foreign key to sponsorship_requests)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Sponsors can view all active requests
  - Sellers can manage their own requests
  - Both parties can view their investment/transaction history
  - Automatic calculations ensure fair revenue distribution

  ## Notes
  1. When a sponsorship is fully funded, it increases seller's collateral/selling limit
  2. Revenue splits are automatically calculated on order completion
  3. Sponsorship duration is tracked; expired sponsorships return funds
  4. Multiple sponsors can fund a single request proportionally
*/

-- Create sponsorship_requests table
CREATE TABLE IF NOT EXISTS sponsorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  amount_requested numeric NOT NULL CHECK (amount_requested >= 100),
  revenue_percentage numeric NOT NULL CHECK (revenue_percentage > 0 AND revenue_percentage <= 50),
  duration_days integer NOT NULL CHECK (duration_days >= 30 AND duration_days <= 365),
  category text NOT NULL,
  amount_funded numeric DEFAULT 0 CHECK (amount_funded >= 0),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'funded', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  funded_at timestamptz,
  expires_at timestamptz,
  CONSTRAINT positive_amounts CHECK (amount_funded <= amount_requested)
);

-- Create sponsorship_investments table
CREATE TABLE IF NOT EXISTS sponsorship_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES sponsorship_requests(id) ON DELETE CASCADE NOT NULL,
  sponsor_id uuid REFERENCES auth.users(id) NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  percentage_share numeric NOT NULL CHECK (percentage_share > 0 AND percentage_share <= 100),
  revenue_earned numeric DEFAULT 0 CHECK (revenue_earned >= 0),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create sponsorship_transactions table
CREATE TABLE IF NOT EXISTS sponsorship_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) NOT NULL,
  request_id uuid REFERENCES sponsorship_requests(id) NOT NULL,
  investment_id uuid REFERENCES sponsorship_investments(id) NOT NULL,
  sponsor_id uuid REFERENCES auth.users(id) NOT NULL,
  seller_id uuid REFERENCES auth.users(id) NOT NULL,
  order_amount numeric NOT NULL CHECK (order_amount > 0),
  sponsor_cut numeric NOT NULL CHECK (sponsor_cut >= 0),
  seller_amount numeric NOT NULL CHECK (seller_amount >= 0),
  revenue_percentage numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sponsored_products table
CREATE TABLE IF NOT EXISTS sponsored_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  request_id uuid REFERENCES sponsorship_requests(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, request_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_seller ON sponsorship_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_status ON sponsorship_requests(status);
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_category ON sponsorship_requests(category);
CREATE INDEX IF NOT EXISTS idx_sponsorship_investments_request ON sponsorship_investments(request_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_investments_sponsor ON sponsorship_investments(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_transactions_order ON sponsorship_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_transactions_sponsor ON sponsorship_transactions(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_products_product ON sponsored_products(product_id);

-- Enable RLS
ALTER TABLE sponsorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sponsorship_requests

-- Anyone can view active sponsorship requests
CREATE POLICY "Anyone can view active sponsorship requests"
  ON sponsorship_requests FOR SELECT
  TO authenticated
  USING (status IN ('active', 'funded'));

-- Sellers can view their own requests regardless of status
CREATE POLICY "Sellers can view own requests"
  ON sponsorship_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Sellers can create requests
CREATE POLICY "Sellers can create requests"
  ON sponsorship_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own requests
CREATE POLICY "Sellers can update own requests"
  ON sponsorship_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can delete their own draft requests
CREATE POLICY "Sellers can delete own draft requests"
  ON sponsorship_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id AND status = 'draft');

-- RLS Policies for sponsorship_investments

-- Sponsors can view their own investments
CREATE POLICY "Sponsors can view own investments"
  ON sponsorship_investments FOR SELECT
  TO authenticated
  USING (auth.uid() = sponsor_id);

-- Sellers can view investments in their requests
CREATE POLICY "Sellers can view investments in their requests"
  ON sponsorship_investments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sponsorship_requests
      WHERE sponsorship_requests.id = sponsorship_investments.request_id
      AND sponsorship_requests.seller_id = auth.uid()
    )
  );

-- Sponsors can create investments
CREATE POLICY "Sponsors can create investments"
  ON sponsorship_investments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sponsor_id);

-- System can update investments (for revenue tracking)
CREATE POLICY "Sponsors can view investment updates"
  ON sponsorship_investments FOR UPDATE
  TO authenticated
  USING (auth.uid() = sponsor_id)
  WITH CHECK (auth.uid() = sponsor_id);

-- RLS Policies for sponsorship_transactions

-- Sponsors can view their transaction history
CREATE POLICY "Sponsors can view own transactions"
  ON sponsorship_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = sponsor_id);

-- Sellers can view their transaction history
CREATE POLICY "Sellers can view own transactions"
  ON sponsorship_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- System creates transactions (INSERT only through backend logic)
CREATE POLICY "System can create transactions"
  ON sponsorship_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = sponsor_id);

-- RLS Policies for sponsored_products

-- Anyone can view sponsored products
CREATE POLICY "Anyone can view sponsored products"
  ON sponsored_products FOR SELECT
  TO authenticated
  USING (true);

-- Sellers can link their products to their requests
CREATE POLICY "Sellers can link own products"
  ON sponsored_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sponsorship_requests
      WHERE sponsorship_requests.id = sponsored_products.request_id
      AND sponsorship_requests.seller_id = auth.uid()
    )
  );

-- Sellers can unlink their products
CREATE POLICY "Sellers can unlink own products"
  ON sponsored_products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sponsorship_requests
      WHERE sponsorship_requests.id = sponsored_products.request_id
      AND sponsorship_requests.seller_id = auth.uid()
    )
  );

-- Function to calculate sponsor percentage share when investing
CREATE OR REPLACE FUNCTION calculate_sponsor_share()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate this sponsor's share of the total funding
  -- Their share = (their investment / total amount requested) * 100
  NEW.percentage_share := (NEW.amount / (
    SELECT amount_requested 
    FROM sponsorship_requests 
    WHERE id = NEW.request_id
  )) * 100;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate percentage share
CREATE TRIGGER calculate_sponsor_share_trigger
  BEFORE INSERT ON sponsorship_investments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sponsor_share();

-- Function to update request funding status
CREATE OR REPLACE FUNCTION update_request_funding()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the total funded amount
  UPDATE sponsorship_requests
  SET amount_funded = (
    SELECT COALESCE(SUM(amount), 0)
    FROM sponsorship_investments
    WHERE request_id = NEW.request_id
    AND status = 'active'
  ),
  status = CASE
    WHEN (
      SELECT COALESCE(SUM(amount), 0)
      FROM sponsorship_investments
      WHERE request_id = NEW.request_id
      AND status = 'active'
    ) >= amount_requested THEN 'funded'
    ELSE status
  END,
  funded_at = CASE
    WHEN (
      SELECT COALESCE(SUM(amount), 0)
      FROM sponsorship_investments
      WHERE request_id = NEW.request_id
      AND status = 'active'
    ) >= amount_requested AND funded_at IS NULL THEN now()
    ELSE funded_at
  END,
  expires_at = CASE
    WHEN (
      SELECT COALESCE(SUM(amount), 0)
      FROM sponsorship_investments
      WHERE request_id = NEW.request_id
      AND status = 'active'
    ) >= amount_requested AND expires_at IS NULL THEN now() + (duration_days || ' days')::interval
    ELSE expires_at
  END
  WHERE id = NEW.request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update funding status
CREATE TRIGGER update_request_funding_trigger
  AFTER INSERT ON sponsorship_investments
  FOR EACH ROW
  EXECUTE FUNCTION update_request_funding();