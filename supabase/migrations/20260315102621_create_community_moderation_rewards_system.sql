/*
  # Community Moderation Rewards System

  1. New Tables
    - `prohibited_categories`
      - Defines prohibited content categories with examples and severity levels
      - Fields: id, name, description, examples, severity, legal_reference, is_active
    
    - `community_moderator_reputation`
      - Tracks reporter performance and reputation metrics
      - Fields: user_id, reports_submitted, reports_validated, false_positives, accuracy_rate, reputation_tier, total_rewards_earned
    
    - `moderation_rewards`
      - Records reward transactions for validated reports
      - Fields: id, report_id, reporter_id, amount, reward_type, validation_date, paid_date, status
    
    - `content_flags_queue`
      - Priority queue for pending moderation reports
      - Fields: id, product_id, reporter_id, prohibited_category_id, severity, evidence_urls, priority_score, status, assigned_to
    
    - `moderation_appeals`
      - Tracks appeals for removed content
      - Fields: id, product_id, seller_id, original_report_id, appeal_reason, evidence_urls, status, resolution
    
    - `auto_moderation_logs`
      - Logs from AI/automated content screening
      - Fields: id, product_id, risk_score, flagged_keywords, flagged_categories, action_taken, reviewed_by
    
    - `trusted_moderators`
      - Community members with elevated moderation privileges
      - Fields: user_id, granted_date, privileges, total_reviews, approval_rate

  2. Enhanced Tables
    - Add moderation fields to existing tables for reward tracking and auto-flagging

  3. Security
    - Enable RLS on all new tables
    - Add policies for reporters, moderators, and administrators
    - Protect sensitive moderation data while allowing transparency
*/

-- Prohibited Categories
CREATE TABLE IF NOT EXISTS prohibited_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  examples text[] DEFAULT '{}',
  severity text NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),
  legal_reference text,
  icon text DEFAULT 'ban',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Community Moderator Reputation
CREATE TABLE IF NOT EXISTS community_moderator_reputation (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  reports_submitted integer DEFAULT 0 CHECK (reports_submitted >= 0),
  reports_validated integer DEFAULT 0 CHECK (reports_validated >= 0),
  false_positives integer DEFAULT 0 CHECK (false_positives >= 0),
  accuracy_rate numeric(5,2) DEFAULT 0.00 CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
  reputation_tier text DEFAULT 'observer' CHECK (reputation_tier IN ('observer', 'guardian', 'sentinel', 'protector', 'champion')),
  total_rewards_earned numeric(20,2) DEFAULT 0 CHECK (total_rewards_earned >= 0),
  current_streak integer DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer DEFAULT 0 CHECK (longest_streak >= 0),
  last_report_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Moderation Rewards
CREATE TABLE IF NOT EXISTS moderation_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  reward_type text NOT NULL CHECK (reward_type IN ('base', 'severity_bonus', 'accuracy_bonus', 'speed_bonus', 'streak_bonus', 'first_reporter')),
  validation_date timestamptz DEFAULT now(),
  paid_date timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_rewards_reporter ON moderation_rewards(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_rewards_status ON moderation_rewards(status);

-- Content Flags Queue
CREATE TABLE IF NOT EXISTS content_flags_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prohibited_category_id uuid REFERENCES prohibited_categories(id),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reason text NOT NULL,
  evidence_urls text[] DEFAULT '{}',
  priority_score integer DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'validated', 'rejected', 'appealed')),
  assigned_to uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  reviewer_notes text,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_flags_queue_product ON content_flags_queue(product_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_queue_reporter ON content_flags_queue(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_queue_status ON content_flags_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_flags_queue_priority ON content_flags_queue(priority_score DESC);

-- Moderation Appeals
CREATE TABLE IF NOT EXISTS moderation_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_report_id uuid NOT NULL REFERENCES content_flags_queue(id),
  appeal_reason text NOT NULL,
  evidence_urls text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'upheld', 'overturned', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_appeals_product ON moderation_appeals(product_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_seller ON moderation_appeals(seller_id);
CREATE INDEX IF NOT EXISTS idx_moderation_appeals_status ON moderation_appeals(status);

-- Auto Moderation Logs
CREATE TABLE IF NOT EXISTS auto_moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  risk_score integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  flagged_keywords text[] DEFAULT '{}',
  flagged_categories text[] DEFAULT '{}',
  action_taken text NOT NULL CHECK (action_taken IN ('none', 'flagged', 'held_review', 'auto_removed')),
  reviewed_by uuid REFERENCES profiles(id),
  review_outcome text CHECK (review_outcome IN ('approved', 'removed', 'requires_verification')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_auto_moderation_logs_product ON auto_moderation_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_auto_moderation_logs_risk_score ON auto_moderation_logs(risk_score DESC);

-- Trusted Moderators
CREATE TABLE IF NOT EXISTS trusted_moderators (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  granted_date timestamptz DEFAULT now(),
  granted_by uuid REFERENCES profiles(id),
  privileges text[] DEFAULT '{"review_reports", "approve_content"}',
  total_reviews integer DEFAULT 0 CHECK (total_reviews >= 0),
  approval_rate numeric(5,2) DEFAULT 0.00 CHECK (approval_rate >= 0 AND approval_rate <= 100),
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add moderation fields to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'auto_flagged'
  ) THEN
    ALTER TABLE products ADD COLUMN auto_flagged boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'ai_risk_score'
  ) THEN
    ALTER TABLE products ADD COLUMN ai_risk_score integer DEFAULT 0 CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'requires_manual_review'
  ) THEN
    ALTER TABLE products ADD COLUMN requires_manual_review boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'community_verified'
  ) THEN
    ALTER TABLE products ADD COLUMN community_verified boolean DEFAULT false;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE prohibited_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_moderator_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_flags_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_moderators ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Prohibited Categories (public read)
CREATE POLICY "Anyone can view active prohibited categories"
  ON prohibited_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage prohibited categories"
  ON prohibited_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type = 'sitemaster'
      AND user_admin_roles.active = true
    )
  );

-- RLS Policies: Community Moderator Reputation
CREATE POLICY "Users can view own reputation"
  ON community_moderator_reputation FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public can view reputation leaderboard"
  ON community_moderator_reputation FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can update reputation"
  ON community_moderator_reputation FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type IN ('sitemaster', 'mediator')
      AND user_admin_roles.active = true
    )
  );

-- RLS Policies: Moderation Rewards
CREATE POLICY "Users can view own rewards"
  ON moderation_rewards FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "Admins can manage rewards"
  ON moderation_rewards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type IN ('sitemaster', 'treasurer')
      AND user_admin_roles.active = true
    )
  );

-- RLS Policies: Content Flags Queue
CREATE POLICY "Users can submit reports"
  ON content_flags_queue FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports"
  ON content_flags_queue FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "Moderators can view all reports"
  ON content_flags_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type IN ('sitemaster', 'mediator')
      AND user_admin_roles.active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM trusted_moderators
      WHERE trusted_moderators.user_id = auth.uid()
      AND trusted_moderators.is_active = true
    )
  );

CREATE POLICY "Moderators can update reports"
  ON content_flags_queue FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type IN ('sitemaster', 'mediator')
      AND user_admin_roles.active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM trusted_moderators
      WHERE trusted_moderators.user_id = auth.uid()
      AND trusted_moderators.is_active = true
    )
  );

-- RLS Policies: Moderation Appeals
CREATE POLICY "Sellers can submit appeals for own products"
  ON moderation_appeals FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can view own appeals"
  ON moderation_appeals FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Moderators can view and manage appeals"
  ON moderation_appeals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type IN ('sitemaster', 'mediator')
      AND user_admin_roles.active = true
    )
  );

-- RLS Policies: Auto Moderation Logs
CREATE POLICY "Moderators can view auto moderation logs"
  ON auto_moderation_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type IN ('sitemaster', 'mediator')
      AND user_admin_roles.active = true
    )
  );

CREATE POLICY "System can create auto moderation logs"
  ON auto_moderation_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies: Trusted Moderators
CREATE POLICY "Users can view if they are trusted moderators"
  ON trusted_moderators FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage trusted moderators"
  ON trusted_moderators FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_admin_roles
      WHERE user_admin_roles.user_id = auth.uid()
      AND user_admin_roles.role_type = 'sitemaster'
      AND user_admin_roles.active = true
    )
  );

-- Insert default prohibited categories
INSERT INTO prohibited_categories (name, description, examples, severity, legal_reference, icon) VALUES
  ('Illegal Drugs & Narcotics', 'All controlled substances, illegal drugs, drug paraphernalia, and substances marketed as legal alternatives to illegal drugs', ARRAY['marijuana', 'cocaine', 'heroin', 'methamphetamine', 'synthetic drugs', 'prescription drugs without prescription', 'drug paraphernalia'], 'critical', '21 USC 841 - Controlled Substances Act', 'pill'),
  ('Weapons & Explosives', 'Firearms, ammunition, explosives, and weapon accessories without proper licensing', ARRAY['guns', 'firearms', 'ammunition', 'explosives', 'bomb-making materials', 'silencers', 'weapon parts'], 'critical', '18 USC 921 - Federal Firearms Act', 'bomb'),
  ('Stolen Goods', 'Items obtained through theft, burglary, or other illegal means', ARRAY['stolen electronics', 'stolen vehicles', 'stolen jewelry', 'items without proof of ownership'], 'severe', '18 USC 2315 - Transportation of Stolen Goods', 'alert-triangle'),
  ('Adult Services & Content', 'Sexual services, escort services, and adult content', ARRAY['escort services', 'prostitution', 'adult videos', 'explicit content'], 'severe', 'Various state and federal laws', 'user-x'),
  ('Hacking Tools & Services', 'Hacking services, malware, stolen credentials, and unauthorized access tools', ARRAY['hacking services', 'malware', 'stolen accounts', 'credit card data', 'personal information databases'], 'critical', '18 USC 1030 - Computer Fraud and Abuse Act', 'skull'),
  ('Crime for Hire', 'Services offering to commit crimes including violence, fraud, or illegal activities', ARRAY['hitman services', 'ddos attacks', 'fraud services', 'fake documents'], 'critical', '18 USC 1952 - Interstate commerce in aid of racketeering', 'user-minus'),
  ('Counterfeit Goods', 'Fake branded items, counterfeit currency, forged documents', ARRAY['fake designer bags', 'counterfeit money', 'forged IDs', 'fake certificates'], 'severe', '18 USC 2320 - Trafficking in Counterfeit Goods', 'copy'),
  ('Human Trafficking', 'Any services related to human trafficking or exploitation', ARRAY['illegal labor', 'forced services', 'exploitation'], 'critical', '18 USC 1591 - Sex Trafficking', 'users'),
  ('Endangered Species', 'Products made from endangered or protected animals and plants', ARRAY['ivory', 'exotic animals', 'protected wildlife products'], 'severe', '16 USC 1531 - Endangered Species Act', 'bird')
ON CONFLICT DO NOTHING;

-- Function to calculate priority score
CREATE OR REPLACE FUNCTION calculate_priority_score(
  p_severity text,
  p_report_count integer,
  p_reporter_accuracy numeric
)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    CASE p_severity
      WHEN 'critical' THEN 40
      WHEN 'high' THEN 30
      WHEN 'medium' THEN 20
      ELSE 10
    END +
    LEAST(p_report_count * 10, 40) +
    CASE
      WHEN p_reporter_accuracy >= 90 THEN 20
      WHEN p_reporter_accuracy >= 75 THEN 10
      ELSE 0
    END
  );
END;
$$;

-- Function to calculate reward amount
CREATE OR REPLACE FUNCTION calculate_reward_amount(
  p_severity text,
  p_reporter_accuracy numeric,
  p_is_first_reporter boolean
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  base_amount numeric;
  accuracy_multiplier numeric;
  first_reporter_bonus numeric;
BEGIN
  -- Base amount by severity
  base_amount := CASE p_severity
    WHEN 'critical' THEN 500
    WHEN 'high' THEN 100
    WHEN 'medium' THEN 25
    ELSE 5
  END;
  
  -- Accuracy multiplier
  accuracy_multiplier := CASE
    WHEN p_reporter_accuracy >= 90 THEN 1.10
    WHEN p_reporter_accuracy >= 75 THEN 1.05
    ELSE 1.00
  END;
  
  -- First reporter bonus
  first_reporter_bonus := CASE WHEN p_is_first_reporter THEN base_amount * 0.20 ELSE 0 END;
  
  RETURN (base_amount * accuracy_multiplier) + first_reporter_bonus;
END;
$$;

-- Function to update moderator reputation
CREATE OR REPLACE FUNCTION update_moderator_reputation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_accuracy numeric;
  new_tier text;
BEGIN
  -- Update reputation stats when report is validated or rejected
  IF NEW.status IN ('validated', 'rejected') AND OLD.status = 'under_review' THEN
    -- Update counts
    UPDATE community_moderator_reputation
    SET
      reports_validated = reports_validated + CASE WHEN NEW.status = 'validated' THEN 1 ELSE 0 END,
      false_positives = false_positives + CASE WHEN NEW.status = 'rejected' THEN 1 ELSE 0 END,
      last_report_date = NEW.updated_at,
      updated_at = now()
    WHERE user_id = NEW.reporter_id;
    
    -- Calculate new accuracy
    SELECT
      CASE WHEN (reports_submitted > 0)
        THEN (reports_validated::numeric / reports_submitted::numeric) * 100
        ELSE 0
      END,
      CASE
        WHEN reports_validated >= 100 AND (reports_validated::numeric / reports_submitted::numeric) >= 0.95 THEN 'champion'
        WHEN reports_validated >= 50 AND (reports_validated::numeric / reports_submitted::numeric) >= 0.90 THEN 'protector'
        WHEN reports_validated >= 25 AND (reports_validated::numeric / reports_submitted::numeric) >= 0.85 THEN 'sentinel'
        WHEN reports_validated >= 10 AND (reports_validated::numeric / reports_submitted::numeric) >= 0.75 THEN 'guardian'
        ELSE 'observer'
      END
    INTO new_accuracy, new_tier
    FROM community_moderator_reputation
    WHERE user_id = NEW.reporter_id;
    
    -- Update accuracy and tier
    UPDATE community_moderator_reputation
    SET
      accuracy_rate = COALESCE(new_accuracy, 0),
      reputation_tier = new_tier
    WHERE user_id = NEW.reporter_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update reputation
DROP TRIGGER IF EXISTS trigger_update_moderator_reputation ON content_flags_queue;
CREATE TRIGGER trigger_update_moderator_reputation
  AFTER UPDATE ON content_flags_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_moderator_reputation();

-- Function to initialize moderator reputation
CREATE OR REPLACE FUNCTION initialize_moderator_reputation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO community_moderator_reputation (user_id, reports_submitted, updated_at)
  VALUES (NEW.reporter_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    reports_submitted = community_moderator_reputation.reports_submitted + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger to initialize reputation on first report
DROP TRIGGER IF EXISTS trigger_initialize_moderator_reputation ON content_flags_queue;
CREATE TRIGGER trigger_initialize_moderator_reputation
  AFTER INSERT ON content_flags_queue
  FOR EACH ROW
  EXECUTE FUNCTION initialize_moderator_reputation();