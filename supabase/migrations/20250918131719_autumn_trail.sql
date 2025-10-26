/*
  # Create profiles table for user management

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique, for @handles)
      - `email` (text, unique)
      - `display_name` (text, user's display name)
      - `bio` (text, user biography)
      - `avatar` (text, avatar image URL)
      - `cover_image` (text, cover image URL)
      - `location` (text, user location)
      - `website` (text, user website)
      - `phone` (text, phone number)
      - `is_seller` (boolean, seller status)
      - `verified` (boolean, verification status)
      - `stealth_mode` (boolean, privacy setting)
      - `wallet_address` (text, connected wallet)
      - `total_sales` (numeric, sales count)
      - `total_purchases` (numeric, purchase count)
      - `rating` (numeric, user rating)
      - `review_count` (integer, number of reviews)
      - `completed_trades` (integer, completed transactions)
      - `groups_joined` (integer, social groups count)
      - `followers` (jsonb, array of follower IDs)
      - `following` (jsonb, array of following IDs)
      - `social_links` (jsonb, social media links)
      - `store_enabled` (boolean, store page enabled)
      - `store_name` (text, store name)
      - `store_description` (text, store description)
      - `store_theme` (text, store theme)
      - `featured_products` (jsonb, featured product IDs)
      - `store_categories` (jsonb, store categories)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policy for users to read public profiles
    - Add policy for users to update their own profile
    - Add policy for authenticated users to insert their profile

  3. Functions
    - Create trigger to automatically create profile on user signup
    - Create function to update updated_at timestamp
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  bio text DEFAULT '',
  avatar text,
  cover_image text,
  location text,
  website text,
  phone text,
  is_seller boolean DEFAULT false,
  verified boolean DEFAULT false,
  stealth_mode boolean DEFAULT false,
  wallet_address text,
  total_sales numeric DEFAULT 0,
  total_purchases numeric DEFAULT 0,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  completed_trades integer DEFAULT 0,
  groups_joined integer DEFAULT 0,
  followers jsonb DEFAULT '[]'::jsonb,
  following jsonb DEFAULT '[]'::jsonb,
  social_links jsonb DEFAULT '[]'::jsonb,
  store_enabled boolean DEFAULT false,
  store_name text DEFAULT '',
  store_description text DEFAULT '',
  store_theme text DEFAULT 'cyberpunk',
  featured_products jsonb DEFAULT '[]'::jsonb,
  store_categories jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (NOT stealth_mode OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_is_seller_idx ON profiles(is_seller);
CREATE INDEX IF NOT EXISTS profiles_verified_idx ON profiles(verified);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);