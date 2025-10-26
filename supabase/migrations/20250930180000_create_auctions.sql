/*
  # Create Auctions System

  1. New Tables
    - `auctions`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products.id)
      - `seller_id` (uuid, references profiles.id)
      - `auction_type` (text, 'english' or 'dutch')
      - `start_price` (numeric, starting/current price for auction)
      - `reserve_price` (numeric, minimum price to accept)
      - `current_price` (numeric, current bid price)
      - `buy_now_price` (numeric, optional instant purchase price)
      - `start_time` (timestamptz, auction start)
      - `end_time` (timestamptz, auction end)
      - `original_end_time` (timestamptz, for tracking extensions)
      - `status` (text, 'active', 'ended', 'cancelled')
      - `winner_id` (uuid, references profiles.id)
      - `total_bids` (integer, bid count)
      - `view_count` (integer, view count)
      - `extension_count` (integer, anti-snipe extensions)
      - `dutch_decrement_hours` (integer, hours between price drops)
      - `dutch_decrement_percent` (numeric, percentage to drop)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `auction_bids`
      - `id` (uuid, primary key)
      - `auction_id` (uuid, references auctions.id)
      - `bidder_id` (uuid, references profiles.id)
      - `amount` (numeric, bid amount)
      - `bid_type` (text, 'manual' or 'auto')
      - `auto_bid_max` (numeric, max amount for proxy bidding)
      - `is_winning` (boolean, current winning bid)
      - `created_at` (timestamptz)

    - `auction_watchers`
      - `id` (uuid, primary key)
      - `auction_id` (uuid, references auctions.id)
      - `user_id` (uuid, references profiles.id)
      - `notify_outbid` (boolean, notify when outbid)
      - `notify_ending_soon` (boolean, notify 1 hour before end)
      - `notify_won` (boolean, notify if won)
      - `created_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `is_auction` boolean to products table
    - Add `auction_id` uuid to orders table

  3. Security
    - Enable RLS on all auction tables
    - Public can view active auctions
    - Sellers can create and manage auctions
    - Users can place bids on others' auctions
    - Users can manage their own watch lists

  4. Functions
    - Validate bid amounts and eligibility
    - Auto-close expired auctions
    - Calculate Dutch auction prices
    - Handle anti-sniping extensions
    - Process auction winner selection
*/

-- Add is_auction field to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_auction'
  ) THEN
    ALTER TABLE products ADD COLUMN is_auction boolean DEFAULT false;
  END IF;
END $$;

-- Add auction_id field to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'auction_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN auction_id uuid;
  END IF;
END $$;

-- Create auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  auction_type text NOT NULL CHECK (auction_type IN ('english', 'dutch')),
  start_price numeric NOT NULL CHECK (start_price > 0),
  reserve_price numeric CHECK (reserve_price >= start_price),
  current_price numeric NOT NULL CHECK (current_price >= start_price),
  buy_now_price numeric CHECK (buy_now_price IS NULL OR buy_now_price >= start_price * 1.5),
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz NOT NULL CHECK (end_time > start_time),
  original_end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  winner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  total_bids integer DEFAULT 0 CHECK (total_bids >= 0),
  view_count integer DEFAULT 0 CHECK (view_count >= 0),
  extension_count integer DEFAULT 0 CHECK (extension_count >= 0 AND extension_count <= 3),
  dutch_decrement_hours integer DEFAULT 24 CHECK (dutch_decrement_hours > 0),
  dutch_decrement_percent numeric DEFAULT 10 CHECK (dutch_decrement_percent > 0 AND dutch_decrement_percent <= 50),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create auction_bids table
CREATE TABLE IF NOT EXISTS auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  bid_type text NOT NULL DEFAULT 'manual' CHECK (bid_type IN ('manual', 'auto')),
  auto_bid_max numeric CHECK (auto_bid_max IS NULL OR auto_bid_max >= amount),
  is_winning boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create auction_watchers table
CREATE TABLE IF NOT EXISTS auction_watchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notify_outbid boolean DEFAULT true,
  notify_ending_soon boolean DEFAULT true,
  notify_won boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(auction_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_watchers ENABLE ROW LEVEL SECURITY;

-- Policies for auctions table
CREATE POLICY "Anyone can view active auctions"
  ON auctions FOR SELECT
  USING (status = 'active' OR status = 'ended');

CREATE POLICY "Sellers can create auctions"
  ON auctions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own auctions"
  ON auctions FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own auctions"
  ON auctions FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id AND total_bids = 0);

-- Policies for auction_bids table
CREATE POLICY "Users can view bids on auctions they participate in"
  ON auction_bids FOR SELECT
  TO authenticated
  USING (
    bidder_id = auth.uid() OR
    auction_id IN (SELECT id FROM auctions WHERE seller_id = auth.uid())
  );

CREATE POLICY "Authenticated users can place bids"
  ON auction_bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bidder_id);

-- Policies for auction_watchers table
CREATE POLICY "Users can view their own watchers"
  ON auction_watchers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add auctions to watch"
  ON auction_watchers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchers"
  ON auction_watchers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchers"
  ON auction_watchers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS auctions_product_id_idx ON auctions(product_id);
CREATE INDEX IF NOT EXISTS auctions_seller_id_idx ON auctions(seller_id);
CREATE INDEX IF NOT EXISTS auctions_status_idx ON auctions(status);
CREATE INDEX IF NOT EXISTS auctions_end_time_idx ON auctions(end_time);
CREATE INDEX IF NOT EXISTS auctions_status_end_time_idx ON auctions(status, end_time);
CREATE INDEX IF NOT EXISTS auctions_winner_id_idx ON auctions(winner_id);

CREATE INDEX IF NOT EXISTS auction_bids_auction_id_idx ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS auction_bids_bidder_id_idx ON auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS auction_bids_is_winning_idx ON auction_bids(is_winning);
CREATE INDEX IF NOT EXISTS auction_bids_created_at_idx ON auction_bids(created_at);

CREATE INDEX IF NOT EXISTS auction_watchers_auction_id_idx ON auction_watchers(auction_id);
CREATE INDEX IF NOT EXISTS auction_watchers_user_id_idx ON auction_watchers(user_id);

CREATE INDEX IF NOT EXISTS orders_auction_id_idx ON orders(auction_id);

-- Trigger for auctions updated_at
CREATE TRIGGER auctions_updated_at
  BEFORE UPDATE ON auctions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to validate bid amount
CREATE OR REPLACE FUNCTION validate_auction_bid(
  p_auction_id uuid,
  p_bidder_id uuid,
  p_bid_amount numeric
)
RETURNS boolean AS $$
DECLARE
  v_auction auctions%ROWTYPE;
  v_min_increment numeric;
  v_required_bid numeric;
BEGIN
  -- Get auction details
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id;

  -- Check if auction exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  -- Check if auction is active
  IF v_auction.status != 'active' THEN
    RAISE EXCEPTION 'Auction is not active';
  END IF;

  -- Check if auction has ended
  IF v_auction.end_time <= now() THEN
    RAISE EXCEPTION 'Auction has ended';
  END IF;

  -- Check if bidder is not the seller
  IF p_bidder_id = v_auction.seller_id THEN
    RAISE EXCEPTION 'Sellers cannot bid on their own auctions';
  END IF;

  -- Calculate minimum bid increment (5%)
  v_min_increment := v_auction.current_price * 0.05;
  v_required_bid := v_auction.current_price + v_min_increment;

  -- Check if bid meets minimum increment
  IF p_bid_amount < v_required_bid THEN
    RAISE EXCEPTION 'Bid must be at least % (current price + 5%%)', v_required_bid;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update auction current price when new bid placed
CREATE OR REPLACE FUNCTION update_auction_on_new_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_time_remaining interval;
  v_extension_minutes integer := 5;
BEGIN
  -- Mark all previous bids as not winning
  UPDATE auction_bids
  SET is_winning = false
  WHERE auction_id = NEW.auction_id AND id != NEW.id;

  -- Mark this bid as winning
  NEW.is_winning := true;

  -- Update auction current price and bid count
  UPDATE auctions
  SET
    current_price = NEW.amount,
    total_bids = total_bids + 1,
    updated_at = now()
  WHERE id = NEW.auction_id;

  -- Check for anti-sniping extension (if bid in last 5 minutes)
  SELECT end_time - now() INTO v_time_remaining
  FROM auctions
  WHERE id = NEW.auction_id;

  IF v_time_remaining <= interval '5 minutes' THEN
    -- Extend auction by 5 minutes (max 3 extensions)
    UPDATE auctions
    SET
      end_time = end_time + (v_extension_minutes || ' minutes')::interval,
      extension_count = extension_count + 1,
      updated_at = now()
    WHERE id = NEW.auction_id
      AND extension_count < 3;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating auction on new bid
CREATE TRIGGER update_auction_on_bid
  BEFORE INSERT ON auction_bids
  FOR EACH ROW
  EXECUTE FUNCTION update_auction_on_new_bid();

-- Function to calculate Dutch auction current price
CREATE OR REPLACE FUNCTION calculate_dutch_price(p_auction_id uuid)
RETURNS numeric AS $$
DECLARE
  v_auction auctions%ROWTYPE;
  v_time_elapsed interval;
  v_periods_elapsed numeric;
  v_total_reduction numeric;
  v_current_price numeric;
BEGIN
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  IF v_auction.auction_type != 'dutch' THEN
    RETURN v_auction.current_price;
  END IF;

  -- Calculate time elapsed since start
  v_time_elapsed := now() - v_auction.start_time;

  -- Calculate number of decrement periods elapsed
  v_periods_elapsed := FLOOR(EXTRACT(EPOCH FROM v_time_elapsed) / (v_auction.dutch_decrement_hours * 3600));

  -- Calculate total price reduction
  v_total_reduction := v_auction.start_price * (v_auction.dutch_decrement_percent / 100) * v_periods_elapsed;

  -- Calculate current price (never below reserve price or 10% of start price)
  v_current_price := GREATEST(
    v_auction.start_price - v_total_reduction,
    COALESCE(v_auction.reserve_price, v_auction.start_price * 0.1),
    v_auction.start_price * 0.1
  );

  RETURN v_current_price;
END;
$$ LANGUAGE plpgsql;

-- Function to close expired auctions and select winner
CREATE OR REPLACE FUNCTION close_expired_auctions()
RETURNS void AS $$
DECLARE
  v_auction RECORD;
  v_winning_bid RECORD;
BEGIN
  -- Find all active auctions that have ended
  FOR v_auction IN
    SELECT * FROM auctions
    WHERE status = 'active' AND end_time <= now()
  LOOP
    -- Get the winning bid (highest bid)
    SELECT * INTO v_winning_bid
    FROM auction_bids
    WHERE auction_id = v_auction.id AND is_winning = true
    ORDER BY amount DESC, created_at ASC
    LIMIT 1;

    -- Check if reserve price was met
    IF v_winning_bid.amount >= COALESCE(v_auction.reserve_price, 0) THEN
      -- Update auction with winner
      UPDATE auctions
      SET
        status = 'ended',
        winner_id = v_winning_bid.bidder_id,
        updated_at = now()
      WHERE id = v_auction.id;

      -- Mark product as sold
      UPDATE products
      SET
        status = 'sold',
        in_stock = false,
        updated_at = now()
      WHERE id = v_auction.product_id;
    ELSE
      -- Auction ended without meeting reserve price
      UPDATE auctions
      SET
        status = 'ended',
        winner_id = NULL,
        updated_at = now()
      WHERE id = v_auction.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment auction view count
CREATE OR REPLACE FUNCTION increment_auction_views(p_auction_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE auctions
  SET view_count = view_count + 1
  WHERE id = p_auction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
