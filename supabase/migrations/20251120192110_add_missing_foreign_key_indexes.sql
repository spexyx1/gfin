/*
  # Add Missing Foreign Key Indexes

  1. Performance Optimization
    - Adds indexes for all unindexed foreign keys to improve query performance
    - Foreign keys without indexes can cause table scans on JOIN operations

  2. Tables Updated
    - offramper_accounts: application_id, suspended_by
    - offramper_applications: reviewed_by
    - offramper_invites: invited_by
    - offramper_kyc_documents: application_id, verified_by
    - suspension_overrides: overridden_by, user_id
    - transaction_reputation_history: moderator_id

  3. Notes
    - All indexes use IF NOT EXISTS to prevent errors on re-run
    - Indexes follow naming convention: idx_<table>_<column>
*/

-- offramper_accounts foreign key indexes
CREATE INDEX IF NOT EXISTS idx_offramper_accounts_application_id
  ON public.offramper_accounts(application_id);

CREATE INDEX IF NOT EXISTS idx_offramper_accounts_suspended_by
  ON public.offramper_accounts(suspended_by);

-- offramper_applications foreign key indexes
CREATE INDEX IF NOT EXISTS idx_offramper_applications_reviewed_by
  ON public.offramper_applications(reviewed_by);

-- offramper_invites foreign key indexes
CREATE INDEX IF NOT EXISTS idx_offramper_invites_invited_by
  ON public.offramper_invites(invited_by);

-- offramper_kyc_documents foreign key indexes
CREATE INDEX IF NOT EXISTS idx_offramper_kyc_documents_application_id
  ON public.offramper_kyc_documents(application_id);

CREATE INDEX IF NOT EXISTS idx_offramper_kyc_documents_verified_by
  ON public.offramper_kyc_documents(verified_by);

-- suspension_overrides foreign key indexes
CREATE INDEX IF NOT EXISTS idx_suspension_overrides_overridden_by
  ON public.suspension_overrides(overridden_by);

CREATE INDEX IF NOT EXISTS idx_suspension_overrides_user_id
  ON public.suspension_overrides(user_id);

-- transaction_reputation_history foreign key indexes
CREATE INDEX IF NOT EXISTS idx_transaction_reputation_history_moderator_id
  ON public.transaction_reputation_history(moderator_id);