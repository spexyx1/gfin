/*
  # Admin Roles and Control Systems - Tables Only

  Creates all required tables for admin roles without RLS policies initially.
*/

-- Create enum types
DO $$ BEGIN
  CREATE TYPE admin_role_type AS ENUM ('sitemaster', 'treasurer', 'mediator', 'sub_moderator');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM ('open', 'investigating', 'awaiting_evidence', 'under_review', 'resolved', 'appealed', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE case_visibility AS ENUM ('public', 'parties_only', 'hidden');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE moderation_action_type AS ENUM ('flag', 'suspend', 'delete_listing', 'delete_post', 'warn', 'ban', 'restore');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE token_operation_type AS ENUM ('mint', 'burn', 'transfer', 'freeze', 'unfreeze', 'blacklist', 'whitelist');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Admin Roles
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_type admin_role_type NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_type admin_role_type NOT NULL,
  assigned_by uuid REFERENCES profiles(id),
  assigned_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  UNIQUE(user_id, role_type)
);

-- Treasurer System
CREATE TABLE IF NOT EXISTS ghetto_token_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type token_operation_type NOT NULL,
  treasurer_id uuid NOT NULL REFERENCES profiles(id),
  wallet_address text,
  token_id text,
  amount numeric,
  reason text,
  transaction_hash text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL UNIQUE,
  blacklisted_by uuid NOT NULL REFERENCES profiles(id),
  reason text NOT NULL,
  evidence jsonb DEFAULT '{}',
  blacklisted_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS token_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id text NOT NULL,
  order_id uuid,
  blacklisted_by uuid NOT NULL REFERENCES profiles(id),
  reason text NOT NULL,
  evidence jsonb DEFAULT '{}',
  blacklisted_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

-- Mediator System
CREATE TABLE IF NOT EXISTS dispute_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text NOT NULL UNIQUE,
  order_id uuid,
  plaintiff_id uuid NOT NULL REFERENCES profiles(id),
  defendant_id uuid NOT NULL REFERENCES profiles(id),
  mediator_id uuid REFERENCES profiles(id),
  status dispute_status DEFAULT 'open',
  visibility case_visibility DEFAULT 'parties_only',
  title text NOT NULL,
  description text NOT NULL,
  resolution text,
  awarded_to uuid REFERENCES profiles(id),
  escrow_amount numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS case_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES dispute_cases(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES profiles(id),
  evidence_type text NOT NULL,
  file_url text,
  description text,
  metadata jsonb DEFAULT '{}',
  visible_to text[] DEFAULT ARRAY['all'],
  submitted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES dispute_cases(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES dispute_cases(id) ON DELETE CASCADE,
  appealed_by uuid NOT NULL REFERENCES profiles(id),
  reason text NOT NULL,
  status text DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id),
  decision text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

CREATE TABLE IF NOT EXISTS moderator_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES dispute_cases(id) ON DELETE CASCADE,
  moderator_id uuid NOT NULL REFERENCES profiles(id),
  assigned_by uuid NOT NULL REFERENCES profiles(id),
  role text DEFAULT 'sub_moderator',
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(case_id, moderator_id)
);

CREATE TABLE IF NOT EXISTS user_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  reputation_score integer DEFAULT 0,
  good_behavior_count integer DEFAULT 0,
  violation_count integer DEFAULT 0,
  report_accuracy_rate numeric DEFAULT 0,
  rewards_earned numeric DEFAULT 0,
  fines_paid numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type moderation_action_type NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id),
  moderator_id uuid NOT NULL REFERENCES profiles(id),
  reason text NOT NULL,
  details jsonb DEFAULT '{}',
  reward_amount numeric DEFAULT 0,
  fine_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Sitemaster Controls
CREATE TABLE IF NOT EXISTS user_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  flagged_by uuid NOT NULL REFERENCES profiles(id),
  flag_type text NOT NULL,
  reason text NOT NULL,
  evidence jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  resolved_by uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_moderation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  action text NOT NULL,
  moderator_id uuid NOT NULL REFERENCES profiles(id),
  reason text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  activity_type text NOT NULL,
  details jsonb NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  suspended_by uuid NOT NULL REFERENCES profiles(id),
  reason text NOT NULL,
  duration_hours integer,
  expires_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES profiles(id),
  sender_id uuid NOT NULL REFERENCES profiles(id),
  subject text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'normal',
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Insert default admin roles
INSERT INTO admin_roles (role_type, permissions, description) VALUES
  ('sitemaster', '{"full_control": true, "manage_users": true, "manage_content": true, "view_logs": true, "manage_contracts": true}', 'Full platform control and administration'),
  ('treasurer', '{"manage_tokens": true, "blacklist_wallets": true, "control_ghetto": true, "view_transactions": true}', 'GHETTO token and financial controls'),
  ('mediator', '{"resolve_disputes": true, "award_escrow": true, "manage_cases": true, "assign_moderators": true}', 'Dispute resolution and mediation'),
  ('sub_moderator', '{"view_cases": true, "add_comments": true, "request_evidence": true}', 'Assist with case moderation')
ON CONFLICT (role_type) DO NOTHING;

-- Enable RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghetto_token_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_admin_roles_user ON user_admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_admin_roles_type ON user_admin_roles(role_type);
CREATE INDEX IF NOT EXISTS idx_dispute_cases_status ON dispute_cases(status);
CREATE INDEX IF NOT EXISTS idx_dispute_cases_parties ON dispute_cases(plaintiff_id, defendant_id);
CREATE INDEX IF NOT EXISTS idx_case_evidence_case ON case_evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_case ON case_comments(case_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_flags_user ON user_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_recipient ON admin_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_ghetto_operations_treasurer ON ghetto_token_operations(treasurer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_blacklist_address ON wallet_blacklist(wallet_address);
