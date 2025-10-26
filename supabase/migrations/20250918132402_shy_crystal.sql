/*
  # Create products table for seller product management

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `title` (text, product title)
      - `description` (text, product description)
      - `price_usdc` (numeric, price in USDC)
      - `category` (text, product category)
      - `tags` (jsonb, array of tags)
      - `in_stock` (boolean, availability status)
      - `seller_id` (uuid, references profiles.id)
      - `status` (text, product status: draft/active/paused/sold)
      - `images` (jsonb, array of image objects)
      - `view_count` (integer, number of views)
      - `favorite_count` (integer, number of favorites)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)

  2. Security
    - Enable RLS on `products` table
    - Add policy for public read access to active products
    - Add policy for sellers to manage their own products
    - Add policy for authenticated users to view all products

  3. Indexes
    - Create indexes for better query performance
    - Index on seller_id, status, category, and created_at
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price_usdc numeric NOT NULL CHECK (price_usdc > 0),
  category text NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  in_stock boolean DEFAULT true,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'sold')),
  images jsonb DEFAULT '[]'::jsonb,
  view_count integer DEFAULT 0,
  favorite_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active products"
  ON products
  FOR SELECT
  USING (status = 'active' AND in_stock = true);

CREATE POLICY "Authenticated users can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sellers can insert their own products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Create trigger for updated_at
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS products_seller_id_idx ON products(seller_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products(created_at);
CREATE INDEX IF NOT EXISTS products_price_usdc_idx ON products(price_usdc);
CREATE INDEX IF NOT EXISTS products_in_stock_idx ON products(in_stock);

-- Create index for full-text search on title and description
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING gin(to_tsvector('english', title || ' ' || description));

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_product_views(product_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE products 
  SET view_count = view_count + 1 
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to toggle favorite
CREATE OR REPLACE FUNCTION toggle_product_favorite(product_id uuid, increment boolean)
RETURNS void AS $$
BEGIN
  IF increment THEN
    UPDATE products 
    SET favorite_count = favorite_count + 1 
    WHERE id = product_id;
  ELSE
    UPDATE products 
    SET favorite_count = GREATEST(0, favorite_count - 1) 
    WHERE id = product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;