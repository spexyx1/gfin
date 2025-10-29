/*
  # User Dashboard and Site Master Enhancements

  1. New Tables
    - `platform_violation_reports` - Stores reports for listings, posts, and users
    - `user_roles` - Role-based access control for site master team
    - `audit_logs` - Administrative action tracking
    - `moderation_actions` - Content moderation history
    - `notification_preferences` - User notification settings
    - `user_activities` - User activity tracking for dashboard timeline

  2. Enhancements to Existing Tables
    - Add fields to profiles for enhanced tracking
    - Add indexes for performance optimization

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users and site masters
*/

-- Platform violation reports table
CREATE TABLE IF NOT EXISTS platform_violation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_type TEXT NOT NULL CHECK (reported_type IN ('listing', 'post', 'user', 'message')),
  reported_id UUID NOT NULL,
  violation_type TEXT NOT NULL CHECK (violation_type IN ('fraud', 'scam', 'harassment', 'spam', 'inappropriate_content', 'fake_listing', 'other')),
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_violation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create violation reports"
  ON platform_violation_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON platform_violation_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Site masters can view all reports"
  ON platform_violation_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (username = 'sitemaster' OR email = 'master@ghetto.finance')
    )
  );

CREATE POLICY "Site masters can update reports"
  ON platform_violation_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (username = 'sitemaster' OR email = 'master@ghetto.finance')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (username = 'sitemaster' OR email = 'master@ghetto.finance')
    )
  );

-- User roles table for role-based access control
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('site_master', 'dispute_moderator', 'customer_support', 'integrity_manager', 'treasury_manager', 'content_moderator')),
  granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Site masters can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (username = 'sitemaster' OR email = 'master@ghetto.finance')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (username = 'sitemaster' OR email = 'master@ghetto.finance')
    )
  );

-- Audit logs for administrative actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only site masters can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (username = 'sitemaster' OR email = 'master@ghetto.finance')
    )
  );

-- Moderation actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'reject', 'remove', 'ban', 'warn', 'restore')),
  target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'post', 'user', 'comment', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  report_id UUID REFERENCES platform_violation_reports(id) ON DELETE SET NULL,
  automated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Moderators can view their actions"
  ON moderation_actions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = moderator_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (username = 'sitemaster' OR email = 'master@ghetto.finance')
    )
  );

CREATE POLICY "Moderators can create actions"
  ON moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = moderator_id AND
    (
      EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND is_active = true) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (username = 'sitemaster' OR email = 'master@ghetto.finance'))
    )
  );

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_updates BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  dispute_updates BOOLEAN DEFAULT true,
  referral_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  security_alerts BOOLEAN DEFAULT true,
  product_recommendations BOOLEAN DEFAULT true,
  price_drop_alerts BOOLEAN DEFAULT false,
  email_digest_frequency TEXT DEFAULT 'daily' CHECK (email_digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'never')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User activities table for dashboard timeline
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('order_placed', 'order_received', 'listing_created', 'listing_sold', 'message_sent', 'dispute_opened', 'dispute_resolved', 'referral_earned', 'balance_redeemed', 'profile_updated', 'review_posted', 'post_created')),
  activity_description TEXT NOT NULL,
  related_type TEXT,
  related_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
  ON user_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create activities"
  ON user_activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_violation_reports_status ON platform_violation_reports(status);
CREATE INDEX IF NOT EXISTS idx_violation_reports_priority ON platform_violation_reports(priority);
CREATE INDEX IF NOT EXISTS idx_violation_reports_created ON platform_violation_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at DESC);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action_type TEXT,
  p_action_description TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action_type,
    action_description,
    target_type,
    target_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    p_user_id,
    p_action_type,
    p_action_description,
    p_target_type,
    p_target_id,
    p_old_values,
    p_new_values,
    p_metadata
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user activity
CREATE OR REPLACE FUNCTION create_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_description TEXT,
  p_related_type TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO user_activities (
    user_id,
    activity_type,
    activity_description,
    related_type,
    related_id,
    metadata
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_activity_description,
    p_related_type,
    p_related_id,
    p_metadata
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_role BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
    AND role = p_role
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_has_role;
  
  RETURN v_has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is site master
CREATE OR REPLACE FUNCTION is_site_master(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_master BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = p_user_id
    AND (username = 'sitemaster' OR email = 'master@ghetto.finance')
  ) OR user_has_role(p_user_id, 'site_master') INTO v_is_master;
  
  RETURN v_is_master;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences WHERE user_id = profiles.id
)
ON CONFLICT (user_id) DO NOTHING;