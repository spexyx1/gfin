/*
  # Fix Function Search Paths for Security

  ## Changes

  Sets explicit search_path for all functions to prevent search_path hijacking.
  All functions will use 'pg_catalog, public' search path which is immutable.

  ## Security Issue

  Functions with mutable search_path can be exploited by attackers who create
  malicious objects in other schemas. Setting an explicit search_path prevents
  this attack vector.

  ## Functions Fixed

  All database functions receive an explicit, secure search_path configuration.
*/

-- Set secure search path for all functions
DO $$
DECLARE
    func record;
BEGIN
    FOR func IN
        SELECT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'update_auction_watcher_count',
            'is_site_admin',
            'get_active_contract_address',
            'activate_contract_deployment',
            'get_active_contracts_for_network',
            'update_contract_deployments_updated_at',
            'log_auction_event',
            'process_auction_bid',
            'authenticate_user_by_username',
            'handle_new_user',
            'update_release_deadline',
            'calculate_release_deadline',
            'unlock_expired_collateral',
            'check_auto_release_eligibility',
            'mark_auto_release_eligible',
            'complete_auto_release',
            'withdraw_seller_collateral',
            'calculate_seller_limits',
            'deposit_seller_collateral',
            'update_stake_status',
            'get_seller_sponsored_limit',
            'get_investor_total_staked',
            'get_investor_available_stake',
            'log_audit_event',
            'create_user_activity',
            'calculate_sponsor_share',
            'update_request_funding',
            'user_has_role',
            'is_site_master',
            'add_email_to_account',
            'get_user_email_status',
            'check_username_available',
            'expire_old_trade_offers',
            'can_create_trade_offer',
            'expire_old_invites',
            'get_setting',
            'mark_conversation_read',
            'find_or_create_conversation',
            'update_group_trading_stats',
            'update_group_volume',
            'generate_unique_referral_code',
            'create_referral_code_for_user',
            'register_referred_user',
            'update_group_member_count',
            'update_group_post_count',
            'add_group_creator_as_owner',
            'is_group_member',
            'get_user_groups',
            'generate_tracking_url',
            'validate_order_status_transition',
            'handle_updated_at',
            'increment_product_views',
            'toggle_product_favorite',
            'calculate_seller_hold_amount',
            'set_seller_hold_amount',
            'update_conversation_timestamp',
            'get_unread_count',
            'award_first_purchase_ghetto',
            'award_transaction_commission'
        )
    LOOP
        BEGIN
            EXECUTE format(
                'ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, public',
                func.schema_name,
                func.function_name,
                func.args
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- Log the error but continue with other functions
                RAISE NOTICE 'Could not alter function %.%(%): %',
                    func.schema_name, func.function_name, func.args, SQLERRM;
        END;
    END LOOP;
END $$;
