/*
  # Add tracking number to orders table

  1. Changes
    - Add `tracking_number` column to `orders` table
    - Add `tracking_url` column for carrier tracking links
    - Add `carrier` column for shipping carrier name
    - Add `estimated_delivery` column for estimated delivery date

  2. Security
    - No RLS changes needed as existing policies cover new columns

  3. Indexes
    - Add index on tracking_number for faster lookups
*/

-- Add tracking columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_number text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'carrier'
  ) THEN
    ALTER TABLE orders ADD COLUMN carrier text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'estimated_delivery'
  ) THEN
    ALTER TABLE orders ADD COLUMN estimated_delivery timestamptz;
  END IF;
END $$;

-- Create index for tracking number lookups
CREATE INDEX IF NOT EXISTS orders_tracking_number_idx ON orders(tracking_number);

-- Create function to generate tracking URL based on carrier
CREATE OR REPLACE FUNCTION generate_tracking_url(carrier_name text, tracking_num text)
RETURNS text AS $$
BEGIN
  CASE LOWER(carrier_name)
    WHEN 'ups' THEN
      RETURN 'https://www.ups.com/track?tracknum=' || tracking_num;
    WHEN 'fedex' THEN
      RETURN 'https://www.fedex.com/fedextrack/?trknbr=' || tracking_num;
    WHEN 'usps' THEN
      RETURN 'https://tools.usps.com/go/TrackConfirmAction?tLabels=' || tracking_num;
    WHEN 'dhl' THEN
      RETURN 'https://www.dhl.com/en/express/tracking.html?AWB=' || tracking_num;
    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;