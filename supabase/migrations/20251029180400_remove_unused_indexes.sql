/*
  # Remove Unused Indexes

  ## Changes

  Drops indexes that have not been used according to database statistics.
  Unused indexes consume storage space and slow down INSERT/UPDATE/DELETE operations.

  ## Impact

  - Reduces storage overhead
  - Improves write performance
  - Reduces maintenance overhead during VACUUM operations
  - Can be recreated later if usage patterns change

  ## Indexes Removed

  All indexes flagged as unused by pg_stat_user_indexes analysis.
  These can be recreated if future query patterns require them.
*/

-- Orders table unused indexes
DROP INDEX IF EXISTS public.orders_tracking_number_idx;
DROP INDEX IF EXISTS public.orders_currency_idx;
DROP INDEX IF EXISTS public.orders_product_id_idx;
DROP INDEX IF EXISTS public.orders_status_idx;
DROP INDEX IF EXISTS public.orders_created_at_idx;
DROP INDEX IF EXISTS public.orders_payment_token_idx;

-- Trading groups unused indexes
DROP INDEX IF EXISTS public.trading_groups_is_private_idx;
DROP INDEX IF EXISTS public.trading_groups_category_idx;
DROP INDEX IF EXISTS public.trading_groups_search_idx;

-- Group members unused indexes
DROP INDEX IF EXISTS public.group_members_group_id_idx;
DROP INDEX IF EXISTS public.group_members_role_idx;

-- Group posts unused indexes
DROP INDEX IF EXISTS public.group_posts_group_id_idx;
DROP INDEX IF EXISTS public.group_posts_created_at_idx;
DROP INDEX IF EXISTS public.group_posts_post_type_idx;
DROP INDEX IF EXISTS public.group_posts_search_idx;

-- Post reactions unused indexes
DROP INDEX IF EXISTS public.post_reactions_post_id_idx;

-- Post comments unused indexes
DROP INDEX IF EXISTS public.post_comments_post_id_idx;
DROP INDEX IF EXISTS public.post_comments_parent_id_idx;

-- Products table unused indexes
DROP INDEX IF EXISTS public.products_category_idx;
DROP INDEX IF EXISTS public.products_created_at_idx;
DROP INDEX IF EXISTS public.products_price_usdc_idx;
DROP INDEX IF EXISTS public.products_in_stock_idx;
DROP INDEX IF EXISTS public.products_search_idx;

-- Trade offers unused indexes
DROP INDEX IF EXISTS public.trade_offers_group_id_idx;
DROP INDEX IF EXISTS public.trade_offers_status_idx;
DROP INDEX IF EXISTS public.trade_offers_expires_at_idx;
DROP INDEX IF EXISTS public.trade_offers_offer_type_idx;
DROP INDEX IF EXISTS public.trade_offers_search_idx;

-- Fund transfers unused indexes
DROP INDEX IF EXISTS public.fund_transfers_group_id_idx;
DROP INDEX IF EXISTS public.fund_transfers_status_idx;
DROP INDEX IF EXISTS public.fund_transfers_created_at_idx;

-- Group invites unused indexes
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

-- Profiles unused indexes
DROP INDEX IF EXISTS public.profiles_is_seller_idx;
DROP INDEX IF EXISTS public.profiles_verified_idx;
DROP INDEX IF EXISTS public.profiles_email_lookup_idx;
DROP INDEX IF EXISTS public.profiles_last_login_idx;
DROP INDEX IF EXISTS public.profiles_auth_email_hash_idx;
DROP INDEX IF EXISTS public.profiles_username_lookup_idx;

-- Referral transactions unused indexes
DROP INDEX IF EXISTS public.referral_transactions_source_id_idx;

-- Investor stakes unused indexes
DROP INDEX IF EXISTS public.idx_investor_stakes_status;

-- Auctions unused indexes
DROP INDEX IF EXISTS public.auctions_status_idx;
DROP INDEX IF EXISTS public.auctions_category_idx;
DROP INDEX IF EXISTS public.auctions_end_time_idx;
DROP INDEX IF EXISTS public.auctions_start_time_idx;
DROP INDEX IF EXISTS public.auctions_auction_type_idx;
DROP INDEX IF EXISTS public.auctions_search_idx;

-- Auction bids unused indexes
DROP INDEX IF EXISTS public.auction_bids_auction_id_idx;
DROP INDEX IF EXISTS public.auction_bids_bid_status_idx;
DROP INDEX IF EXISTS public.auction_bids_bid_time_idx;

-- Auction watchers unused indexes
DROP INDEX IF EXISTS public.auction_watchers_auction_id_idx;

-- Auction history unused indexes
DROP INDEX IF EXISTS public.auction_history_auction_id_idx;
DROP INDEX IF EXISTS public.auction_history_event_type_idx;
DROP INDEX IF EXISTS public.auction_history_created_at_idx;

-- Auction disputes unused indexes
DROP INDEX IF EXISTS public.auction_disputes_auction_id_idx;
DROP INDEX IF EXISTS public.auction_disputes_status_idx;

-- Contract deployments unused indexes
DROP INDEX IF EXISTS public.idx_is_active;
DROP INDEX IF EXISTS public.idx_chain_id;
DROP INDEX IF EXISTS public.idx_deployed_at;

-- Seller sponsorships unused indexes
DROP INDEX IF EXISTS public.idx_seller_sponsorships_status;

-- Sponsorship revenues unused indexes
DROP INDEX IF EXISTS public.idx_sponsorship_revenues_sponsorship;

-- Sponsorship requests unused indexes
DROP INDEX IF EXISTS public.idx_sponsorship_requests_category;

-- Sponsorship investments unused indexes
DROP INDEX IF EXISTS public.idx_sponsorship_investments_request;

-- Sponsorship transactions unused indexes
DROP INDEX IF EXISTS public.idx_sponsorship_transactions_order;

-- Sponsored products unused indexes
DROP INDEX IF EXISTS public.idx_sponsored_products_product;

-- Fund release requests unused indexes
DROP INDEX IF EXISTS public.fund_release_requests_order_id_idx;
DROP INDEX IF EXISTS public.fund_release_requests_status_idx;

-- Platform violation reports unused indexes
DROP INDEX IF EXISTS public.idx_violation_reports_status;
DROP INDEX IF EXISTS public.idx_violation_reports_priority;
DROP INDEX IF EXISTS public.idx_violation_reports_created;

-- User roles unused indexes
DROP INDEX IF EXISTS public.idx_user_roles_user_id;
DROP INDEX IF EXISTS public.idx_user_roles_active;

-- Audit logs unused indexes
DROP INDEX IF EXISTS public.idx_audit_logs_user_id;
DROP INDEX IF EXISTS public.idx_audit_logs_created;

-- Moderation actions unused indexes
DROP INDEX IF EXISTS public.idx_moderation_actions_moderator;
DROP INDEX IF EXISTS public.idx_moderation_actions_target;

-- User activities unused indexes
DROP INDEX IF EXISTS public.idx_user_activities_user_id;
DROP INDEX IF EXISTS public.idx_user_activities_created;

-- Note: If any of these indexes become needed in the future due to changing
-- query patterns, they can be recreated with:
-- CREATE INDEX CONCURRENTLY [index_name] ON [table_name]([column_name]);
