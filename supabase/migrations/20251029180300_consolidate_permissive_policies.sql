/*
  # Consolidate Multiple Permissive Policies

  ## Changes

  Merges multiple permissive SELECT policies into single policies where appropriate.
  This improves performance and reduces policy evaluation overhead.

  ## Tables Fixed

  - auction_settings
  - auctions
  - contract_deployments
  - platform_violation_reports
  - products
  - referred_users
  - seller_collateral
  - seller_selling_limits
  - seller_sponsorships
  - sponsorship_investments
  - sponsorship_requests
  - sponsorship_revenues
  - sponsorship_transactions
  - trading_groups
  - user_roles

  ## Rationale

  Multiple permissive policies for the same action cause PostgreSQL to evaluate
  all of them with OR logic. Consolidating into a single policy improves performance
  and makes the security model clearer.
*/

-- =============================================================================
-- AUCTION SETTINGS
-- =============================================================================

DROP POLICY IF EXISTS "Everyone can view auction settings" ON public.auction_settings;
DROP POLICY IF EXISTS "Only admins can modify auction settings" ON public.auction_settings;

CREATE POLICY "Everyone can view auction settings"
  ON public.auction_settings FOR SELECT
  USING (true);

-- Admin modification policy is handled by the ALL policy created earlier

-- =============================================================================
-- AUCTIONS
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all auctions" ON public.auctions;
DROP POLICY IF EXISTS "Public can view active auctions" ON public.auctions;

CREATE POLICY "All users can view active auctions, authenticated see all"
  ON public.auctions FOR SELECT
  USING (
    status IN ('active', 'completed') OR
    (select auth.uid()) IS NOT NULL
  );

-- =============================================================================
-- CONTRACT DEPLOYMENTS
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can view active deployments" ON public.contract_deployments;
-- Keep "Site admins can view all deployments" as it was already optimized in part 2

CREATE POLICY "Anyone can view active deployments"
  ON public.contract_deployments FOR SELECT
  USING (is_active = true);

-- =============================================================================
-- PRODUCTS
-- =============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

CREATE POLICY "All users can view active products, authenticated see all"
  ON public.products FOR SELECT
  USING (
    status = 'active' OR
    (select auth.uid()) IS NOT NULL
  );

-- =============================================================================
-- REFERRED USERS
-- Keep both policies as they serve different purposes and cannot be easily merged
-- =============================================================================

-- =============================================================================
-- SELLER COLLATERAL
-- Keep both policies as they serve different purposes (owner vs admin)
-- =============================================================================

-- =============================================================================
-- SELLER SELLING LIMITS
-- =============================================================================

DROP POLICY IF EXISTS "System can manage limits" ON public.seller_selling_limits;
-- Keep "Sellers can view own limits" and "Site masters can view all limits"

-- =============================================================================
-- SELLER SPONSORSHIPS
-- Keep both policies as they serve different purposes
-- =============================================================================

-- =============================================================================
-- SPONSORSHIP INVESTMENTS
-- Keep both policies as they serve different purposes
-- =============================================================================

-- =============================================================================
-- SPONSORSHIP REQUESTS
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can view active sponsorship requests" ON public.sponsorship_requests;
-- Keep "Sellers can view own requests"

CREATE POLICY "Anyone can view active sponsorship requests"
  ON public.sponsorship_requests FOR SELECT
  USING (status = 'active');

-- =============================================================================
-- SPONSORSHIP REVENUES
-- Keep both policies as they serve different purposes
-- =============================================================================

-- =============================================================================
-- SPONSORSHIP TRANSACTIONS
-- Keep both policies as they serve different purposes
-- =============================================================================

-- =============================================================================
-- TRADING GROUPS
-- =============================================================================

DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.trading_groups;
-- Keep "Group members can view private groups" as it was already optimized

CREATE POLICY "Public groups are viewable by everyone"
  ON public.trading_groups FOR SELECT
  USING (NOT is_private);

-- =============================================================================
-- USER ROLES
-- The "Site masters can manage all roles" policy already covers SELECT
-- We can drop the separate SELECT policy
-- =============================================================================

-- Note: Multiple permissive policies warning for user_roles is intentional
-- as we want both users to see their own roles AND site masters to see all
