/*
  # Create Demo Accounts for GHETTO FINANCE

  1. Purpose
    - Create pre-configured demo accounts for testing and demonstration
    - Includes: sitemaster (admin), demo (buyer), seller (merchant)
    - Passwords: master123, demo123, seller123

  2. Accounts Created
    - **sitemaster**: Full administrative access
      - Email: master@ghetto.finance
      - Username: sitemaster
    
    - **demo**: Standard buyer account
      - Email: demo@ghetto.finance
      - Username: demo
    
    - **seller**: Merchant account
      - Email: seller@ghetto.finance
      - Username: seller

  3. Implementation
    - Creates users in auth.users with proper password hashing
    - Profiles auto-created via handle_new_user() trigger
    - Updates profiles with appropriate settings
*/

-- Function to safely create demo user accounts
CREATE OR REPLACE FUNCTION create_demo_user(
  user_email TEXT,
  user_password TEXT,
  user_username TEXT,
  user_display_name TEXT
) RETURNS uuid AS $$
DECLARE
  user_id uuid;
  encrypted_pw TEXT;
BEGIN
  -- Generate UUID for user
  user_id := gen_random_uuid();
  
  -- Hash the password using pgcrypto
  encrypted_pw := crypt(user_password, gen_salt('bf'));
  
  -- Insert into auth.users (confirmed_at is generated, so exclude it)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    is_sso_user,
    is_anonymous
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    encrypted_pw,
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('username', user_username, 'display_name', user_display_name),
    now(),
    now(),
    'authenticated',
    'authenticated',
    false,
    false
  );
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sitemaster account
DO $$
DECLARE
  master_id uuid;
BEGIN
  -- Check if account already exists
  SELECT id INTO master_id FROM auth.users WHERE email = 'master@ghetto.finance';
  
  IF master_id IS NULL THEN
    -- Create the user
    master_id := create_demo_user(
      'master@ghetto.finance',
      'master123',
      'sitemaster',
      'Site Master'
    );
    
    -- The handle_new_user() trigger should create the profile automatically
    -- Give it a moment to process
    PERFORM pg_sleep(0.1);
    
    -- Update profile with admin settings
    UPDATE profiles 
    SET 
      display_name = 'Site Master',
      bio = 'GHETTO FINANCE Platform Administrator',
      verified = true,
      is_seller = true
    WHERE id = master_id;
    
    RAISE NOTICE 'Created sitemaster account with ID: %', master_id;
  ELSE
    RAISE NOTICE 'Sitemaster account already exists with ID: %', master_id;
  END IF;
END $$;

-- Create demo account
DO $$
DECLARE
  demo_id uuid;
BEGIN
  SELECT id INTO demo_id FROM auth.users WHERE email = 'demo@ghetto.finance';
  
  IF demo_id IS NULL THEN
    demo_id := create_demo_user(
      'demo@ghetto.finance',
      'demo123',
      'demo',
      'Demo User'
    );
    
    PERFORM pg_sleep(0.1);
    
    UPDATE profiles 
    SET 
      display_name = 'Demo User',
      bio = 'Demo account for testing purchases',
      verified = false,
      is_seller = false
    WHERE id = demo_id;
    
    RAISE NOTICE 'Created demo account with ID: %', demo_id;
  ELSE
    RAISE NOTICE 'Demo account already exists with ID: %', demo_id;
  END IF;
END $$;

-- Create seller account
DO $$
DECLARE
  seller_id uuid;
BEGIN
  SELECT id INTO seller_id FROM auth.users WHERE email = 'seller@ghetto.finance';
  
  IF seller_id IS NULL THEN
    seller_id := create_demo_user(
      'seller@ghetto.finance',
      'seller123',
      'seller',
      'Demo Seller'
    );
    
    PERFORM pg_sleep(0.1);
    
    UPDATE profiles 
    SET 
      display_name = 'Demo Seller',
      bio = 'Demo seller account for testing marketplace features',
      verified = true,
      is_seller = true,
      store_enabled = true,
      store_name = 'Demo Store',
      store_description = 'A demo store showcasing GHETTO FINANCE marketplace capabilities',
      store_theme = 'cyberpunk'
    WHERE id = seller_id;
    
    RAISE NOTICE 'Created seller account with ID: %', seller_id;
  ELSE
    RAISE NOTICE 'Seller account already exists with ID: %', seller_id;
  END IF;
END $$;

-- Verify final account status
DO $$
DECLARE
  account_count INTEGER;
  auth_count INTEGER;
  profile_list TEXT;
BEGIN
  -- Count profiles
  SELECT COUNT(*) INTO account_count 
  FROM profiles 
  WHERE username IN ('sitemaster', 'demo', 'seller');
  
  -- Count auth users
  SELECT COUNT(*) INTO auth_count
  FROM auth.users
  WHERE email IN ('master@ghetto.finance', 'demo@ghetto.finance', 'seller@ghetto.finance');
  
  -- Get profile list
  SELECT string_agg(username || ' (' || email || ')', ', ')
  INTO profile_list
  FROM profiles
  WHERE username IN ('sitemaster', 'demo', 'seller');
  
  RAISE NOTICE '================================';
  RAISE NOTICE 'Demo Account Creation Summary:';
  RAISE NOTICE 'Auth Users Created: %', auth_count;
  RAISE NOTICE 'Profiles Created: %', account_count;
  IF profile_list IS NOT NULL THEN
    RAISE NOTICE 'Accounts: %', profile_list;
  END IF;
  RAISE NOTICE '================================';
  RAISE NOTICE 'Login credentials:';
  RAISE NOTICE '  - master@ghetto.finance / master123 (or @sitemaster / master123)';
  RAISE NOTICE '  - demo@ghetto.finance / demo123 (or @demo / demo123)';
  RAISE NOTICE '  - seller@ghetto.finance / seller123 (or @seller / seller123)';
  RAISE NOTICE '================================';
END $$;
