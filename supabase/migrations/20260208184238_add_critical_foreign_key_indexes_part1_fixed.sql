/*
  # Add Critical Foreign Key Indexes (Part 1)

  1. Performance & Security
    - Add indexes on foreign key columns to improve query performance
    - Prevent potential DOS attacks via expensive joins
    - Improve RLS policy evaluation speed

  2. Changes
    - Add indexes for atomic_swaps foreign keys
    - Add indexes for auction-related foreign keys
    - Add indexes for case management foreign keys
    - Add indexes for escrow and fund management foreign keys
    - Add indexes for housing marketplace foreign keys
    
  Note: Indexes created without CONCURRENTLY for migration compatibility
*/

-- Atomic Swaps
CREATE INDEX IF NOT EXISTS idx_atomic_swaps_initiator_id
  ON atomic_swaps(initiator_id);

CREATE INDEX IF NOT EXISTS idx_atomic_swaps_recipient_id
  ON atomic_swaps(recipient_id);

-- Auctions
CREATE INDEX IF NOT EXISTS idx_auction_disputes_auction_id
  ON auction_disputes(auction_id);

CREATE INDEX IF NOT EXISTS idx_auction_history_auction_id
  ON auction_history(auction_id);

-- Case Management
CREATE INDEX IF NOT EXISTS idx_case_comments_case_id
  ON case_comments(case_id);

CREATE INDEX IF NOT EXISTS idx_case_evidence_case_id
  ON case_evidence(case_id);

-- Escrow & Orders
CREATE INDEX IF NOT EXISTS idx_escrow_deal_tracking_order_id
  ON escrow_deal_tracking(order_id);

CREATE INDEX IF NOT EXISTS idx_fund_release_requests_order_id
  ON fund_release_requests(order_id);

CREATE INDEX IF NOT EXISTS idx_orders_product_id
  ON orders(product_id);

-- Fund Transfers & Groups
CREATE INDEX IF NOT EXISTS idx_fund_transfers_group_id
  ON fund_transfers(group_id);

CREATE INDEX IF NOT EXISTS idx_group_posts_group_id
  ON group_posts(group_id);

CREATE INDEX IF NOT EXISTS idx_trade_offers_group_id
  ON trade_offers(group_id);

-- Housing Marketplace
CREATE INDEX IF NOT EXISTS idx_housing_nfts_owner_id
  ON housing_nfts(owner_id);

CREATE INDEX IF NOT EXISTS idx_housing_nfts_project_id
  ON housing_nfts(project_id);

CREATE INDEX IF NOT EXISTS idx_housing_projects_created_by
  ON housing_projects(created_by);

CREATE INDEX IF NOT EXISTS idx_project_updates_project_id
  ON project_updates(project_id);

CREATE INDEX IF NOT EXISTS idx_tenant_partnerships_project_id
  ON tenant_partnerships(project_id);

CREATE INDEX IF NOT EXISTS idx_tenant_partnerships_tenant_id
  ON tenant_partnerships(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_partnerships_sponsor_id
  ON tenant_partnerships(sponsor_id);