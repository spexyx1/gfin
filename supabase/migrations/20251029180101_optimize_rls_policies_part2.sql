/*
  # Optimize RLS Policies for Performance - Part 2

  ## Changes

  Continues optimization of RLS policies for remaining tables:
  - platform_settings
  - auction tables
  - contract_deployments
  - seller_collateral
  - sponsorship tables
  - fund_release_requests
  - platform_violation_reports
  - user_roles
  - audit_logs
  - moderation_actions
  - notification_preferences
  - user_activities
*/

-- =============================================================================
-- PLATFORM SETTINGS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

-- =============================================================================
-- AUCTION SETTINGS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Only admins can modify auction settings" ON public.auction_settings;
CREATE POLICY "Only admins can modify auction settings"
  ON public.auction_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

-- =============================================================================
-- AUCTIONS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Sellers can create auctions" ON public.auctions;
CREATE POLICY "Sellers can create auctions"
  ON public.auctions FOR INSERT
  WITH CHECK ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Sellers can update their own auctions" ON public.auctions;
CREATE POLICY "Sellers can update their own auctions"
  ON public.auctions FOR UPDATE
  USING ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Sellers can delete their own draft auctions" ON public.auctions;
CREATE POLICY "Sellers can delete their own draft auctions"
  ON public.auctions FOR DELETE
  USING ((select auth.uid()) = seller_id AND status = 'draft');

-- =============================================================================
-- AUCTION BIDS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Auction participants can view bids" ON public.auction_bids;
CREATE POLICY "Auction participants can view bids"
  ON public.auction_bids FOR SELECT
  USING (
    (select auth.uid()) = bidder_id OR
    EXISTS (
      SELECT 1 FROM public.auctions
      WHERE auctions.id = auction_bids.auction_id
      AND auctions.seller_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can place bids" ON public.auction_bids;
CREATE POLICY "Authenticated users can place bids"
  ON public.auction_bids FOR INSERT
  WITH CHECK ((select auth.uid()) = bidder_id);

DROP POLICY IF EXISTS "Bidders can update their own bids" ON public.auction_bids;
CREATE POLICY "Bidders can update their own bids"
  ON public.auction_bids FOR UPDATE
  USING ((select auth.uid()) = bidder_id);

-- =============================================================================
-- AUCTION WATCHERS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own watches" ON public.auction_watchers;
CREATE POLICY "Users can view their own watches"
  ON public.auction_watchers FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can watch auctions" ON public.auction_watchers;
CREATE POLICY "Users can watch auctions"
  ON public.auction_watchers FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their watch preferences" ON public.auction_watchers;
CREATE POLICY "Users can update their watch preferences"
  ON public.auction_watchers FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unwatch auctions" ON public.auction_watchers;
CREATE POLICY "Users can unwatch auctions"
  ON public.auction_watchers FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =============================================================================
-- AUCTION HISTORY TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Auction participants can view history" ON public.auction_history;
CREATE POLICY "Auction participants can view history"
  ON public.auction_history FOR SELECT
  USING (
    (select auth.uid()) = actor_id OR
    EXISTS (
      SELECT 1 FROM public.auctions
      WHERE auctions.id = auction_history.auction_id
      AND auctions.seller_id = (select auth.uid())
    )
  );

-- =============================================================================
-- AUCTION DISPUTES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Dispute parties can view their disputes" ON public.auction_disputes;
CREATE POLICY "Dispute parties can view their disputes"
  ON public.auction_disputes FOR SELECT
  USING (
    (select auth.uid()) = complainant_id OR
    (select auth.uid()) = respondent_id OR
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can create disputes" ON public.auction_disputes;
CREATE POLICY "Users can create disputes"
  ON public.auction_disputes FOR INSERT
  WITH CHECK ((select auth.uid()) = complainant_id);

DROP POLICY IF EXISTS "Admins can update disputes" ON public.auction_disputes;
CREATE POLICY "Admins can update disputes"
  ON public.auction_disputes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

-- =============================================================================
-- SITE ADMINS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view site admins" ON public.site_admins;
CREATE POLICY "Admins can view site admins"
  ON public.site_admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins sa
      WHERE sa.user_id = (select auth.uid())
      AND sa.is_active = true
    )
  );

-- =============================================================================
-- CONTRACT DEPLOYMENTS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Site admins can view all deployments" ON public.contract_deployments;
CREATE POLICY "Site admins can view all deployments"
  ON public.contract_deployments FOR SELECT
  USING (
    is_active = true OR
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

DROP POLICY IF EXISTS "Site admins can create deployments" ON public.contract_deployments;
CREATE POLICY "Site admins can create deployments"
  ON public.contract_deployments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

DROP POLICY IF EXISTS "Site admins can update deployments" ON public.contract_deployments;
CREATE POLICY "Site admins can update deployments"
  ON public.contract_deployments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

DROP POLICY IF EXISTS "Site admins can delete deployments" ON public.contract_deployments;
CREATE POLICY "Site admins can delete deployments"
  ON public.contract_deployments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

-- =============================================================================
-- SELLER COLLATERAL TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Sellers can view own collateral" ON public.seller_collateral;
CREATE POLICY "Sellers can view own collateral"
  ON public.seller_collateral FOR SELECT
  USING ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Site masters can view all collateral" ON public.seller_collateral;
CREATE POLICY "Site masters can view all collateral"
  ON public.seller_collateral FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

DROP POLICY IF EXISTS "Sellers can insert own collateral" ON public.seller_collateral;
CREATE POLICY "Sellers can insert own collateral"
  ON public.seller_collateral FOR INSERT
  WITH CHECK ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Sellers can update own collateral" ON public.seller_collateral;
CREATE POLICY "Sellers can update own collateral"
  ON public.seller_collateral FOR UPDATE
  USING ((select auth.uid()) = seller_id);

-- =============================================================================
-- SELLER SELLING LIMITS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Sellers can view own limits" ON public.seller_selling_limits;
CREATE POLICY "Sellers can view own limits"
  ON public.seller_selling_limits FOR SELECT
  USING ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Site masters can view all limits" ON public.seller_selling_limits;
CREATE POLICY "Site masters can view all limits"
  ON public.seller_selling_limits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

-- =============================================================================
-- INVESTOR STAKES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Investors can view own stakes" ON public.investor_stakes;
CREATE POLICY "Investors can view own stakes"
  ON public.investor_stakes FOR SELECT
  USING ((select auth.uid()) = investor_id);

DROP POLICY IF EXISTS "Investors can create stakes" ON public.investor_stakes;
CREATE POLICY "Investors can create stakes"
  ON public.investor_stakes FOR INSERT
  WITH CHECK ((select auth.uid()) = investor_id);

DROP POLICY IF EXISTS "Investors can update own stakes" ON public.investor_stakes;
CREATE POLICY "Investors can update own stakes"
  ON public.investor_stakes FOR UPDATE
  USING ((select auth.uid()) = investor_id);

-- =============================================================================
-- SELLER SPONSORSHIPS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Investors can view own sponsorships" ON public.seller_sponsorships;
CREATE POLICY "Investors can view own sponsorships"
  ON public.seller_sponsorships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.investor_stakes
      WHERE investor_stakes.id = seller_sponsorships.stake_id
      AND investor_stakes.investor_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can view their sponsorships" ON public.seller_sponsorships;
CREATE POLICY "Sellers can view their sponsorships"
  ON public.seller_sponsorships FOR SELECT
  USING ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Investors can create sponsorships" ON public.seller_sponsorships;
CREATE POLICY "Investors can create sponsorships"
  ON public.seller_sponsorships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.investor_stakes
      WHERE investor_stakes.id = seller_sponsorships.stake_id
      AND investor_stakes.investor_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Investors can update own sponsorships" ON public.seller_sponsorships;
CREATE POLICY "Investors can update own sponsorships"
  ON public.seller_sponsorships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.investor_stakes
      WHERE investor_stakes.id = seller_sponsorships.stake_id
      AND investor_stakes.investor_id = (select auth.uid())
    )
  );

-- =============================================================================
-- SPONSORSHIP REVENUES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Investors can view own revenues" ON public.sponsorship_revenues;
CREATE POLICY "Investors can view own revenues"
  ON public.sponsorship_revenues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.seller_sponsorships
      JOIN public.investor_stakes ON investor_stakes.id = seller_sponsorships.stake_id
      WHERE seller_sponsorships.id = sponsorship_revenues.sponsorship_id
      AND investor_stakes.investor_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can view revenue distributions" ON public.sponsorship_revenues;
CREATE POLICY "Sellers can view revenue distributions"
  ON public.sponsorship_revenues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.seller_sponsorships
      WHERE seller_sponsorships.id = sponsorship_revenues.sponsorship_id
      AND seller_sponsorships.seller_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "System can create revenue records" ON public.sponsorship_revenues;
CREATE POLICY "System can create revenue records"
  ON public.sponsorship_revenues FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- SPONSORSHIP REQUESTS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Sellers can view own requests" ON public.sponsorship_requests;
CREATE POLICY "Sellers can view own requests"
  ON public.sponsorship_requests FOR SELECT
  USING ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Sellers can create requests" ON public.sponsorship_requests;
CREATE POLICY "Sellers can create requests"
  ON public.sponsorship_requests FOR INSERT
  WITH CHECK ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Sellers can update own requests" ON public.sponsorship_requests;
CREATE POLICY "Sellers can update own requests"
  ON public.sponsorship_requests FOR UPDATE
  USING ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Sellers can delete own draft requests" ON public.sponsorship_requests;
CREATE POLICY "Sellers can delete own draft requests"
  ON public.sponsorship_requests FOR DELETE
  USING ((select auth.uid()) = seller_id AND status = 'draft');

-- =============================================================================
-- SPONSORSHIP INVESTMENTS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Sponsors can view own investments" ON public.sponsorship_investments;
CREATE POLICY "Sponsors can view own investments"
  ON public.sponsorship_investments FOR SELECT
  USING ((select auth.uid()) = sponsor_id);

DROP POLICY IF EXISTS "Sellers can view investments in their requests" ON public.sponsorship_investments;
CREATE POLICY "Sellers can view investments in their requests"
  ON public.sponsorship_investments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sponsorship_requests
      WHERE sponsorship_requests.id = sponsorship_investments.request_id
      AND sponsorship_requests.seller_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sponsors can create investments" ON public.sponsorship_investments;
CREATE POLICY "Sponsors can create investments"
  ON public.sponsorship_investments FOR INSERT
  WITH CHECK ((select auth.uid()) = sponsor_id);

DROP POLICY IF EXISTS "Sponsors can view investment updates" ON public.sponsorship_investments;
CREATE POLICY "Sponsors can view investment updates"
  ON public.sponsorship_investments FOR UPDATE
  USING ((select auth.uid()) = sponsor_id);

-- =============================================================================
-- SPONSORSHIP TRANSACTIONS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Sponsors can view own transactions" ON public.sponsorship_transactions;
CREATE POLICY "Sponsors can view own transactions"
  ON public.sponsorship_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sponsorship_investments
      WHERE sponsorship_investments.id = sponsorship_transactions.investment_id
      AND sponsorship_investments.sponsor_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can view own transactions" ON public.sponsorship_transactions;
CREATE POLICY "Sellers can view own transactions"
  ON public.sponsorship_transactions FOR SELECT
  USING ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "System can create transactions" ON public.sponsorship_transactions;
CREATE POLICY "System can create transactions"
  ON public.sponsorship_transactions FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- SPONSORED PRODUCTS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Sellers can link own products" ON public.sponsored_products;
CREATE POLICY "Sellers can link own products"
  ON public.sponsored_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = sponsored_products.product_id
      AND products.seller_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can unlink own products" ON public.sponsored_products;
CREATE POLICY "Sellers can unlink own products"
  ON public.sponsored_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = sponsored_products.product_id
      AND products.seller_id = (select auth.uid())
    )
  );

-- =============================================================================
-- FUND RELEASE REQUESTS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view fund release requests for their orders" ON public.fund_release_requests;
CREATE POLICY "Users can view fund release requests for their orders"
  ON public.fund_release_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = fund_release_requests.order_id
      AND ((select auth.uid()) = orders.buyer_id OR (select auth.uid()) = orders.seller_id)
    )
  );

-- =============================================================================
-- PLATFORM VIOLATION REPORTS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can create violation reports" ON public.platform_violation_reports;
CREATE POLICY "Users can create violation reports"
  ON public.platform_violation_reports FOR INSERT
  WITH CHECK ((select auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.platform_violation_reports;
CREATE POLICY "Users can view their own reports"
  ON public.platform_violation_reports FOR SELECT
  USING ((select auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "Site masters can view all reports" ON public.platform_violation_reports;
CREATE POLICY "Site masters can view all reports"
  ON public.platform_violation_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

DROP POLICY IF EXISTS "Site masters can update reports" ON public.platform_violation_reports;
CREATE POLICY "Site masters can update reports"
  ON public.platform_violation_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

-- =============================================================================
-- USER ROLES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Site masters can manage all roles" ON public.user_roles;
CREATE POLICY "Site masters can manage all roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

-- =============================================================================
-- AUDIT LOGS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Only site masters can view audit logs" ON public.audit_logs;
CREATE POLICY "Only site masters can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

-- =============================================================================
-- MODERATION ACTIONS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Moderators can view their actions" ON public.moderation_actions;
CREATE POLICY "Moderators can view their actions"
  ON public.moderation_actions FOR SELECT
  USING (
    (select auth.uid()) = moderator_id OR
    EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

DROP POLICY IF EXISTS "Moderators can create actions" ON public.moderation_actions;
CREATE POLICY "Moderators can create actions"
  ON public.moderation_actions FOR INSERT
  WITH CHECK (
    (select auth.uid()) = moderator_id
    AND EXISTS (
      SELECT 1 FROM public.site_admins
      WHERE site_admins.user_id = (select auth.uid())
      AND site_admins.is_active = true
    )
  );

-- =============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage their own notification preferences"
  ON public.notification_preferences FOR ALL
  USING ((select auth.uid()) = user_id);

-- =============================================================================
-- USER ACTIVITIES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own activities" ON public.user_activities;
CREATE POLICY "Users can view their own activities"
  ON public.user_activities FOR SELECT
  USING ((select auth.uid()) = user_id);
