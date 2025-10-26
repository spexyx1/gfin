/*
  # Add payment token and currency columns to orders table

  1. Changes
    - Add `payment_token` column to `orders` table for storing the ERC20 token address used for payment
    - Add `currency` column to `orders` table for storing the currency symbol (GHETTO, USDC, ETH, etc.)
    - Set default values for existing orders

  2. Security
    - No RLS changes needed as existing policies cover new columns

  3. Indexes
    - Add index on currency for filtering orders by payment type
    - Add index on payment_token for contract address lookups
*/

-- Add payment_token column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_token'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_token text DEFAULT '0xB0b86a33E6417c4c4c4c4c4c4c4c4c4c4c4c4c4c';
  END IF;
END $$;

-- Add currency column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'currency'
  ) THEN
    ALTER TABLE orders ADD COLUMN currency text DEFAULT 'GHETTO';
  END IF;
END $$;

-- Update existing orders to have default values
UPDATE orders 
SET payment_token = '0xB0b86a33E6417c4c4c4c4c4c4c4c4c4c4c4c4c4c',
    currency = 'GHETTO'
WHERE payment_token IS NULL OR currency IS NULL;

-- Make columns NOT NULL after setting defaults
ALTER TABLE orders ALTER COLUMN payment_token SET NOT NULL;
ALTER TABLE orders ALTER COLUMN currency SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS orders_currency_idx ON orders(currency);
CREATE INDEX IF NOT EXISTS orders_payment_token_idx ON orders(payment_token);

-- Add constraint to ensure valid currency values
ALTER TABLE orders ADD CONSTRAINT valid_currency 
CHECK (currency IN ('GHETTO', 'USDC', 'ETH', 'BTC', 'SOL', 'MATIC'));

-- Add constraint to ensure payment_token is a valid Ethereum address format
ALTER TABLE orders ADD CONSTRAINT valid_payment_token 
CHECK (payment_token ~ '^0x[a-fA-F0-9]{40}$');