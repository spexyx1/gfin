/*
  # Accept Terms of Service for Demo Accounts

  1. Purpose
    - Pre-accept current terms of service for all demo accounts
    - Allows demo accounts to be used immediately without terms prompt
    - Creates acceptance records for audit trail

  2. Updates
    - Updates profiles with terms_accepted flag
    - Sets current_terms_version to match active terms
    - Records terms_accepted_at timestamp
    - Creates acceptance records in terms_acceptances table

  3. Affected Accounts
    - sitemaster (master@ghetto.finance)
    - demo (demo@ghetto.finance)
    - seller (seller@ghetto.finance)
*/

-- Get the current terms version
DO $$
DECLARE
  current_version TEXT;
  demo_user_id uuid;
  seller_user_id uuid;
  master_user_id uuid;
BEGIN
  -- Get current terms version
  SELECT version INTO current_version
  FROM terms_of_service
  WHERE is_current = true
  LIMIT 1;

  -- Get user IDs
  SELECT id INTO demo_user_id FROM profiles WHERE username = 'demo';
  SELECT id INTO seller_user_id FROM profiles WHERE username = 'seller';
  SELECT id INTO master_user_id FROM profiles WHERE username = 'sitemaster';

  IF current_version IS NOT NULL THEN
    -- Update profiles with accepted terms
    UPDATE profiles
    SET 
      terms_accepted = true,
      current_terms_version = current_version,
      terms_accepted_at = now()
    WHERE username IN ('sitemaster', 'demo', 'seller');

    -- Create acceptance records for demo account
    IF demo_user_id IS NOT NULL THEN
      INSERT INTO terms_acceptances (
        id,
        user_id,
        terms_version,
        ip_address,
        user_agent,
        accepted_at,
        acceptance_method
      ) VALUES (
        gen_random_uuid(),
        demo_user_id,
        current_version,
        '127.0.0.1',
        'Demo Account - Auto-accepted',
        now(),
        'auto'
      ) ON CONFLICT DO NOTHING;
    END IF;

    -- Create acceptance records for seller account
    IF seller_user_id IS NOT NULL THEN
      INSERT INTO terms_acceptances (
        id,
        user_id,
        terms_version,
        ip_address,
        user_agent,
        accepted_at,
        acceptance_method
      ) VALUES (
        gen_random_uuid(),
        seller_user_id,
        current_version,
        '127.0.0.1',
        'Demo Account - Auto-accepted',
        now(),
        'auto'
      ) ON CONFLICT DO NOTHING;
    END IF;

    -- Create acceptance records for sitemaster account
    IF master_user_id IS NOT NULL THEN
      INSERT INTO terms_acceptances (
        id,
        user_id,
        terms_version,
        ip_address,
        user_agent,
        accepted_at,
        acceptance_method
      ) VALUES (
        gen_random_uuid(),
        master_user_id,
        current_version,
        '127.0.0.1',
        'Site Master - Auto-accepted',
        now(),
        'auto'
      ) ON CONFLICT DO NOTHING;
    END IF;

    RAISE NOTICE 'Successfully accepted terms (version %) for all demo accounts', current_version;
  ELSE
    RAISE NOTICE 'No current terms of service found - skipping acceptance';
  END IF;
END $$;

-- Verify terms acceptance
SELECT 
  username,
  email,
  terms_accepted,
  current_terms_version,
  terms_accepted_at
FROM profiles
WHERE username IN ('sitemaster', 'demo', 'seller')
ORDER BY username;
