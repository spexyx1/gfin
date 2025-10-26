/*
  # Create social system tables for groups and posts

  1. New Tables
    - `trading_groups`
      - `id` (uuid, primary key)
      - `name` (text, group name)
      - `description` (text, group description)
      - `avatar` (text, avatar image URL)
      - `cover_image` (text, cover image URL)
      - `created_by` (uuid, references profiles.id)
      - `category` (text, group category)
      - `tags` (jsonb, array of tags)
      - `is_private` (boolean, privacy setting)
      - `rules` (jsonb, array of group rules)
      - `member_count` (integer, cached member count)
      - `post_count` (integer, cached post count)
      - `total_trades` (integer, total trades in group)
      - `total_volume` (numeric, total trading volume)
      - `active_members` (integer, active member count)
      - `allow_invites` (boolean, invite permissions)
      - `require_approval` (boolean, approval requirement)
      - `allow_trades` (boolean, trading permissions)
      - `allow_fund_transfers` (boolean, fund transfer permissions)
      - `max_members` (integer, maximum member limit)
      - `trading_fee_percent` (numeric, trading fee percentage)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)

    - `group_members`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references trading_groups.id)
      - `user_id` (uuid, references profiles.id)
      - `role` (text, member role: owner/admin/moderator/member)
      - `reputation` (integer, member reputation score)
      - `joined_at` (timestamptz, join timestamp)

    - `group_posts`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references trading_groups.id)
      - `author_id` (uuid, references profiles.id)
      - `content` (text, post content)
      - `post_type` (text, post type: text/trade_offer/fund_request/product_share/poll)
      - `attachments` (jsonb, post attachments)
      - `tags` (jsonb, post tags)
      - `is_pinned` (boolean, pinned status)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)

    - `post_reactions`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references group_posts.id)
      - `user_id` (uuid, references profiles.id)
      - `reaction_type` (text, reaction type: like/love/fire/rocket/diamond)
      - `created_at` (timestamptz, creation timestamp)

    - `post_comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references group_posts.id)
      - `author_id` (uuid, references profiles.id)
      - `content` (text, comment content)
      - `parent_id` (uuid, references post_comments.id for replies)
      - `created_at` (timestamptz, creation timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for group members to view and interact with content
    - Add policies for group owners/admins to manage groups
    - Add policies for post authors to manage their posts

  3. Functions
    - Create triggers to update member and post counts
    - Create function to check group membership
    - Create function to validate user permissions

  4. Indexes
    - Create indexes for better query performance
*/

-- Create trading_groups table
CREATE TABLE IF NOT EXISTS trading_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  avatar text,
  cover_image text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  tags jsonb DEFAULT '[]'::jsonb,
  is_private boolean DEFAULT false,
  rules jsonb DEFAULT '[]'::jsonb,
  member_count integer DEFAULT 1,
  post_count integer DEFAULT 0,
  total_trades integer DEFAULT 0,
  total_volume numeric DEFAULT 0,
  active_members integer DEFAULT 1,
  allow_invites boolean DEFAULT true,
  require_approval boolean DEFAULT false,
  allow_trades boolean DEFAULT true,
  allow_fund_transfers boolean DEFAULT true,
  max_members integer DEFAULT 1000,
  trading_fee_percent numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES trading_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  reputation integer DEFAULT 50,
  joined_at timestamptz DEFAULT now(),
  
  -- Ensure unique membership per group
  UNIQUE(group_id, user_id)
);

-- Create group_posts table
CREATE TABLE IF NOT EXISTS group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES trading_groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'trade_offer', 'fund_request', 'product_share', 'poll')),
  attachments jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create post_reactions table
CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire', 'rocket', 'diamond')),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure one reaction per user per post
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE trading_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Trading Groups Policies
CREATE POLICY "Public groups are viewable by everyone"
  ON trading_groups
  FOR SELECT
  USING (NOT is_private);

CREATE POLICY "Group members can view private groups"
  ON trading_groups
  FOR SELECT
  TO authenticated
  USING (
    NOT is_private OR 
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON trading_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group owners can update their groups"
  ON trading_groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Group Members Policies
CREATE POLICY "Group members can view membership"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups or owners can remove members"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Group Posts Policies
CREATE POLICY "Group members can view posts"
  ON group_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_posts.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create posts"
  ON group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_posts.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Post authors can update their posts"
  ON group_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Post Reactions Policies
CREATE POLICY "Group members can view reactions"
  ON post_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_posts gp
      JOIN group_members gm ON gp.group_id = gm.group_id
      WHERE gp.id = post_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can react to posts"
  ON post_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_posts gp
      JOIN group_members gm ON gp.group_id = gm.group_id
      WHERE gp.id = post_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reactions"
  ON post_reactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON post_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post Comments Policies
CREATE POLICY "Group members can view comments"
  ON post_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_posts gp
      JOIN group_members gm ON gp.group_id = gm.group_id
      WHERE gp.id = post_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create comments"
  ON post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM group_posts gp
      JOIN group_members gm ON gp.group_id = gm.group_id
      WHERE gp.id = post_id AND gm.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER trading_groups_updated_at
  BEFORE UPDATE ON trading_groups
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER group_posts_updated_at
  BEFORE UPDATE ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE trading_groups 
    SET member_count = member_count + 1,
        active_members = active_members + 1
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE trading_groups 
    SET member_count = GREATEST(0, member_count - 1),
        active_members = GREATEST(0, active_members - 1)
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for member count updates
CREATE TRIGGER update_group_member_count_trigger
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- Create function to update group post count
CREATE OR REPLACE FUNCTION update_group_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE trading_groups 
    SET post_count = post_count + 1
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE trading_groups 
    SET post_count = GREATEST(0, post_count - 1)
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for post count updates
CREATE TRIGGER update_group_post_count_trigger
  AFTER INSERT OR DELETE ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_group_post_count();

-- Create function to automatically add group creator as owner
CREATE OR REPLACE FUNCTION add_group_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role, reputation)
  VALUES (NEW.id, NEW.created_by, 'owner', 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add creator as owner
CREATE TRIGGER add_group_creator_as_owner_trigger
  AFTER INSERT ON trading_groups
  FOR EACH ROW
  EXECUTE FUNCTION add_group_creator_as_owner();

-- Create function to check group membership
CREATE OR REPLACE FUNCTION is_group_member(group_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_members.group_id = is_group_member.group_id 
    AND group_members.user_id = is_group_member.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's groups
CREATE OR REPLACE FUNCTION get_user_groups(user_id uuid)
RETURNS TABLE(
  group_id uuid,
  group_name text,
  group_description text,
  member_role text,
  joined_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tg.id,
    tg.name,
    tg.description,
    gm.role,
    gm.joined_at
  FROM trading_groups tg
  JOIN group_members gm ON tg.id = gm.group_id
  WHERE gm.user_id = get_user_groups.user_id
  ORDER BY gm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS trading_groups_created_by_idx ON trading_groups(created_by);
CREATE INDEX IF NOT EXISTS trading_groups_category_idx ON trading_groups(category);
CREATE INDEX IF NOT EXISTS trading_groups_is_private_idx ON trading_groups(is_private);
CREATE INDEX IF NOT EXISTS trading_groups_created_at_idx ON trading_groups(created_at);

CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members(user_id);
CREATE INDEX IF NOT EXISTS group_members_role_idx ON group_members(role);

CREATE INDEX IF NOT EXISTS group_posts_group_id_idx ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS group_posts_author_id_idx ON group_posts(author_id);
CREATE INDEX IF NOT EXISTS group_posts_created_at_idx ON group_posts(created_at);
CREATE INDEX IF NOT EXISTS group_posts_post_type_idx ON group_posts(post_type);

CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_id_idx ON post_reactions(user_id);

CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_author_id_idx ON post_comments(author_id);
CREATE INDEX IF NOT EXISTS post_comments_parent_id_idx ON post_comments(parent_id);

-- Create full-text search index for groups
CREATE INDEX IF NOT EXISTS trading_groups_search_idx ON trading_groups USING gin(to_tsvector('english', name || ' ' || description));

-- Create full-text search index for posts
CREATE INDEX IF NOT EXISTS group_posts_search_idx ON group_posts USING gin(to_tsvector('english', content));