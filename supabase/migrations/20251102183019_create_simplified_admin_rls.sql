/*
  # Simplified Admin RLS Policies

  Creates RLS policies for admin tables working with existing structures.
*/

-- Admin Roles Policies
DROP POLICY IF EXISTS "Admin roles viewable by authenticated" ON admin_roles;
CREATE POLICY "Admin roles viewable by authenticated"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Sitemaster manages user roles" ON user_admin_roles;
CREATE POLICY "Sitemaster manages user roles"
  ON user_admin_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles uar
      WHERE uar.user_id = auth.uid()
      AND uar.role_type = 'sitemaster'
      AND uar.active = true
    )
  );

DROP POLICY IF EXISTS "Users view own admin roles" ON user_admin_roles;
CREATE POLICY "Users view own admin roles"
  ON user_admin_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Treasurer Policies
DROP POLICY IF EXISTS "Treasurer manages token operations" ON ghetto_token_operations;
CREATE POLICY "Treasurer manages token operations"
  ON ghetto_token_operations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'treasurer'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Treasurer manages wallet blacklist" ON wallet_blacklist;
CREATE POLICY "Treasurer manages wallet blacklist"
  ON wallet_blacklist FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'treasurer'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Treasurer manages token blacklist" ON token_blacklist;
CREATE POLICY "Treasurer manages token blacklist"
  ON token_blacklist FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'treasurer'
      AND active = true
    )
  );

-- Mediator Policies
DROP POLICY IF EXISTS "Mediators view all cases" ON dispute_cases;
CREATE POLICY "Mediators view all cases"
  ON dispute_cases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type IN ('mediator', 'sub_moderator')
      AND active = true
    )
    OR plaintiff_id = auth.uid()
    OR defendant_id = auth.uid()
  );

DROP POLICY IF EXISTS "Mediators manage cases" ON dispute_cases;
CREATE POLICY "Mediators manage cases"
  ON dispute_cases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'mediator'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Case parties view evidence" ON case_evidence;
CREATE POLICY "Case parties view evidence"
  ON case_evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dispute_cases dc
      WHERE dc.id = case_id
      AND (
        dc.plaintiff_id = auth.uid()
        OR dc.defendant_id = auth.uid()
        OR dc.mediator_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type IN ('mediator', 'sub_moderator')
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Case parties submit evidence" ON case_evidence;
CREATE POLICY "Case parties submit evidence"
  ON case_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM dispute_cases dc
      WHERE dc.id = case_id
      AND (dc.plaintiff_id = auth.uid() OR dc.defendant_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Case parties view comments" ON case_comments;
CREATE POLICY "Case parties view comments"
  ON case_comments FOR SELECT
  TO authenticated
  USING (
    (NOT is_internal AND EXISTS (
      SELECT 1 FROM dispute_cases dc
      WHERE dc.id = case_id
      AND (dc.plaintiff_id = auth.uid() OR dc.defendant_id = auth.uid())
    ))
    OR EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type IN ('mediator', 'sub_moderator')
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Users comment on their cases" ON case_comments;
CREATE POLICY "Users comment on their cases"
  ON case_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM dispute_cases dc
      WHERE dc.id = case_id
      AND (dc.plaintiff_id = auth.uid() OR dc.defendant_id = auth.uid() OR dc.mediator_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Case parties appeal" ON case_appeals;
CREATE POLICY "Case parties appeal"
  ON case_appeals FOR INSERT
  TO authenticated
  WITH CHECK (
    appealed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM dispute_cases dc
      WHERE dc.id = case_id
      AND (dc.plaintiff_id = auth.uid() OR dc.defendant_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Mediators view appeals" ON case_appeals;
CREATE POLICY "Mediators view appeals"
  ON case_appeals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'mediator'
      AND active = true
    )
    OR appealed_by = auth.uid()
  );

DROP POLICY IF EXISTS "Mediators assign moderators" ON moderator_assignments;
CREATE POLICY "Mediators assign moderators"
  ON moderator_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'mediator'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Users view own reputation" ON user_reputation;
CREATE POLICY "Users view own reputation"
  ON user_reputation FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type IN ('mediator', 'sitemaster')
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Mediators update reputation" ON user_reputation;
CREATE POLICY "Mediators update reputation"
  ON user_reputation FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type IN ('mediator', 'sitemaster')
      AND active = true
    )
  );

-- Sitemaster Policies
DROP POLICY IF EXISTS "Admins manage user flags" ON user_flags;
CREATE POLICY "Admins manage user flags"
  ON user_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type IN ('sitemaster', 'mediator')
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Sitemaster views content moderation" ON content_moderation;
CREATE POLICY "Sitemaster views content moderation"
  ON content_moderation FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'sitemaster'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Sitemaster moderates content" ON content_moderation;
CREATE POLICY "Sitemaster moderates content"
  ON content_moderation FOR INSERT
  TO authenticated
  WITH CHECK (
    moderator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'sitemaster'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Sitemaster views activity logs" ON activity_logs;
CREATE POLICY "Sitemaster views activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'sitemaster'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "System logs activities" ON activity_logs;
CREATE POLICY "System logs activities"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Sitemaster manages suspensions" ON user_suspensions;
CREATE POLICY "Sitemaster manages suspensions"
  ON user_suspensions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type = 'sitemaster'
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Users view their suspensions" ON user_suspensions;
CREATE POLICY "Users view their suspensions"
  ON user_suspensions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins send messages" ON admin_messages;
CREATE POLICY "Admins send messages"
  ON admin_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_id = auth.uid()
      AND role_type IN ('sitemaster', 'mediator', 'treasurer')
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Users view admin messages" ON admin_messages;
CREATE POLICY "Users view admin messages"
  ON admin_messages FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid() OR sender_id = auth.uid());

DROP POLICY IF EXISTS "Users mark messages read" ON admin_messages;
CREATE POLICY "Users mark messages read"
  ON admin_messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());
