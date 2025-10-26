/*
  # Create trade offers and fund transfers tables

  1. New Tables
    - `trade_offers`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references trading_groups.id)
      - `created_by` (uuid, references profiles.id)
      - `title` (text, offer title)
      - `description` (text, offer description)
      - `offer_type` (text, type: buy/sell/trade/service)
      - `items` (jsonb, array of offered items)
      - `requested_items` (jsonb, array of requested items)
      - `price_min` (numeric, minimum price)
      - `price_max` (numeric, maximum price)
      - `price_currency` (text, currency)
      - `location` (text, location)
      - `expires_at` (timestamptz, expiration date)
      - `status` (text, status: active/completed/cancelled/expired)
      - `interested_users` (jsonb, array of interested user IDs)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)

    - `fund_transfers`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references trading_groups.id)
      - `from_user_id` (uuid, references profiles.id)
      - `to_user_id` (uuid, references profiles.id)
      - `amount` (numeric, transfer amount)
      - `currency` (text, currency type)
      - `reason` (text, transfer reason)
      - `status` (text, status: pending/completed/cancelled/failed)
      - `tx_hash` (text, transaction hash)
      - `created_at` (timestamptz, creation timestamp)
      - `completed_at` (timestamptz, completion timestamp)

    - `group_invites`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references trading_groups.id)
      - `invited_by` (uuid, references profiles.id)
      - `invited_user` (uuid, references profiles.id)
      - `message` (text, invitation message)
      - `status` (text, status: pending/accepted/declined/expired)
      - `created_at` (timestamptz, creation timestamp)
      - `expires_at` (timestamptz, expiration timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for group members to view and manage offers/transfers
    - Add policies for users to manage their own invites
    - Add policies for transfer participants

  3. Functions
    - Create function to check group membership for permissions
    - Create function to validate transfer permissions
    - Create function to handle offer expiration

  4. Indexes
    - Create indexes for better query performance
*/

-- Create trade_offers table
CREATE TABLE IF NOT EXISTS trade_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES trading_groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  offer_type text NOT NULL CHECK (offer_type IN ('buy', 'sell', 'trade', 'service')),
  items jsonb DEFAULT '[]'::jsonb,
  requested_items jsonb DEFAULT '[]'::jsonb,
  price_min numeric,
  price_max numeric,
  price_currency text DEFAULT 'USDC',
  location text,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  interested_users jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure price range is valid
  CONSTRAINT valid_price_range CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)
);

-- Create fund_transfers table
CREATE TABLE IF NOT EXISTS fund_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES trading_groups(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USDC',
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  tx_hash text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  
  -- Ensure users can't transfer to themselves
  CONSTRAINT different_users CHECK (from_user_id != to_user_id)
);

-- Create group_invites table
CREATE TABLE IF NOT EXISTS group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES trading_groups(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_user uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  
  -- Ensure unique pending invites per user per group
  UNIQUE(group_id, invited_user, status) DEFERRABLE INITIALLY DEFERRED
);

-- Enable Row Level Security
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- Trade Offers Policies
CREATE POLICY "Group members can view trade offers"
  ON trade_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = trade_offers.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create trade offers"
  ON trade_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = trade_offers.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Offer creators can update their offers"
  ON trade_offers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Offer creators can delete their offers"
  ON trade_offers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Fund Transfers Policies
CREATE POLICY "Transfer participants can view transfers"
  ON fund_transfers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = from_user_id OR 
    auth.uid() = to_user_id OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = fund_transfers.group_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
    )
  );

CREATE POLICY "Group members can create fund transfers"
  ON fund_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id AND
    EXISTS (
      SELECT 1 FROM group_members gm1
      WHERE gm1.group_id = fund_transfers.group_id AND gm1.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = fund_transfers.group_id AND gm2.user_id = fund_transfers.to_user_id
    ) AND
    EXISTS (
      SELECT 1 FROM trading_groups tg
      WHERE tg.id = fund_transfers.group_id AND tg.allow_fund_transfers = true
    )
  );

CREATE POLICY "Transfer participants can update transfers"
  ON fund_transfers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Group Invites Policies
CREATE POLICY "Users can view their own invites"
  ON group_invites
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = invited_user OR 
    auth.uid() = invited_by OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_invites.group_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
    )
  );

CREATE POLICY "Group members can create invites"
  ON group_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_invites.group_id AND user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM trading_groups tg
      WHERE tg.id = group_invites.group_id AND tg.allow_invites = true
    )
  );

CREATE POLICY "Invited users can update their invites"
  ON group_invites
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = invited_user)
  WITH CHECK (auth.uid() = invited_user);

-- Create triggers for updated_at
CREATE TRIGGER trade_offers_updated_at
  BEFORE UPDATE ON trade_offers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to check if user can create trade offers in group
CREATE OR REPLACE FUNCTION can_create_trade_offer(group_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members gm
    JOIN trading_groups tg ON gm.group_id = tg.id
    WHERE gm.group_id = can_create_trade_offer.group_id 
    AND gm.user_id = can_create_trade_offer.user_id
    AND tg.allow_trades = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to expire old trade offers
CREATE OR REPLACE FUNCTION expire_old_trade_offers()
RETURNS void AS $$
BEGIN
  UPDATE trade_offers 
  SET status = 'expired'
  WHERE status = 'active' 
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to expire old invites
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE group_invites 
  SET status = 'expired'
  WHERE status = 'pending' 
  AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update group trading stats
CREATE OR REPLACE FUNCTION update_group_trading_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    UPDATE trading_groups 
    SET total_trades = total_trades + 1
    WHERE id = NEW.group_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trading stats updates
CREATE TRIGGER update_group_trading_stats_trigger
  AFTER UPDATE ON trade_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_group_trading_stats();

-- Create function to update group volume on fund transfers
CREATE OR REPLACE FUNCTION update_group_volume()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    UPDATE trading_groups 
    SET total_volume = total_volume + NEW.amount
    WHERE id = NEW.group_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for volume updates
CREATE TRIGGER update_group_volume_trigger
  AFTER UPDATE ON fund_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_group_volume();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS trade_offers_group_id_idx ON trade_offers(group_id);
CREATE INDEX IF NOT EXISTS trade_offers_created_by_idx ON trade_offers(created_by);
CREATE INDEX IF NOT EXISTS trade_offers_status_idx ON trade_offers(status);
CREATE INDEX IF NOT EXISTS trade_offers_expires_at_idx ON trade_offers(expires_at);
CREATE INDEX IF NOT EXISTS trade_offers_offer_type_idx ON trade_offers(offer_type);

CREATE INDEX IF NOT EXISTS fund_transfers_group_id_idx ON fund_transfers(group_id);
CREATE INDEX IF NOT EXISTS fund_transfers_from_user_id_idx ON fund_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS fund_transfers_to_user_id_idx ON fund_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS fund_transfers_status_idx ON fund_transfers(status);
CREATE INDEX IF NOT EXISTS fund_transfers_created_at_idx ON fund_transfers(created_at);

CREATE INDEX IF NOT EXISTS group_invites_group_id_idx ON group_invites(group_id);
CREATE INDEX IF NOT EXISTS group_invites_invited_by_idx ON group_invites(invited_by);
CREATE INDEX IF NOT EXISTS group_invites_invited_user_idx ON group_invites(invited_user);
CREATE INDEX IF NOT EXISTS group_invites_status_idx ON group_invites(status);
CREATE INDEX IF NOT EXISTS group_invites_expires_at_idx ON group_invites(expires_at);

-- Create full-text search index for trade offers
CREATE INDEX IF NOT EXISTS trade_offers_search_idx ON trade_offers USING gin(to_tsvector('english', title || ' ' || description));