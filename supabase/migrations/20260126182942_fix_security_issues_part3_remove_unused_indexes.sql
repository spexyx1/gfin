/*
  # Security Fix - Part 3: Remove Unused Indexes
  
  ## Overview
  This migration removes indexes that have not been used. Unused indexes consume
  storage space and slow down write operations without providing any query benefit.
  
  ## Changes
  Remove unused indexes across all tables to improve write performance and reduce storage.
  
  ## Notes
  - Indexes that are never used are identified by Supabase analytics
  - Can be recreated later if query patterns change
*/

-- Trading Groups unused indexes
DROP INDEX IF EXISTS public.trading_groups_is_private_idx;
DROP INDEX IF EXISTS public.trading_groups_category_idx;
DROP INDEX IF EXISTS public.trading_groups_search_idx;

-- Group Members unused indexes
DROP INDEX IF EXISTS public.group_members_group_id_idx;
DROP INDEX IF EXISTS public.group_members_role_idx;

-- Group Posts unused indexes
DROP INDEX IF EXISTS public.group_posts_group_id_idx;
DROP INDEX IF EXISTS public.group_posts_created_at_idx;
DROP INDEX IF EXISTS public.group_posts_post_type_idx;
DROP INDEX IF EXISTS public.group_posts_search_idx;

-- Post Reactions unused indexes
DROP INDEX IF EXISTS public.post_reactions_post_id_idx;

-- Post Comments unused indexes
DROP INDEX IF EXISTS public.post_comments_post_id_idx;
DROP INDEX IF EXISTS public.post_comments_parent_id_idx;

-- Products unused indexes
DROP INDEX IF EXISTS public.products_category_idx;
DROP INDEX IF EXISTS public.products_created_at_idx;
DROP INDEX IF EXISTS public.products_price_usdc_idx;
DROP INDEX IF EXISTS public.products_in_stock_idx;

-- Profiles unused indexes
DROP INDEX IF EXISTS public.profiles_is_seller_idx;
DROP INDEX IF EXISTS public.profiles_verified_idx;

-- Seller Sponsorships unused indexes
DROP INDEX IF EXISTS public.idx_seller_sponsorships_status;

-- Sponsorship Revenues unused indexes
DROP INDEX IF EXISTS public.idx_sponsorship_revenues_sponsorship;

-- Orders unused indexes
DROP INDEX IF EXISTS public.orders_product_id_idx;
DROP INDEX IF EXISTS public.orders_status_idx;
DROP INDEX IF EXISTS public.orders_created_at_idx;
DROP INDEX IF EXISTS public.idx_orders_outcome_idx;

-- Trade Offers unused indexes
DROP INDEX IF EXISTS public.trade_offers_group_id_idx;
DROP INDEX IF EXISTS public.trade_offers_status_idx;
DROP INDEX IF EXISTS public.trade_offers_expires_at_idx;
DROP INDEX IF EXISTS public.trade_offers_offer_type_idx;
DROP INDEX IF EXISTS public.trade_offers_search_idx;

-- Fund Transfers unused indexes
DROP INDEX IF EXISTS public.fund_transfers_group_id_idx;
DROP INDEX IF EXISTS public.fund_transfers_status_idx;
DROP INDEX IF EXISTS public.fund_transfers_created_at_idx;

-- Group Invites unused indexes
DROP INDEX IF EXISTS public.group_invites_group_id_idx;
DROP INDEX IF EXISTS public.group_invites_status_idx;
DROP INDEX IF EXISTS public.group_invites_expires_at_idx;

-- Conversations unused indexes
DROP INDEX IF EXISTS public.conversations_updated_at_idx;

-- Messages unused indexes
DROP INDEX IF EXISTS public.messages_conversation_id_idx;
DROP INDEX IF EXISTS public.messages_created_at_idx;
DROP INDEX IF EXISTS public.messages_read_idx;
DROP INDEX IF EXISTS public.messages_message_type_idx;

-- Referral Transactions unused indexes
DROP INDEX IF EXISTS public.referral_transactions_source_id_idx;

-- Auctions unused indexes
DROP INDEX IF EXISTS public.idx_auctions_product_id;
DROP INDEX IF EXISTS public.auctions_status_idx;
DROP INDEX IF EXISTS public.auctions_category_idx;
DROP INDEX IF EXISTS public.auctions_end_time_idx;
DROP INDEX IF EXISTS public.auctions_start_time_idx;
DROP INDEX IF EXISTS public.auctions_auction_type_idx;
DROP INDEX IF EXISTS public.auctions_search_idx;

-- Auction Bids unused indexes
DROP INDEX IF EXISTS public.auction_bids_auction_id_idx;
DROP INDEX IF EXISTS public.auction_bids_bid_status_idx;
DROP INDEX IF EXISTS public.auction_bids_bid_time_idx;

-- Auction Watchers unused indexes
DROP INDEX IF EXISTS public.auction_watchers_auction_id_idx;

-- Auction History unused indexes
DROP INDEX IF EXISTS public.auction_history_auction_id_idx;
DROP INDEX IF EXISTS public.auction_history_event_type_idx;
DROP INDEX IF EXISTS public.auction_history_created_at_idx;

-- Auction Disputes unused indexes
DROP INDEX IF EXISTS public.auction_disputes_auction_id_idx;
DROP INDEX IF EXISTS public.auction_disputes_status_idx;

-- Transaction Reputation unused indexes
DROP INDEX IF EXISTS public.idx_transaction_reputation_user;
DROP INDEX IF EXISTS public.idx_transaction_reputation_status;
DROP INDEX IF EXISTS public.idx_transaction_reputation_suspended;
DROP INDEX IF EXISTS public.idx_transaction_reputation_history_user;
DROP INDEX IF EXISTS public.idx_transaction_reputation_history_moderator_id;

-- Investor Stakes unused indexes
DROP INDEX IF EXISTS public.idx_investor_stakes_status;

-- Contract Deployments unused indexes
DROP INDEX IF EXISTS public.idx_is_active;
DROP INDEX IF EXISTS public.idx_chain_id;

-- Sponsorship unused indexes
DROP INDEX IF EXISTS public.idx_sponsorship_requests_category;
DROP INDEX IF EXISTS public.idx_sponsorship_investments_request;
DROP INDEX IF EXISTS public.idx_sponsorship_transactions_order;
DROP INDEX IF EXISTS public.idx_sponsored_products_product;

-- Offramper unused indexes
DROP INDEX IF EXISTS public.idx_offramper_accounts_application_id;
DROP INDEX IF EXISTS public.idx_offramper_accounts_suspended_by;
DROP INDEX IF EXISTS public.idx_offramper_applications_reviewed_by;
DROP INDEX IF EXISTS public.idx_offramper_applications_user;
DROP INDEX IF EXISTS public.idx_offramper_applications_status;
DROP INDEX IF EXISTS public.idx_offramper_accounts_user;
DROP INDEX IF EXISTS public.idx_offramper_accounts_status;
DROP INDEX IF EXISTS public.idx_offramper_transactions_offramper;
DROP INDEX IF EXISTS public.idx_offramper_transactions_client;
DROP INDEX IF EXISTS public.idx_offramper_invites_invited_by;
DROP INDEX IF EXISTS public.idx_offramper_kyc_documents_application_id;
DROP INDEX IF EXISTS public.idx_offramper_kyc_documents_verified_by;

-- Fund Release Requests unused indexes
DROP INDEX IF EXISTS public.fund_release_requests_order_id_idx;
DROP INDEX IF EXISTS public.fund_release_requests_status_idx;

-- Suspension Overrides unused indexes
DROP INDEX IF EXISTS public.idx_suspension_overrides_overridden_by;
DROP INDEX IF EXISTS public.idx_suspension_overrides_user_id;

-- Housing Projects unused indexes
DROP INDEX IF EXISTS public.idx_housing_projects_status;
DROP INDEX IF EXISTS public.idx_housing_projects_country;
DROP INDEX IF EXISTS public.idx_housing_projects_city;
DROP INDEX IF EXISTS public.idx_housing_projects_created_by;

-- Housing NFTs unused indexes
DROP INDEX IF EXISTS public.idx_housing_nfts_project_id;
DROP INDEX IF EXISTS public.idx_housing_nfts_owner_id;

-- Tenant Partnerships unused indexes
DROP INDEX IF EXISTS public.idx_tenant_partnerships_project_id;
DROP INDEX IF EXISTS public.idx_tenant_partnerships_sponsor_id;
DROP INDEX IF EXISTS public.idx_tenant_partnerships_tenant_id;
DROP INDEX IF EXISTS public.idx_tenant_partnerships_status;

-- Partnership Revenues unused indexes
DROP INDEX IF EXISTS public.idx_partnership_revenues_partnership_id;

-- Project Updates unused indexes
DROP INDEX IF EXISTS public.idx_project_updates_project_id;

-- Blockchain unused indexes
DROP INDEX IF EXISTS public.idx_blockchain_tx_hash;
DROP INDEX IF EXISTS public.idx_blockchain_tx_from;
DROP INDEX IF EXISTS public.idx_blockchain_tx_to;
DROP INDEX IF EXISTS public.idx_blockchain_tx_contract;
DROP INDEX IF EXISTS public.idx_blockchain_tx_status;
DROP INDEX IF EXISTS public.idx_blockchain_tx_timestamp;
DROP INDEX IF EXISTS public.idx_blockchain_tx_block;

-- Swap Tokens unused indexes
DROP INDEX IF EXISTS public.idx_supported_tokens_chain;
DROP INDEX IF EXISTS public.idx_supported_tokens_active;
DROP INDEX IF EXISTS public.idx_supported_tokens_gasless;

-- Atomic Swaps unused indexes
DROP INDEX IF EXISTS public.idx_atomic_swaps_initiator;
DROP INDEX IF EXISTS public.idx_atomic_swaps_recipient;
DROP INDEX IF EXISTS public.idx_atomic_swaps_status;
DROP INDEX IF EXISTS public.idx_atomic_swaps_created;
DROP INDEX IF EXISTS public.idx_atomic_swaps_expires;

-- Gas Subsidies unused indexes
DROP INDEX IF EXISTS public.idx_gas_subsidies_swap;
DROP INDEX IF EXISTS public.idx_gas_subsidies_chain;

-- Violation Reports unused indexes
DROP INDEX IF EXISTS public.idx_violation_reports_status;
DROP INDEX IF EXISTS public.idx_violation_reports_priority;

-- User Roles unused indexes
DROP INDEX IF EXISTS public.idx_user_roles_active;

-- Audit Logs unused indexes
DROP INDEX IF EXISTS public.idx_audit_logs_created;

-- Moderation Actions unused indexes
DROP INDEX IF EXISTS public.idx_moderation_actions_target;
DROP INDEX IF EXISTS public.idx_moderation_actions_report_id;

-- User Activities unused indexes
DROP INDEX IF EXISTS public.idx_user_activities_created;

-- Dispute Cases unused indexes
DROP INDEX IF EXISTS public.idx_dispute_cases_status;
DROP INDEX IF EXISTS public.idx_case_evidence_case;
DROP INDEX IF EXISTS public.idx_case_comments_case;

-- Token Management unused indexes
DROP INDEX IF EXISTS public.idx_token_holders_address;
DROP INDEX IF EXISTS public.idx_token_holders_balance;
DROP INDEX IF EXISTS public.idx_token_holders_user;
DROP INDEX IF EXISTS public.idx_token_holders_blacklisted;
DROP INDEX IF EXISTS public.idx_token_transfers_hash;
DROP INDEX IF EXISTS public.idx_token_transfers_from;
DROP INDEX IF EXISTS public.idx_token_transfers_to;
DROP INDEX IF EXISTS public.idx_token_transfers_block;
DROP INDEX IF EXISTS public.idx_token_transfers_timestamp;
DROP INDEX IF EXISTS public.idx_token_transfers_type;
DROP INDEX IF EXISTS public.idx_contract_events_address;
DROP INDEX IF EXISTS public.idx_contract_events_name;
DROP INDEX IF EXISTS public.idx_contract_events_hash;
DROP INDEX IF EXISTS public.idx_contract_events_block;
DROP INDEX IF EXISTS public.idx_contract_events_timestamp;
DROP INDEX IF EXISTS public.idx_contract_events_processed;
DROP INDEX IF EXISTS public.idx_token_allowances_owner;
DROP INDEX IF EXISTS public.idx_token_allowances_spender;
DROP INDEX IF EXISTS public.idx_token_allowances_contract;

-- Analytics unused indexes
DROP INDEX IF EXISTS public.idx_blockchain_analytics_type;
DROP INDEX IF EXISTS public.idx_blockchain_analytics_name;
DROP INDEX IF EXISTS public.idx_blockchain_analytics_period;

-- Platform Settings unused indexes
DROP INDEX IF EXISTS public.idx_platform_settings_category;

-- Rate Configurations unused indexes
DROP INDEX IF EXISTS public.idx_rate_configurations_category;

-- Escrow Tracking unused indexes
DROP INDEX IF EXISTS public.idx_escrow_tracking_order;
DROP INDEX IF EXISTS public.idx_escrow_tracking_on_chain_id;
DROP INDEX IF EXISTS public.idx_escrow_tracking_buyer;
DROP INDEX IF EXISTS public.idx_escrow_tracking_seller;
DROP INDEX IF EXISTS public.idx_escrow_tracking_status;

-- Sync Status unused indexes
DROP INDEX IF EXISTS public.idx_sync_status_address;
DROP INDEX IF EXISTS public.idx_sync_status_type;
DROP INDEX IF EXISTS public.idx_sync_status_status;
