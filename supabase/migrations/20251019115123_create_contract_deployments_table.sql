/*
  # Contract Deployments Management System

  1. New Tables
    - `contract_deployments`
      - `id` (uuid, primary key) - Unique identifier for each deployment
      - `contract_name` (text) - Name of the contract (e.g., 'GhettoToken', 'EscrowContract')
      - `contract_address` (text) - Deployed contract address on blockchain
      - `network` (text) - Network name (polygon, polygonMumbai, hardhat)
      - `chain_id` (integer) - Chain ID (137 for Polygon, 80001 for Mumbai)
      - `deployer_address` (text) - Address that deployed the contract
      - `transaction_hash` (text) - Deployment transaction hash
      - `block_number` (bigint) - Block number of deployment
      - `abi` (jsonb) - Contract ABI for frontend interaction
      - `constructor_args` (jsonb) - Constructor arguments used in deployment
      - `verified` (boolean) - Whether contract is verified on block explorer
      - `is_active` (boolean) - Whether this is the currently active deployment
      - `deployed_at` (timestamptz) - When the contract was deployed
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp
      - `metadata` (jsonb) - Additional deployment metadata

    - `site_admins`
      - `id` (uuid, primary key) - References profiles.id
      - `role` (text) - Admin role (site_master, moderator, support)
      - `permissions` (jsonb) - Specific permissions
      - `created_at` (timestamptz) - When admin role was granted
      - `granted_by` (uuid) - Who granted the admin role

  2. Security
    - Enable RLS on both tables
    - Add policy for public read access to active deployments
    - Add policy for site admins to manage deployments
    - Add policy for site admins to view all deployments

  3. Indexes
    - Index on contract_name and network for fast lookups
    - Index on is_active for querying current deployments
    - Index on chain_id for network filtering

  4. Functions
    - Function to get active contract address by name and network
    - Function to activate a deployment (sets others to inactive)
    - Function to check if user is site admin
*/

-- Create site admins table first
CREATE TABLE IF NOT EXISTS site_admins (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'moderator',
  permissions jsonb DEFAULT '{"contracts": true, "users": false, "disputes": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  granted_by uuid REFERENCES profiles(id),
  
  CONSTRAINT valid_role CHECK (role IN ('site_master', 'moderator', 'support'))
);

-- Enable RLS on site_admins
ALTER TABLE site_admins ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all admins
CREATE POLICY "Admins can view site admins"
  ON site_admins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM site_admins
      WHERE site_admins.id = auth.uid()
    )
  );

-- Function to check if user is site admin
CREATE OR REPLACE FUNCTION is_site_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM site_admins
    WHERE id = user_id
  );
END;
$$;

-- Create contract deployments table
CREATE TABLE IF NOT EXISTS contract_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name text NOT NULL,
  contract_address text NOT NULL,
  network text NOT NULL,
  chain_id integer NOT NULL,
  deployer_address text NOT NULL,
  transaction_hash text,
  block_number bigint,
  abi jsonb,
  constructor_args jsonb DEFAULT '[]'::jsonb,
  verified boolean DEFAULT false,
  is_active boolean DEFAULT false,
  deployed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Ensure contract address is lowercase for consistency
  CONSTRAINT lowercase_address CHECK (contract_address = lower(contract_address)),
  
  -- Ensure only one active deployment per contract per network
  CONSTRAINT unique_active_contract UNIQUE (contract_name, network, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_name_network ON contract_deployments(contract_name, network);
CREATE INDEX IF NOT EXISTS idx_is_active ON contract_deployments(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_chain_id ON contract_deployments(chain_id);
CREATE INDEX IF NOT EXISTS idx_deployed_at ON contract_deployments(deployed_at DESC);

-- Enable Row Level Security
ALTER TABLE contract_deployments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active contract deployments
CREATE POLICY "Anyone can view active deployments"
  ON contract_deployments
  FOR SELECT
  USING (is_active = true);

-- Policy: Site admins can view all deployments
CREATE POLICY "Site admins can view all deployments"
  ON contract_deployments
  FOR SELECT
  TO authenticated
  USING (is_site_admin(auth.uid()));

-- Policy: Site admins can create new deployments
CREATE POLICY "Site admins can create deployments"
  ON contract_deployments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_site_admin(auth.uid()));

-- Policy: Site admins can update deployments
CREATE POLICY "Site admins can update deployments"
  ON contract_deployments
  FOR UPDATE
  TO authenticated
  USING (is_site_admin(auth.uid()))
  WITH CHECK (is_site_admin(auth.uid()));

-- Policy: Site admins can delete deployments
CREATE POLICY "Site admins can delete deployments"
  ON contract_deployments
  FOR DELETE
  TO authenticated
  USING (is_site_admin(auth.uid()));

-- Function to get active contract address
CREATE OR REPLACE FUNCTION get_active_contract_address(
  p_contract_name text,
  p_network text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_address text;
BEGIN
  SELECT contract_address
  INTO v_address
  FROM contract_deployments
  WHERE contract_name = p_contract_name
    AND network = p_network
    AND is_active = true
  LIMIT 1;
  
  RETURN v_address;
END;
$$;

-- Function to activate a deployment (deactivates others)
CREATE OR REPLACE FUNCTION activate_contract_deployment(
  p_deployment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contract_name text;
  v_network text;
BEGIN
  -- Get contract info
  SELECT contract_name, network
  INTO v_contract_name, v_network
  FROM contract_deployments
  WHERE id = p_deployment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deployment not found';
  END IF;
  
  -- Deactivate all other deployments for this contract and network
  UPDATE contract_deployments
  SET is_active = false,
      updated_at = now()
  WHERE contract_name = v_contract_name
    AND network = v_network
    AND is_active = true;
  
  -- Activate the specified deployment
  UPDATE contract_deployments
  SET is_active = true,
      updated_at = now()
  WHERE id = p_deployment_id;
END;
$$;

-- Function to get all active contracts for a network
CREATE OR REPLACE FUNCTION get_active_contracts_for_network(
  p_network text
)
RETURNS TABLE (
  contract_name text,
  contract_address text,
  chain_id integer,
  deployed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.contract_name,
    cd.contract_address,
    cd.chain_id,
    cd.deployed_at
  FROM contract_deployments cd
  WHERE cd.network = p_network
    AND cd.is_active = true
  ORDER BY cd.contract_name;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contract_deployments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_deployments_updated_at
  BEFORE UPDATE ON contract_deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_deployments_updated_at();
