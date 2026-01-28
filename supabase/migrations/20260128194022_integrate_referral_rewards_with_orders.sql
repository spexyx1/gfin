/*
  # Integrate Referral Rewards with Order Completion

  1. Automation
    - Create trigger to automatically award referral rewards when orders are completed
    - Awards first purchase reward when a referred user completes their first order
    - Awards commission on all purchases by referred users
    
  2. Function
    - `process_order_referral_rewards(p_order_id UUID)`: Processes referral rewards for completed orders
    
  3. Trigger
    - Automatically calls reward functions when order status changes to 'completed' or 'funds_released'
*/

-- Function to process referral rewards when an order is completed
CREATE OR REPLACE FUNCTION process_order_referral_rewards()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- Only process when order is marked as completed or funds_released
  IF NEW.status IN ('completed', 'funds_released') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'funds_released')) THEN
    
    v_order_id := NEW.id;
    
    -- Award first purchase reward (function checks if this is first purchase)
    BEGIN
      PERFORM award_first_purchase_ghetto(v_order_id);
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the order update
      RAISE WARNING 'Failed to award first purchase reward for order %: %', v_order_id, SQLERRM;
    END;
    
    -- Award transaction commission (function checks if buyer is referred)
    BEGIN
      PERFORM award_transaction_commission(v_order_id);
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the order update
      RAISE WARNING 'Failed to award transaction commission for order %: %', v_order_id, SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_process_referral_rewards ON orders;
CREATE TRIGGER trigger_process_referral_rewards
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION process_order_referral_rewards();
