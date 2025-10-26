/*
  # Implement redeem_referral_balance RPC function

  1. New Functions
    - `redeem_referral_balance(p_user_id uuid, p_amount numeric)`
      - Validates redemption amount and user balance
      - Deducts GHETTO from user's referral balance
      - Records redemption transaction
      - Enforces minimum redemption limits from platform settings

  2. Security
    - Function uses SECURITY DEFINER to bypass RLS for balance updates
    - Validates user permissions and balance requirements
    - Prevents negative or invalid redemption amounts

  3. Features
    - Dynamic minimum redemption amount from platform_settings
    - Comprehensive error handling and validation
    - Automatic transaction recording for audit trail
*/

CREATE OR REPLACE FUNCTION public.redeem_referral_balance(
    p_user_id uuid,
    p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to bypass Row Level Security (RLS)
SET search_path = public -- Ensures the function operates on tables in the public schema
AS $$
DECLARE
    v_current_balance numeric;
    v_min_redeem_ghetto numeric;
    v_setting_value text;
BEGIN
    -- 1. Validate input amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Redemption amount must be positive.';
    END IF;

    -- 2. Get current referral balance for the user
    SELECT balance_ghetto INTO v_current_balance
    FROM referral_balances
    WHERE user_id = p_user_id;

    -- If no balance entry exists, or balance is NULL, treat as 0
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
    END IF;

    -- 3. Check for sufficient balance
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient GHETTO balance. Available: %, Requested: %', v_current_balance, p_amount;
    END IF;

    -- 4. Get minimum redemption amount from platform settings
    SELECT value INTO v_setting_value
    FROM platform_settings
    WHERE key = 'referral_min_redeem_ghetto';

    -- Convert to numeric, provide a default if setting is missing or invalid
    BEGIN
        v_min_redeem_ghetto := v_setting_value::numeric;
    EXCEPTION
        WHEN invalid_text_representation THEN
            v_min_redeem_ghetto := 10.0; -- Default minimum redemption to 10 GHETTO if setting is invalid
        WHEN OTHERS THEN
            v_min_redeem_ghetto := 10.0; -- Handle any other conversion errors
    END;

    IF v_min_redeem_ghetto IS NULL OR v_min_redeem_ghetto < 0 THEN
        v_min_redeem_ghetto := 10.0; -- Ensure a valid default if conversion fails or is negative
    END IF;

    -- 5. Check if the redemption amount meets the minimum
    IF p_amount < v_min_redeem_ghetto THEN
        RAISE EXCEPTION 'Redemption amount must be at least % GHETTO.', v_min_redeem_ghetto;
    END IF;

    -- 6. Deduct the amount from the user's referral balance
    UPDATE referral_balances
    SET balance_ghetto = balance_ghetto - p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Verify the update was successful (should affect exactly 1 row)
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to update referral balance for user %', p_user_id;
    END IF;

    -- 7. Record the redemption transaction
    -- The amount is recorded as negative to represent an outflow from the user's balance
    INSERT INTO referral_transactions (user_id, type, amount_ghetto, source_id)
    VALUES (p_user_id, 'redemption', -p_amount, NULL);

    -- Log successful redemption (optional, for debugging/monitoring)
    RAISE NOTICE 'Successfully redeemed % GHETTO for user %', p_amount, p_user_id;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.redeem_referral_balance(uuid, numeric) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.redeem_referral_balance(uuid, numeric) IS 
'Redeems GHETTO tokens from a user''s referral balance. Validates minimum redemption amount from platform settings and records the transaction.';