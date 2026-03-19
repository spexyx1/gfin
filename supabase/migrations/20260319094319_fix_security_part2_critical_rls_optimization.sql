/*
  # Security Fix Part 2: Optimize Critical RLS Policies

  1. Changes
    - Fix auth.uid() calls in most critical RLS policies by wrapping in subquery
    - This prevents re-evaluation for each row and improves query performance at scale
    - Focuses on high-traffic tables: profiles, orders, messages, auctions, posts

  2. Security
    - All policies maintain the same security guarantees
    - Performance improvement only, no security changes
*/

-- profiles table
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- orders table  
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = (SELECT auth.uid()));

-- conversations table
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (participants ? (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (participants ? (SELECT auth.uid())::text)
  WITH CHECK (participants ? (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT
  TO authenticated
  USING (participants ? (SELECT auth.uid())::text);

-- messages table
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND participants ? (SELECT auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = (SELECT auth.uid()))
  WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND participants ? (SELECT auth.uid())::text
    )
  );

-- auctions table
DROP POLICY IF EXISTS "Sellers can create auctions" ON public.auctions;
CREATE POLICY "Sellers can create auctions" ON public.auctions
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Sellers can update their own auctions" ON public.auctions;
CREATE POLICY "Sellers can update their own auctions" ON public.auctions
  FOR UPDATE
  TO authenticated
  USING (seller_id = (SELECT auth.uid()))
  WITH CHECK (seller_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Sellers can delete their own draft auctions" ON public.auctions;
CREATE POLICY "Sellers can delete their own draft auctions" ON public.auctions
  FOR DELETE
  TO authenticated
  USING (seller_id = (SELECT auth.uid()) AND status = 'draft');

-- auction_bids table
DROP POLICY IF EXISTS "Authenticated users can place bids" ON public.auction_bids;
CREATE POLICY "Authenticated users can place bids" ON public.auction_bids
  FOR INSERT
  TO authenticated
  WITH CHECK (bidder_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Bidders can update their own bids" ON public.auction_bids;
CREATE POLICY "Bidders can update their own bids" ON public.auction_bids
  FOR UPDATE
  TO authenticated
  USING (bidder_id = (SELECT auth.uid()))
  WITH CHECK (bidder_id = (SELECT auth.uid()));

-- posts table
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts" ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT auth.uid()))
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE
  TO authenticated
  USING (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authors can read their own posts" ON public.posts;
CREATE POLICY "Authors can read their own posts" ON public.posts
  FOR SELECT
  TO authenticated
  USING (author_id = (SELECT auth.uid()));

-- follows table
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE
  TO authenticated
  USING (follower_id = (SELECT auth.uid()));

-- bookmarks table
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create their own bookmarks" ON public.bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can read their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can read their own bookmarks" ON public.bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- terms_acceptances table
DROP POLICY IF EXISTS "Users can accept terms" ON public.terms_acceptances;
CREATE POLICY "Users can accept terms" ON public.terms_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can read their own terms acceptances" ON public.terms_acceptances;
CREATE POLICY "Users can read their own terms acceptances" ON public.terms_acceptances
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
