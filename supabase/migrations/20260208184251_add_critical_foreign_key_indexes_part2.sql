/*
  # Add Critical Foreign Key Indexes (Part 2)

  1. Performance & Security
    - Continue adding indexes on foreign key columns
    - Focus on offramper, moderation, sponsorship, and token tables
    - Improve performance for user-related queries

  2. Changes
    - Add indexes for moderation foreign keys
    - Add indexes for offramper system foreign keys
    - Add indexes for sponsorship marketplace foreign keys
    - Add indexes for post comments and social features
    - Add indexes for token and suspension management
*/

-- Moderation
CREATE INDEX IF NOT EXISTS idx_moderation_actions_report_id
  ON moderation_actions(report_id);

-- Offramper System
CREATE INDEX IF NOT EXISTS idx_offramper_accounts_application_id
  ON offramper_accounts(application_id);

CREATE INDEX IF NOT EXISTS idx_offramper_accounts_suspended_by
  ON offramper_accounts(suspended_by);

CREATE INDEX IF NOT EXISTS idx_offramper_applications_user_id
  ON offramper_applications(user_id);

CREATE INDEX IF NOT EXISTS idx_offramper_applications_reviewed_by
  ON offramper_applications(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_offramper_invites_invited_by
  ON offramper_invites(invited_by);

CREATE INDEX IF NOT EXISTS idx_offramper_kyc_documents_application_id
  ON offramper_kyc_documents(application_id);

CREATE INDEX IF NOT EXISTS idx_offramper_kyc_documents_verified_by
  ON offramper_kyc_documents(verified_by);

CREATE INDEX IF NOT EXISTS idx_offramper_transactions_offramper_id
  ON offramper_transactions(offramper_id);

CREATE INDEX IF NOT EXISTS idx_offramper_transactions_client_id
  ON offramper_transactions(client_id);

-- Partnership Revenues
CREATE INDEX IF NOT EXISTS idx_partnership_revenues_partnership_id
  ON partnership_revenues(partnership_id);

-- Post Comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id
  ON post_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id
  ON post_comments(parent_id);

-- Sponsorship Marketplace
CREATE INDEX IF NOT EXISTS idx_sponsorship_investments_request_id
  ON sponsorship_investments(request_id);

CREATE INDEX IF NOT EXISTS idx_sponsorship_revenues_sponsorship_id
  ON sponsorship_revenues(sponsorship_id);

CREATE INDEX IF NOT EXISTS idx_sponsorship_transactions_order_id
  ON sponsorship_transactions(order_id);

-- Suspension Management
CREATE INDEX IF NOT EXISTS idx_suspension_overrides_user_id
  ON suspension_overrides(user_id);

CREATE INDEX IF NOT EXISTS idx_suspension_overrides_overridden_by
  ON suspension_overrides(overridden_by);

-- Token Management
CREATE INDEX IF NOT EXISTS idx_token_holders_user_id
  ON token_holders(user_id);

CREATE INDEX IF NOT EXISTS idx_swap_gas_subsidies_swap_id
  ON swap_gas_subsidies(swap_id);

-- Transaction Reputation History
CREATE INDEX IF NOT EXISTS idx_transaction_reputation_history_user_id
  ON transaction_reputation_history(user_id);

CREATE INDEX IF NOT EXISTS idx_transaction_reputation_history_moderator_id
  ON transaction_reputation_history(moderator_id);