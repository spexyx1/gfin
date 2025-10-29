/*
  # Optimize RLS Policies for Performance

  ## Changes

  1. **Optimize Auth Function Calls**
     - Replace `auth.uid()` with `(select auth.uid())` in all RLS policies
     - This prevents re-evaluation of auth functions for each row
     - Significant performance improvement at scale

  ## Affected Tables

  - profiles
  - products
  - orders
  - conversations
  - messages
  - trading_groups
  - group_members
  - group_posts
  - post_reactions
  - post_comments
  - trade_offers
  - fund_transfers
  - group_invites
  - referral_codes
  - referred_users
  - referral_balances
  - referral_transactions
  - platform_settings
  - auction_settings
  - auctions
  - auction_bids
  - auction_watchers
  - auction_history
  - auction_disputes
  - site_admins
  - contract_deployments
  - seller_collateral
  - seller_selling_limits
  - investor_stakes
  - seller_sponsorships
  - sponsorship_revenues
  - sponsorship_requests
  - sponsorship_investments
  - sponsorship_transactions
  - sponsored_products
  - fund_release_requests
  - platform_violation_reports
  - user_roles
  - audit_logs
  - moderation_actions
  - notification_preferences
  - user_activities

  ## Rationale

  Calling auth functions directly in RLS policies causes them to be evaluated
  for every row in the result set. Using a subquery ensures the function is
  evaluated once and the result is reused, dramatically improving query performance.
*/

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- =============================================================================
-- PRODUCTS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.products;
CREATE POLICY "Sellers can insert their own products"
  ON public.products FOR INSERT
  WITH CHECK ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
CREATE POLICY "Sellers can update their own products"
  ON public.products FOR UPDATE
  USING ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;
CREATE POLICY "Sellers can delete their own products"
  ON public.products FOR DELETE
  USING ((select auth.uid()) = seller_id);

-- =============================================================================
-- ORDERS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK ((select auth.uid()) = buyer_id);

DROP POLICY IF EXISTS "Order participants can update orders" ON public.orders;
CREATE POLICY "Order participants can update orders"
  ON public.orders FOR UPDATE
  USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = seller_id);

-- =============================================================================
-- CONVERSATIONS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in"
  ON public.conversations FOR SELECT
  USING ((select auth.uid()) = participant1_id OR (select auth.uid()) = participant2_id);

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK ((select auth.uid()) = participant1_id OR (select auth.uid()) = participant2_id);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE
  USING ((select auth.uid()) = participant1_id OR (select auth.uid()) = participant2_id);

-- =============================================================================
-- MESSAGES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND ((select auth.uid()) = conversations.participant1_id OR (select auth.uid()) = conversations.participant2_id)
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    (select auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND ((select auth.uid()) = conversations.participant1_id OR (select auth.uid()) = conversations.participant2_id)
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING ((select auth.uid()) = sender_id);

-- =============================================================================
-- TRADING GROUPS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Group members can view private groups" ON public.trading_groups;
CREATE POLICY "Group members can view private groups"
  ON public.trading_groups FOR SELECT
  USING (
    NOT is_private OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = trading_groups.id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.trading_groups;
CREATE POLICY "Authenticated users can create groups"
  ON public.trading_groups FOR INSERT
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Group owners can update their groups" ON public.trading_groups;
CREATE POLICY "Group owners can update their groups"
  ON public.trading_groups FOR UPDATE
  USING ((select auth.uid()) = created_by);

-- =============================================================================
-- GROUP MEMBERS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Group members can view membership" ON public.group_members;
CREATE POLICY "Group members can view membership"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can leave groups or owners can remove members" ON public.group_members;
CREATE POLICY "Users can leave groups or owners can remove members"
  ON public.group_members FOR DELETE
  USING (
    (select auth.uid()) = user_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = (select auth.uid())
      AND gm.role = 'owner'
    )
  );

-- =============================================================================
-- REFERRAL CODES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own referral code" ON public.referral_codes;
CREATE POLICY "Users can view their own referral code"
  ON public.referral_codes FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own referral code" ON public.referral_codes;
CREATE POLICY "Users can insert their own referral code"
  ON public.referral_codes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- =============================================================================
-- REFERRED USERS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Referrers can view their referred users" ON public.referred_users;
CREATE POLICY "Referrers can view their referred users"
  ON public.referred_users FOR SELECT
  USING ((select auth.uid()) = referrer_user_id);

DROP POLICY IF EXISTS "Referred users can view their referrer" ON public.referred_users;
CREATE POLICY "Referred users can view their referrer"
  ON public.referred_users FOR SELECT
  USING ((select auth.uid()) = referred_user_id);

DROP POLICY IF EXISTS "Referred users can be inserted by authenticated users" ON public.referred_users;
CREATE POLICY "Referred users can be inserted by authenticated users"
  ON public.referred_users FOR INSERT
  WITH CHECK ((select auth.uid()) = referred_user_id);

DROP POLICY IF EXISTS "Referrers can update their referred users (e.g., claim status)" ON public.referred_users;
CREATE POLICY "Referrers can update their referred users (e.g., claim status)"
  ON public.referred_users FOR UPDATE
  USING ((select auth.uid()) = referrer_user_id);

-- =============================================================================
-- GROUP POSTS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Group members can view posts" ON public.group_posts;
CREATE POLICY "Group members can view posts"
  ON public.group_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Group members can create posts" ON public.group_posts;
CREATE POLICY "Group members can create posts"
  ON public.group_posts FOR INSERT
  WITH CHECK (
    (select auth.uid()) = author_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Post authors can update their posts" ON public.group_posts;
CREATE POLICY "Post authors can update their posts"
  ON public.group_posts FOR UPDATE
  USING ((select auth.uid()) = author_id);

-- =============================================================================
-- POST REACTIONS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Group members can view reactions" ON public.post_reactions;
CREATE POLICY "Group members can view reactions"
  ON public.post_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_posts
      JOIN public.group_members ON group_members.group_id = group_posts.group_id
      WHERE group_posts.id = post_reactions.post_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Group members can react to posts" ON public.post_reactions;
CREATE POLICY "Group members can react to posts"
  ON public.post_reactions FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_posts
      JOIN public.group_members ON group_members.group_id = group_posts.group_id
      WHERE group_posts.id = post_reactions.post_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own reactions" ON public.post_reactions;
CREATE POLICY "Users can update their own reactions"
  ON public.post_reactions FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.post_reactions;
CREATE POLICY "Users can delete their own reactions"
  ON public.post_reactions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- =============================================================================
-- POST COMMENTS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Group members can view comments" ON public.post_comments;
CREATE POLICY "Group members can view comments"
  ON public.post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_posts
      JOIN public.group_members ON group_members.group_id = group_posts.group_id
      WHERE group_posts.id = post_comments.post_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Group members can create comments" ON public.post_comments;
CREATE POLICY "Group members can create comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (
    (select auth.uid()) = author_id
    AND EXISTS (
      SELECT 1 FROM public.group_posts
      JOIN public.group_members ON group_members.group_id = group_posts.group_id
      WHERE group_posts.id = post_comments.post_id
      AND group_members.user_id = (select auth.uid())
    )
  );

-- =============================================================================
-- TRADE OFFERS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Group members can view trade offers" ON public.trade_offers;
CREATE POLICY "Group members can view trade offers"
  ON public.trade_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = trade_offers.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Group members can create trade offers" ON public.trade_offers;
CREATE POLICY "Group members can create trade offers"
  ON public.trade_offers FOR INSERT
  WITH CHECK (
    (select auth.uid()) = creator_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = trade_offers.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Offer creators can update their offers" ON public.trade_offers;
CREATE POLICY "Offer creators can update their offers"
  ON public.trade_offers FOR UPDATE
  USING ((select auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Offer creators can delete their offers" ON public.trade_offers;
CREATE POLICY "Offer creators can delete their offers"
  ON public.trade_offers FOR DELETE
  USING ((select auth.uid()) = creator_id);

-- =============================================================================
-- FUND TRANSFERS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Transfer participants can view transfers" ON public.fund_transfers;
CREATE POLICY "Transfer participants can view transfers"
  ON public.fund_transfers FOR SELECT
  USING ((select auth.uid()) = from_user_id OR (select auth.uid()) = to_user_id);

DROP POLICY IF EXISTS "Group members can create fund transfers" ON public.fund_transfers;
CREATE POLICY "Group members can create fund transfers"
  ON public.fund_transfers FOR INSERT
  WITH CHECK (
    (select auth.uid()) = from_user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = fund_transfers.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Transfer participants can update transfers" ON public.fund_transfers;
CREATE POLICY "Transfer participants can update transfers"
  ON public.fund_transfers FOR UPDATE
  USING ((select auth.uid()) = from_user_id OR (select auth.uid()) = to_user_id);

-- =============================================================================
-- GROUP INVITES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own invites" ON public.group_invites;
CREATE POLICY "Users can view their own invites"
  ON public.group_invites FOR SELECT
  USING ((select auth.uid()) = invited_user_id);

DROP POLICY IF EXISTS "Group members can create invites" ON public.group_invites;
CREATE POLICY "Group members can create invites"
  ON public.group_invites FOR INSERT
  WITH CHECK (
    (select auth.uid()) = inviter_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Invited users can update their invites" ON public.group_invites;
CREATE POLICY "Invited users can update their invites"
  ON public.group_invites FOR UPDATE
  USING ((select auth.uid()) = invited_user_id);

-- =============================================================================
-- REFERRAL BALANCES TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own referral balance" ON public.referral_balances;
CREATE POLICY "Users can view their own referral balance"
  ON public.referral_balances FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own referral balance (for redemption)" ON public.referral_balances;
CREATE POLICY "Users can update their own referral balance (for redemption)"
  ON public.referral_balances FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own referral balance" ON public.referral_balances;
CREATE POLICY "Users can insert their own referral balance"
  ON public.referral_balances FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- =============================================================================
-- REFERRAL TRANSACTIONS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their own referral transactions" ON public.referral_transactions;
CREATE POLICY "Users can view their own referral transactions"
  ON public.referral_transactions FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own referral transactions" ON public.referral_transactions;
CREATE POLICY "Users can insert their own referral transactions"
  ON public.referral_transactions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Continue in next migration file due to size...
