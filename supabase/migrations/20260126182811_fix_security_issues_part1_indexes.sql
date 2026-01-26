/*
  # Security Fix - Part 1: Add Missing Foreign Key Indexes
  
  ## Overview
  This migration adds indexes for all unindexed foreign keys to improve query performance
  and prevent potential performance issues at scale.
  
  ## Changes
  1. **Atomic Swaps**: Add indexes for token foreign keys
  2. **Blockchain Transactions**: Add index for initiator
  3. **Case Appeals**: Add index for case_id
  4. **Feature Toggles**: Add index for last_toggled_by
  5. **Messages**: Add index for order_id
  6. **Offramper Client Notes**: Add indexes for client and offramper
  7. **Platform Settings**: Add index for last_updated_by
  8. **Project Updates**: Add index for posted_by
  9. **Rate Configurations**: Add index for last_updated_by
  10. **Seller Sponsorships**: Add index for stake_id
  11. **Sponsored Products**: Add index for request_id
  12. **Sponsorship Transactions**: Add indexes for investment and request
  13. **Supported Swap Tokens**: Add index for added_by
  14. **User Admin Roles**: Add index for assigned_by
*/

-- Atomic Swaps indexes
CREATE INDEX IF NOT EXISTS idx_atomic_swaps_initiator_token 
  ON public.atomic_swaps(initiator_token_id);

CREATE INDEX IF NOT EXISTS idx_atomic_swaps_recipient_token 
  ON public.atomic_swaps(recipient_token_id);

-- Blockchain Transactions indexes
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_initiated_by 
  ON public.blockchain_transactions(initiated_by);

-- Case Appeals indexes
CREATE INDEX IF NOT EXISTS idx_case_appeals_case_id 
  ON public.case_appeals(case_id);

-- Feature Toggles indexes
CREATE INDEX IF NOT EXISTS idx_feature_toggles_last_toggled_by 
  ON public.feature_toggles(last_toggled_by);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_order_id 
  ON public.messages(order_id);

-- Offramper Client Notes indexes
CREATE INDEX IF NOT EXISTS idx_offramper_client_notes_client_id 
  ON public.offramper_client_notes(client_id);

CREATE INDEX IF NOT EXISTS idx_offramper_client_notes_offramper_id 
  ON public.offramper_client_notes(offramper_id);

-- Platform Settings indexes
CREATE INDEX IF NOT EXISTS idx_platform_settings_last_updated_by 
  ON public.platform_settings(last_updated_by);

-- Project Updates indexes
CREATE INDEX IF NOT EXISTS idx_project_updates_posted_by 
  ON public.project_updates(posted_by);

-- Rate Configurations indexes
CREATE INDEX IF NOT EXISTS idx_rate_configurations_last_updated_by 
  ON public.rate_configurations(last_updated_by);

-- Seller Sponsorships indexes
CREATE INDEX IF NOT EXISTS idx_seller_sponsorships_stake_id 
  ON public.seller_sponsorships(stake_id);

-- Sponsored Products indexes
CREATE INDEX IF NOT EXISTS idx_sponsored_products_request_id 
  ON public.sponsored_products(request_id);

-- Sponsorship Transactions indexes
CREATE INDEX IF NOT EXISTS idx_sponsorship_transactions_investment_id 
  ON public.sponsorship_transactions(investment_id);

CREATE INDEX IF NOT EXISTS idx_sponsorship_transactions_request_id 
  ON public.sponsorship_transactions(request_id);

-- Supported Swap Tokens indexes
CREATE INDEX IF NOT EXISTS idx_supported_swap_tokens_added_by 
  ON public.supported_swap_tokens(added_by);

-- User Admin Roles indexes
CREATE INDEX IF NOT EXISTS idx_user_admin_roles_assigned_by 
  ON public.user_admin_roles(assigned_by);
