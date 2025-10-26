/*
  # Add functions for the referral system logic

  1. Functions
    - `get_setting(p_key TEXT)`: Retrieves a setting value.
    - `generate_unique_referral_code()`: Generates a unique code.
    - `create_referral_code_for_user(p_user_id UUID)`: Creates a referral code.
    - `register_referred_user(p_referrer_code TEXT, p_referred_user_id UUID)`: Handles new referred user.
    - `award_first_purchase_ghetto(p_order_id UUID)`: Awards for first purchase.
    - `award_transaction_commission(p_order_id UUID)`: Awards commission.
    - `redeem_referral_balance(p_user_id UUID, p_amount NUMERIC)`: Handles balance redemption.
*/

-- Helper function to get platform settings
CREATE OR REPLACE FUNCTION get_setting(p_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value FROM platform_settings WHERE key = p_key;
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-character alphanumeric code
    new_code := lower(substring(md5(random()::text) for 6));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a referral code for a user
CREATE OR REPLACE FUNCTION create_referral_code_for_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  generated_code TEXT;
BEGIN
  SELECT generate_unique_referral_code() INTO generated_code;
  INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, generated_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register a referred user and award signup bonus
CREATE OR REPLACE FUNCTION register_referred_user(p_referrer_code TEXT, p_referred_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_referrer_id UUID;
  v_signup_reward NUMERIC;
BEGIN
  -- Get referrer_id from code
  SELECT user_id INTO v_referrer_id FROM referral_codes WHERE code = p_referrer_code;

  IF v_referrer_id IS NOT NULL THEN
    -- Insert into referred_users
    INSERT INTO referred_users (referrer_id, referred_user_id)
    VALUES (v_referrer_id, p_referred_user_id);

    -- Get signup reward amount
    SELECT get_setting('referral_signup_reward_ghetto')::NUMERIC INTO v_signup_reward;

    -- Update referrer's balance
    INSERT INTO referral_balances (user_id, balance_ghetto, updated_at)
    VALUES (v_referrer_id, v_signup_reward, now())
    ON CONFLICT (user_id) DO UPDATE
    SET balance_ghetto = referral_balances.balance_ghetto + EXCLUDED.balance_ghetto,
        updated_at = now();

    -- Log transaction
    INSERT INTO referral_transactions (user_id, type, amount_ghetto, source_id)
    VALUES (v_referrer_id, 'signup_reward', v_signup_reward, p_referred_user_id);

    -- Mark reward as claimed
    UPDATE referred_users SET account_reward_claimed = true WHERE referred_user_id = p_referred_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award GHETTO for the first purchase of a referred user
CREATE OR REPLACE FUNCTION award_first_purchase_ghetto(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_buyer_id UUID;
  v_referred_user_record referred_users%ROWTYPE;
  v_first_purchase_reward NUMERIC;
BEGIN
  -- Get buyer_id from order
  SELECT buyer_id INTO v_buyer_id FROM orders WHERE id = p_order_id;

  -- Check if buyer is a referred user and if first purchase reward is not claimed
  SELECT * INTO v_referred_user_record
  FROM referred_users
  WHERE referred_user_id = v_buyer_id AND first_purchase_reward_claimed = false;

  IF v_referred_user_record.id IS NOT NULL THEN
    -- Get first purchase reward amount
    SELECT get_setting('referral_first_purchase_reward_ghetto')::NUMERIC INTO v_first_purchase_reward;

    -- Update referrer's balance
    UPDATE referral_balances
    SET balance_ghetto = balance_ghetto + v_first_purchase_reward,
        updated_at = now()
    WHERE user_id = v_referred_user_record.referrer_id;

    -- Log transaction
    INSERT INTO referral_transactions (user_id, type, amount_ghetto, source_id)
    VALUES (v_referred_user_record.referrer_id, 'first_purchase_reward', v_first_purchase_reward, p_order_id);

    -- Mark reward as claimed
    UPDATE referred_users SET first_purchase_reward_claimed = true WHERE id = v_referred_user_record.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award commission for every transaction of a referred user
CREATE OR REPLACE FUNCTION award_transaction_commission(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_buyer_id UUID;
  v_order_amount NUMERIC;
  v_referred_user_record referred_users%ROWTYPE;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
BEGIN
  -- Get buyer_id and amount from order
  SELECT buyer_id, amount INTO v_buyer_id, v_order_amount FROM orders WHERE id = p_order_id;

  -- Check if buyer is a referred user
  SELECT * INTO v_referred_user_record
  FROM referred_users
  WHERE referred_user_id = v_buyer_id;

  IF v_referred_user_record.id IS NOT NULL THEN
    -- Get commission rate
    SELECT get_setting('referral_commission_rate_percent')::NUMERIC INTO v_commission_rate;

    -- Calculate commission amount (rate is in percent, e.g., 0.15 for 0.15%)
    v_commission_amount := (v_order_amount * v_commission_rate) / 100;

    -- Update referrer's balance
    UPDATE referral_balances
    SET balance_ghetto = balance_ghetto + v_commission_amount,
        updated_at = now()
    WHERE user_id = v_referred_user_record.referrer_id;

    -- Log transaction
    INSERT INTO referral_transactions (user_id, type, amount_ghetto, source_id)
    VALUES (v_referred_user_record.referrer_id, 'commission', v_commission_amount, p_order_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle referral balance redemption
CREATE OR REPLACE FUNCTION redeem_referral_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_min_redeem NUMERIC;
  v_current_balance NUMERIC;
BEGIN
  -- Get minimum redemption amount
  SELECT get_setting('referral_min_redeem_ghetto')::NUMERIC INTO v_min_redeem;

  -- Validate redemption amount
  IF p_amount < v_min_redeem THEN
    RAISE EXCEPTION 'Redemption amount must be at least % GHETTO', v_min_redeem;
  END IF;

  -- Get current balance
  SELECT balance_ghetto INTO v_current_balance FROM referral_balances WHERE user_id = p_user_id;

  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient GHETTO balance for redemption. Current: %, Requested: %', COALESCE(v_current_balance, 0), p_amount;
  END IF;

  -- Deduct from balance
  UPDATE referral_balances
  SET balance_ghetto = balance_ghetto - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO referral_transactions (user_id, type, amount_ghetto, source_id)
  VALUES (p_user_id, 'redemption', -p_amount, NULL); -- Source_id can be NULL for redemption
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;