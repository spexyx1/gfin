/*
  # Fix Referral System Integration

  1. Updates
    - Fix `get_setting()` function to use correct column names (setting_key, setting_value)
    - Add missing referral platform settings
    - Create trigger to auto-generate referral codes for new users
    
  2. Platform Settings Added
    - referral_signup_reward_ghetto: 5 GHETTO for signup
    - referral_first_purchase_reward_ghetto: 10 GHETTO for first purchase
    - referral_commission_rate_percent: 2% ongoing commission
    - referral_min_redeem_ghetto: 10 GHETTO minimum redemption
    
  3. Automation
    - Automatic referral code creation on profile creation
*/

-- Fix the get_setting function to use correct column names
CREATE OR REPLACE FUNCTION get_setting(p_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_val TEXT;
BEGIN
  SELECT setting_value::text INTO setting_val 
  FROM platform_settings 
  WHERE setting_key = p_key;
  RETURN setting_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert referral platform settings
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description, category, editable)
VALUES 
  ('referral_signup_reward_ghetto', '5', 'number', 'GHETTO reward for successful referral signup', 'referral', true),
  ('referral_first_purchase_reward_ghetto', '10', 'number', 'GHETTO reward when referred user makes first purchase', 'referral', true),
  ('referral_commission_rate_percent', '2', 'number', 'Percentage commission on referred user purchases', 'referral', true),
  ('referral_min_redeem_ghetto', '10', 'number', 'Minimum GHETTO required to redeem referral balance', 'referral', true)
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = EXCLUDED.setting_value,
    updated_at = now();

-- Create function to auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION auto_create_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Create referral code for new user
  PERFORM create_referral_code_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-generate referral codes
DROP TRIGGER IF EXISTS trigger_auto_create_referral_code ON profiles;
CREATE TRIGGER trigger_auto_create_referral_code
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_referral_code();

-- Create function to handle referral on signup (will be called from application)
CREATE OR REPLACE FUNCTION process_referral_signup(p_user_id UUID, p_referral_code TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  IF p_referral_code IS NOT NULL AND p_referral_code != '' THEN
    -- Register the user as referred
    PERFORM register_referred_user(p_referral_code, p_user_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
