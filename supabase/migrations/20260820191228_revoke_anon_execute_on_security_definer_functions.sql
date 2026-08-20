-- Revoke EXECUTE from anon role on all SECURITY DEFINER functions in public schema
-- These functions were callable by unauthenticated users, creating a security risk.
-- Only functions needed for the login/signup flow remain callable by anon.

-- First, revoke EXECUTE from anon on ALL SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.activate_contract_deployment(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.add_email_to_account(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.audit_admin_role_changes() FROM anon;
REVOKE EXECUTE ON FUNCTION public.authenticate_user_by_username(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.auto_create_referral_code() FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_first_purchase_ghetto(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_transaction_commission(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_partnership_revenue() FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_seller_limits(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_create_trade_offer(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_auto_release_eligibility() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, interval) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_username_available(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_auto_release(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_referral_code_for_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_user_activity(uuid, text, text, text, uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_card_balance(uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.deposit_seller_collateral(uuid, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_old_invites() FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_old_swaps() FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_old_trade_offers() FROM anon;
REVOKE EXECUTE ON FUNCTION public.find_or_create_conversation(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_api_key(boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_unique_referral_code() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_active_contract_address(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_active_contracts_for_network(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_auth_email_for_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_current_user_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_password_reset_info(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_setting(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_unread_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_email_status(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_groups(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.hash_api_key(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_card_balance(uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_product_views(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.init_transaction_reputation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.initialize_moderator_reputation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_current_user_sitemaster() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_site_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_site_master(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lift_expired_suspensions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, uuid, jsonb, jsonb, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_auto_release_eligible(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_conversation_read(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_order_referral_rewards() FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_referral_signup(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_transaction_outcome() FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_referral_balance(uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_referred_user(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_rate_limit(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_product_favorite(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.unlock_expired_collateral() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_moderator_reputation() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_project_funds_on_nft_sale() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.withdraw_seller_collateral(uuid, uuid) FROM anon;

-- Re-grant EXECUTE to anon ONLY on functions needed for the pre-login flow
-- These are required before a user has a session token
GRANT EXECUTE ON FUNCTION public.authenticate_user_by_username(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, interval) TO anon;
GRANT EXECUTE ON FUNCTION public.get_password_reset_info(text) TO anon;

-- Grant EXECUTE to authenticated on user-facing functions that logged-in users need
GRANT EXECUTE ON FUNCTION public.find_or_create_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_product_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_product_favorite(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_sitemaster() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_email_for_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral_signup(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, interval) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_rate_limit(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_groups(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_trade_offer(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_seller_limits(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deposit_seller_collateral(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_seller_collateral(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_email_to_account(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_referral_code_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_referral_balance(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_activity(uuid, text, text, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_contract_address(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_contracts_for_network(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_setting(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_site_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_site_master(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_auto_release_eligible(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_auto_release(uuid, text) TO authenticated;
