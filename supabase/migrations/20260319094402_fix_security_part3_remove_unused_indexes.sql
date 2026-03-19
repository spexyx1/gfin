/*
  # Security Fix Part 3: Remove Unused Indexes

  1. Changes
    - Drop unused indexes to reduce maintenance overhead
    - These indexes are not being used by any queries
    - Reduces database bloat and speeds up write operations

  2. Tables Affected
    - Removes approximately 100+ unused indexes across various tables
*/

-- Drop unused indexes on atomic_swaps
DROP INDEX IF EXISTS idx_atomic_swaps_initiator_id;
DROP INDEX IF EXISTS idx_atomic_swaps_recipient_id;
DROP INDEX IF EXISTS idx_atomic_swaps_initiator_token;
DROP INDEX IF EXISTS idx_atomic_swaps_recipient_token;

-- Drop unused indexes on auction tables
DROP INDEX IF EXISTS idx_auction_disputes_auction_id;
DROP INDEX IF EXISTS idx_auction_history_auction_id;
DROP INDEX IF EXISTS idx_auctions_status_end;
DROP INDEX IF EXISTS idx_auctions_product_id;
DROP INDEX IF EXISTS idx_auctions_created_at;

-- Drop unused indexes on case tables
DROP INDEX IF EXISTS idx_case_comments_case_id;
DROP INDEX IF EXISTS idx_case_evidence_case_id;
DROP INDEX IF EXISTS idx_case_appeals_case_id;

-- Drop unused indexes on escrow and orders
DROP INDEX IF EXISTS idx_escrow_deal_tracking_order_id;
DROP INDEX IF EXISTS idx_fund_release_requests_order_id;
DROP INDEX IF EXISTS idx_orders_product_id;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_status_active;

-- Drop unused indexes on trading groups
DROP INDEX IF EXISTS idx_fund_transfers_group_id;
DROP INDEX IF EXISTS idx_group_posts_group_id;
DROP INDEX IF EXISTS idx_trade_offers_group_id;

-- Drop unused indexes on housing tables
DROP INDEX IF EXISTS idx_housing_nfts_owner_id;
DROP INDEX IF EXISTS idx_housing_nfts_project_id;
DROP INDEX IF EXISTS idx_housing_projects_created_by;
DROP INDEX IF EXISTS idx_project_updates_project_id;
DROP INDEX IF EXISTS idx_project_updates_posted_by;
DROP INDEX IF EXISTS idx_tenant_partnerships_project_id;
DROP INDEX IF EXISTS idx_tenant_partnerships_tenant_id;
DROP INDEX IF EXISTS idx_tenant_partnerships_sponsor_id;

-- Drop unused indexes on moderation tables
DROP INDEX IF EXISTS idx_moderation_actions_report_id;

-- Drop unused indexes on offramper tables
DROP INDEX IF EXISTS idx_offramper_accounts_application_id;
DROP INDEX IF EXISTS idx_offramper_accounts_suspended_by;
DROP INDEX IF EXISTS idx_offramper_applications_user_id;
DROP INDEX IF EXISTS idx_offramper_applications_reviewed_by;
DROP INDEX IF EXISTS idx_offramper_invites_invited_by;
DROP INDEX IF EXISTS idx_offramper_kyc_documents_application_id;
DROP INDEX IF EXISTS idx_offramper_kyc_documents_verified_by;
DROP INDEX IF EXISTS idx_offramper_transactions_offramper_id;
DROP INDEX IF EXISTS idx_offramper_transactions_client_id;
DROP INDEX IF EXISTS idx_offramper_client_notes_client_id;
DROP INDEX IF EXISTS idx_offramper_client_notes_offramper_id;

-- Drop unused indexes on partnership and sponsorship
DROP INDEX IF EXISTS idx_partnership_revenues_partnership_id;
DROP INDEX IF EXISTS idx_sponsorship_investments_request_id;
DROP INDEX IF EXISTS idx_sponsorship_revenues_sponsorship_id;
DROP INDEX IF EXISTS idx_sponsorship_transactions_order_id;
DROP INDEX IF EXISTS idx_sponsorship_transactions_investment_id;
DROP INDEX IF EXISTS idx_sponsorship_transactions_request_id;
DROP INDEX IF EXISTS idx_seller_sponsorships_stake_id;
DROP INDEX IF EXISTS idx_sponsored_products_request_id;

-- Drop unused indexes on posts and comments
DROP INDEX IF EXISTS idx_post_comments_post_id;
DROP INDEX IF EXISTS idx_post_comments_parent_id;
DROP INDEX IF EXISTS idx_posts_author_id;
DROP INDEX IF EXISTS idx_posts_created_at;
DROP INDEX IF EXISTS idx_posts_visibility;

-- Drop unused indexes on suspension and overrides
DROP INDEX IF EXISTS idx_suspension_overrides_user_id;
DROP INDEX IF EXISTS idx_suspension_overrides_overridden_by;

-- Drop unused indexes on token holders
DROP INDEX IF EXISTS idx_token_holders_user_id;
DROP INDEX IF EXISTS idx_swap_gas_subsidies_swap_id;

-- Drop unused indexes on transaction reputation
DROP INDEX IF EXISTS idx_transaction_reputation_history_user_id;
DROP INDEX IF EXISTS idx_transaction_reputation_history_moderator_id;

-- Drop unused indexes on products
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_created_at;
DROP INDEX IF EXISTS idx_products_condition;

-- Drop unused indexes on profiles
DROP INDEX IF EXISTS idx_profiles_rating;
DROP INDEX IF EXISTS idx_profiles_is_seller;
DROP INDEX IF EXISTS idx_profiles_created_at;
DROP INDEX IF EXISTS idx_profiles_preferred_language;

-- Drop unused indexes on messages
DROP INDEX IF EXISTS idx_messages_sender_created;
DROP INDEX IF EXISTS idx_messages_conversation_created;
DROP INDEX IF EXISTS idx_messages_conversation_unread;
DROP INDEX IF EXISTS idx_messages_order_id;

-- Drop unused indexes on follows
DROP INDEX IF EXISTS idx_follows_follower_id;
DROP INDEX IF EXISTS idx_follows_following_id;

-- Drop unused indexes on blockchain tables
DROP INDEX IF EXISTS idx_blockchain_transactions_initiated_by;

-- Drop unused indexes on bookmarks
DROP INDEX IF EXISTS idx_bookmarks_user_id;
DROP INDEX IF EXISTS idx_bookmarks_post_id;

-- Drop unused indexes on feature toggles and settings
DROP INDEX IF EXISTS idx_feature_toggles_last_toggled_by;
DROP INDEX IF EXISTS idx_platform_settings_last_updated_by;
DROP INDEX IF EXISTS idx_rate_configurations_last_updated_by;

-- Drop unused indexes on terms_acceptances
DROP INDEX IF EXISTS idx_terms_acceptances_user_id;

-- Drop unused indexes on supported swap tokens
DROP INDEX IF EXISTS idx_supported_swap_tokens_added_by;

-- Drop unused indexes on user admin roles
DROP INDEX IF EXISTS idx_user_admin_roles_assigned_by;

-- Drop unused indexes on merchant tables
DROP INDEX IF EXISTS idx_merchant_accounts_user_id;
DROP INDEX IF EXISTS idx_merchant_accounts_is_active;
DROP INDEX IF EXISTS idx_merchant_api_keys_merchant_id;
DROP INDEX IF EXISTS idx_merchant_api_keys_status;
DROP INDEX IF EXISTS idx_merchant_api_keys_key_hash;
DROP INDEX IF EXISTS idx_merchant_api_usage_api_key_id;
DROP INDEX IF EXISTS idx_merchant_api_usage_window;
DROP INDEX IF EXISTS idx_merchant_orders_merchant_id;
DROP INDEX IF EXISTS idx_merchant_orders_order_id;
DROP INDEX IF EXISTS idx_merchant_webhooks_merchant_id;
DROP INDEX IF EXISTS idx_merchant_transactions_merchant_id;
DROP INDEX IF EXISTS idx_merchant_transactions_order_id;
DROP INDEX IF EXISTS idx_api_request_logs_merchant_id;
DROP INDEX IF EXISTS idx_api_request_logs_created_at;
DROP INDEX IF EXISTS idx_webhook_deliveries_webhook_id;
DROP INDEX IF EXISTS idx_webhook_deliveries_status;

-- Drop unused indexes on card and kyc tables
DROP INDEX IF EXISTS idx_kyc_verifications_user_id;
DROP INDEX IF EXISTS idx_kyc_verifications_status;
DROP INDEX IF EXISTS idx_issued_cards_user_id;
DROP INDEX IF EXISTS idx_issued_cards_status;
DROP INDEX IF EXISTS idx_card_accounts_user_id;
DROP INDEX IF EXISTS idx_card_accounts_card_id;
DROP INDEX IF EXISTS idx_card_transactions_card_id;
DROP INDEX IF EXISTS idx_card_transactions_account_id;
DROP INDEX IF EXISTS idx_card_transactions_status;
DROP INDEX IF EXISTS idx_card_transactions_authorized_at;
DROP INDEX IF EXISTS idx_card_transactions_is_gas_station;
DROP INDEX IF EXISTS idx_card_disputes_card_id;
DROP INDEX IF EXISTS idx_card_disputes_user_id;
DROP INDEX IF EXISTS idx_card_disputes_status;
DROP INDEX IF EXISTS idx_card_disputes_opened_at;
DROP INDEX IF EXISTS idx_card_loads_user_id;
DROP INDEX IF EXISTS idx_card_loads_account_id;
DROP INDEX IF EXISTS idx_card_loads_status;
DROP INDEX IF EXISTS idx_merchant_card_enrollment_is_gas_station;
DROP INDEX IF EXISTS idx_merchant_card_enrollment_acceptance_status;
DROP INDEX IF EXISTS idx_merchant_card_enrollment_mcc;

-- Drop unused indexes on fraud tables
DROP INDEX IF EXISTS idx_fraud_rules_is_enabled;
DROP INDEX IF EXISTS idx_fraud_rules_rule_type;
DROP INDEX IF EXISTS idx_fraud_events_card_id;
DROP INDEX IF EXISTS idx_fraud_events_created_at;
DROP INDEX IF EXISTS idx_fraud_events_resolved;

-- Drop unused indexes on call sessions
DROP INDEX IF EXISTS call_sessions_conversation_id_idx;
DROP INDEX IF EXISTS call_sessions_initiated_by_idx;
DROP INDEX IF EXISTS call_sessions_status_idx;
DROP INDEX IF EXISTS call_sessions_created_at_idx;

-- Drop unused indexes on business inquiries
DROP INDEX IF EXISTS business_inquiries_status_idx;
DROP INDEX IF EXISTS business_inquiries_user_id_idx;
DROP INDEX IF EXISTS business_inquiries_created_at_idx;
DROP INDEX IF EXISTS business_inquiries_responded_by_idx;

-- Drop unused indexes on moderation
DROP INDEX IF EXISTS idx_moderation_rewards_status;
DROP INDEX IF EXISTS idx_content_flags_queue_product;
DROP INDEX IF EXISTS idx_content_flags_queue_status;
DROP INDEX IF EXISTS idx_content_flags_queue_priority;
DROP INDEX IF EXISTS idx_moderation_appeals_product;
DROP INDEX IF EXISTS idx_moderation_appeals_seller;
DROP INDEX IF EXISTS idx_moderation_appeals_status;
DROP INDEX IF EXISTS idx_auto_moderation_logs_product;
DROP INDEX IF EXISTS idx_auto_moderation_logs_risk_score;
