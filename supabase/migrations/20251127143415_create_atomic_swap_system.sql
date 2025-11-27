/*
  # Create Atomic Swap System

  1. New Tables
    - `supported_swap_tokens`: Sitemaster-approved tokens and chains
      - `id` (uuid, primary key)
      - `chain_id` (integer) - blockchain network ID
      - `chain_name` (text) - e.g., "Polygon", "Ethereum"
      - `token_address` (text) - contract address
      - `token_symbol` (text) - e.g., "USDC", "WETH"
      - `token_name` (text)
      - `token_decimals` (integer)
      - `is_gasless_enabled` (boolean) - whether platform covers gas
      - `is_active` (boolean)
      - `icon_url` (text)
      - `added_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)

    - `atomic_swaps`: Peer-to-peer token swap records
      - `id` (uuid, primary key)
      - `initiator_id` (uuid, foreign key to profiles)
      - `recipient_id` (uuid, foreign key to profiles)
      - `initiator_token_id` (uuid, foreign key to supported_swap_tokens)
      - `recipient_token_id` (uuid, foreign key to supported_swap_tokens)
      - `initiator_amount` (numeric)
      - `recipient_amount` (numeric)
      - `initiator_chain_id` (integer)
      - `recipient_chain_id` (integer)
      - `status` (text) - pending, accepted, completed, cancelled, expired
      - `is_gasless` (boolean)
      - `gas_covered_by_platform` (boolean)
      - `swap_hash` (text) - blockchain transaction hash
      - `initiator_signed` (boolean)
      - `recipient_signed` (boolean)
      - `expires_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

    - `swap_gas_subsidies`: Track platform-covered gas costs
      - `id` (uuid, primary key)
      - `swap_id` (uuid, foreign key to atomic_swaps)
      - `chain_id` (integer)
      - `gas_amount` (numeric)
      - `gas_token` (text)
      - `usd_value` (numeric)
      - `transaction_hash` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Sitemaster can manage supported tokens
    - Users can create and view their own swaps
    - Public can view active supported tokens

  3. Indexes
    - Foreign key indexes for performance
    - Status and chain_id indexes for filtering
*/

-- Create supported_swap_tokens table
CREATE TABLE IF NOT EXISTS public.supported_swap_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id integer NOT NULL,
  chain_name text NOT NULL,
  token_address text NOT NULL,
  token_symbol text NOT NULL,
  token_name text NOT NULL,
  token_decimals integer NOT NULL DEFAULT 18,
  is_gasless_enabled boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  icon_url text,
  added_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(chain_id, token_address)
);

-- Create atomic_swaps table
CREATE TABLE IF NOT EXISTS public.atomic_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id uuid NOT NULL REFERENCES public.profiles(id),
  recipient_id uuid REFERENCES public.profiles(id),
  initiator_token_id uuid NOT NULL REFERENCES public.supported_swap_tokens(id),
  recipient_token_id uuid NOT NULL REFERENCES public.supported_swap_tokens(id),
  initiator_amount numeric NOT NULL CHECK (initiator_amount > 0),
  recipient_amount numeric NOT NULL CHECK (recipient_amount > 0),
  initiator_chain_id integer NOT NULL,
  recipient_chain_id integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled', 'expired')),
  is_gasless boolean NOT NULL DEFAULT false,
  gas_covered_by_platform boolean NOT NULL DEFAULT false,
  swap_hash text,
  initiator_signed boolean NOT NULL DEFAULT false,
  recipient_signed boolean NOT NULL DEFAULT false,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create swap_gas_subsidies table
CREATE TABLE IF NOT EXISTS public.swap_gas_subsidies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id uuid NOT NULL REFERENCES public.atomic_swaps(id) ON DELETE CASCADE,
  chain_id integer NOT NULL,
  gas_amount numeric NOT NULL,
  gas_token text NOT NULL,
  usd_value numeric,
  transaction_hash text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supported_tokens_chain ON public.supported_swap_tokens(chain_id);
CREATE INDEX IF NOT EXISTS idx_supported_tokens_active ON public.supported_swap_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_supported_tokens_gasless ON public.supported_swap_tokens(is_gasless_enabled) WHERE is_gasless_enabled = true;

CREATE INDEX IF NOT EXISTS idx_atomic_swaps_initiator ON public.atomic_swaps(initiator_id);
CREATE INDEX IF NOT EXISTS idx_atomic_swaps_recipient ON public.atomic_swaps(recipient_id);
CREATE INDEX IF NOT EXISTS idx_atomic_swaps_status ON public.atomic_swaps(status);
CREATE INDEX IF NOT EXISTS idx_atomic_swaps_created ON public.atomic_swaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atomic_swaps_expires ON public.atomic_swaps(expires_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_gas_subsidies_swap ON public.swap_gas_subsidies(swap_id);
CREATE INDEX IF NOT EXISTS idx_gas_subsidies_chain ON public.swap_gas_subsidies(chain_id);

-- Enable RLS
ALTER TABLE public.supported_swap_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atomic_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_gas_subsidies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supported_swap_tokens
CREATE POLICY "Public can view active tokens"
  ON public.supported_swap_tokens FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Sitemaster can manage tokens"
  ON public.supported_swap_tokens FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_id = (select auth.uid())
      AND role_type = 'sitemaster'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_id = (select auth.uid())
      AND role_type = 'sitemaster'
    )
  );

-- RLS Policies for atomic_swaps
CREATE POLICY "Users can create swaps"
  ON public.atomic_swaps FOR INSERT
  TO authenticated
  WITH CHECK (initiator_id = (select auth.uid()));

CREATE POLICY "Users can view their swaps"
  ON public.atomic_swaps FOR SELECT
  TO authenticated
  USING (
    initiator_id = (select auth.uid()) OR 
    recipient_id = (select auth.uid())
  );

CREATE POLICY "Users can update their swaps"
  ON public.atomic_swaps FOR UPDATE
  TO authenticated
  USING (
    initiator_id = (select auth.uid()) OR 
    recipient_id = (select auth.uid())
  )
  WITH CHECK (
    initiator_id = (select auth.uid()) OR 
    recipient_id = (select auth.uid())
  );

CREATE POLICY "Sitemaster can view all swaps"
  ON public.atomic_swaps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_id = (select auth.uid())
      AND role_type = 'sitemaster'
    )
  );

-- RLS Policies for swap_gas_subsidies
CREATE POLICY "Users can view gas subsidies for their swaps"
  ON public.swap_gas_subsidies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.atomic_swaps
      WHERE atomic_swaps.id = swap_gas_subsidies.swap_id
      AND (atomic_swaps.initiator_id = (select auth.uid()) OR atomic_swaps.recipient_id = (select auth.uid()))
    )
  );

CREATE POLICY "Sitemaster can manage gas subsidies"
  ON public.swap_gas_subsidies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_id = (select auth.uid())
      AND role_type = 'sitemaster'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_id = (select auth.uid())
      AND role_type = 'sitemaster'
    )
  );

-- Function to expire old pending swaps
CREATE OR REPLACE FUNCTION public.expire_old_swaps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.atomic_swaps
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$;