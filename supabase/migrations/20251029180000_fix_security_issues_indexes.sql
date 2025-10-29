/*
  # Fix Security Issues - Add Missing Foreign Key Indexes

  ## Changes

  1. **Add Foreign Key Indexes**
     - auction_disputes: complainant_id, resolved_by, respondent_id
     - auction_history: actor_id
     - auctions: product_id
     - fund_release_requests: requested_by
     - messages: order_id
     - moderation_actions: report_id
     - platform_violation_reports: reporter_id, reviewed_by
     - seller_sponsorships: stake_id
     - site_admins: granted_by
     - sponsored_products: request_id
     - sponsorship_transactions: investment_id, request_id, seller_id
     - user_roles: granted_by

  ## Rationale

  Foreign keys without indexes can cause significant performance degradation,
  especially on large tables. These indexes improve:
  - JOIN performance
  - CASCADE delete/update performance
  - Foreign key constraint validation speed
*/

-- auction_disputes indexes
CREATE INDEX IF NOT EXISTS idx_auction_disputes_complainant_id
  ON public.auction_disputes(complainant_id);

CREATE INDEX IF NOT EXISTS idx_auction_disputes_resolved_by
  ON public.auction_disputes(resolved_by);

CREATE INDEX IF NOT EXISTS idx_auction_disputes_respondent_id
  ON public.auction_disputes(respondent_id);

-- auction_history indexes
CREATE INDEX IF NOT EXISTS idx_auction_history_actor_id
  ON public.auction_history(actor_id);

-- auctions indexes
CREATE INDEX IF NOT EXISTS idx_auctions_product_id
  ON public.auctions(product_id);

-- fund_release_requests indexes
CREATE INDEX IF NOT EXISTS idx_fund_release_requests_requested_by
  ON public.fund_release_requests(requested_by);

-- messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_order_id
  ON public.messages(order_id);

-- moderation_actions indexes
CREATE INDEX IF NOT EXISTS idx_moderation_actions_report_id
  ON public.moderation_actions(report_id);

-- platform_violation_reports indexes
CREATE INDEX IF NOT EXISTS idx_platform_violation_reports_reporter_id
  ON public.platform_violation_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_platform_violation_reports_reviewed_by
  ON public.platform_violation_reports(reviewed_by);

-- seller_sponsorships indexes
CREATE INDEX IF NOT EXISTS idx_seller_sponsorships_stake_id
  ON public.seller_sponsorships(stake_id);

-- site_admins indexes
CREATE INDEX IF NOT EXISTS idx_site_admins_granted_by
  ON public.site_admins(granted_by);

-- sponsored_products indexes
CREATE INDEX IF NOT EXISTS idx_sponsored_products_request_id
  ON public.sponsored_products(request_id);

-- sponsorship_transactions indexes
CREATE INDEX IF NOT EXISTS idx_sponsorship_transactions_investment_id
  ON public.sponsorship_transactions(investment_id);

CREATE INDEX IF NOT EXISTS idx_sponsorship_transactions_request_id
  ON public.sponsorship_transactions(request_id);

CREATE INDEX IF NOT EXISTS idx_sponsorship_transactions_seller_id
  ON public.sponsorship_transactions(seller_id);

-- user_roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_granted_by
  ON public.user_roles(granted_by);
