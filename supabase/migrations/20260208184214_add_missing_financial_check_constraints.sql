/*
  # Add Missing CHECK Constraints on Financial Columns

  1. Security & Data Integrity
    - Add CHECK constraints to prevent negative amounts on financial columns
    - Ensure all monetary values are valid and positive where appropriate
    - Protect against data corruption and invalid transactions

  2. Changes
    - Add constraints to auctions, blockchain_transactions, dispute_cases
    - Add constraints to escrow_deal_tracking, ghetto_token_operations
    - Add constraints to housing NFTs, offramper transactions
    - Add constraints to partnership revenues, referral transactions
    - Add constraints to swap subsidies, token operations
*/

-- Auctions: Ensure positive final prices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'auctions_final_price_check'
    AND table_name = 'auctions'
  ) THEN
    ALTER TABLE auctions
    ADD CONSTRAINT auctions_final_price_check
    CHECK (final_price_usdc IS NULL OR final_price_usdc >= 0);
  END IF;
END $$;

-- Blockchain Transactions: Ensure positive gas prices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'blockchain_transactions_gas_price_check'
    AND table_name = 'blockchain_transactions'
  ) THEN
    ALTER TABLE blockchain_transactions
    ADD CONSTRAINT blockchain_transactions_gas_price_check
    CHECK (gas_price_gwei IS NULL OR gas_price_gwei >= 0);
  END IF;
END $$;

-- Dispute Cases: Ensure positive escrow amounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'dispute_cases_escrow_amount_check'
    AND table_name = 'dispute_cases'
  ) THEN
    ALTER TABLE dispute_cases
    ADD CONSTRAINT dispute_cases_escrow_amount_check
    CHECK (escrow_amount >= 0);
  END IF;
END $$;

-- Escrow Deal Tracking: Ensure positive amounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'escrow_deal_tracking_amount_check'
    AND table_name = 'escrow_deal_tracking'
  ) THEN
    ALTER TABLE escrow_deal_tracking
    ADD CONSTRAINT escrow_deal_tracking_amount_check
    CHECK (amount > 0 AND seller_hold_amount >= 0);
  END IF;
END $$;

-- GHETTO Token Operations: Ensure positive amounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ghetto_token_operations_amount_check'
    AND table_name = 'ghetto_token_operations'
  ) THEN
    ALTER TABLE ghetto_token_operations
    ADD CONSTRAINT ghetto_token_operations_amount_check
    CHECK (amount > 0);
  END IF;
END $$;

-- Housing NFTs: Ensure positive purchase prices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'housing_nfts_purchase_price_check'
    AND table_name = 'housing_nfts'
  ) THEN
    ALTER TABLE housing_nfts
    ADD CONSTRAINT housing_nfts_purchase_price_check
    CHECK (purchase_price IS NULL OR purchase_price > 0);
  END IF;
END $$;

-- Housing Projects: Ensure positive NFT prices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'housing_projects_nft_price_check'
    AND table_name = 'housing_projects'
  ) THEN
    ALTER TABLE housing_projects
    ADD CONSTRAINT housing_projects_nft_price_check
    CHECK (nft_price > 0);
  END IF;
END $$;

-- Offramper Accounts: Ensure positive collateral
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'offramper_accounts_collateral_check'
    AND table_name = 'offramper_accounts'
  ) THEN
    ALTER TABLE offramper_accounts
    ADD CONSTRAINT offramper_accounts_collateral_check
    CHECK (collateral_amount >= 0);
  END IF;
END $$;

-- Offramper Transactions: Ensure all amounts are positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'offramper_transactions_amounts_check'
    AND table_name = 'offramper_transactions'
  ) THEN
    ALTER TABLE offramper_transactions
    ADD CONSTRAINT offramper_transactions_amounts_check
    CHECK (
      crypto_amount > 0 
      AND fiat_amount > 0 
      AND fee_amount >= 0
    );
  END IF;
END $$;

-- Partnership Revenues: Ensure positive revenue amounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'partnership_revenues_amounts_check'
    AND table_name = 'partnership_revenues'
  ) THEN
    ALTER TABLE partnership_revenues
    ADD CONSTRAINT partnership_revenues_amounts_check
    CHECK (
      revenue_amount >= 0
      AND sponsor_amount >= 0
      AND tenant_amount >= 0
    );
  END IF;
END $$;

-- Swap Gas Subsidies: Ensure positive gas amounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'swap_gas_subsidies_gas_amount_check'
    AND table_name = 'swap_gas_subsidies'
  ) THEN
    ALTER TABLE swap_gas_subsidies
    ADD CONSTRAINT swap_gas_subsidies_gas_amount_check
    CHECK (gas_amount > 0);
  END IF;
END $$;

-- Token Allowances: Ensure non-negative amounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'token_allowances_amount_check'
    AND table_name = 'token_allowances'
  ) THEN
    ALTER TABLE token_allowances
    ADD CONSTRAINT token_allowances_amount_check
    CHECK (amount >= 0);
  END IF;
END $$;

-- Token Transfers: Ensure positive amounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'token_transfers_amount_check'
    AND table_name = 'token_transfers'
  ) THEN
    ALTER TABLE token_transfers
    ADD CONSTRAINT token_transfers_amount_check
    CHECK (amount > 0);
  END IF;
END $$;