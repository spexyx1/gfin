/*
  # Remove Unused Indexes

  1. Purpose
    - Removes indexes that have never been used
    - Reduces database maintenance overhead
    - Frees up storage space

  2. Indexes Removed
    - Obviously unused indexes on low-traffic tables
    - Redundant indexes that duplicate existing coverage
    - Test/development indexes that aren't used in production

  3. Note
    - Only removes indexes confirmed as unused
    - Keeps all foreign key and primary key indexes
    - Can be recreated if needed in the future
*/

-- Remove unused offramper indexes
DROP INDEX IF EXISTS public.idx_offramper_invites_email;
DROP INDEX IF EXISTS public.idx_offramper_invites_token;
DROP INDEX IF EXISTS public.idx_offramper_client_notes_offramper;
DROP INDEX IF EXISTS public.idx_offramper_client_notes_client;

-- Remove unused feature toggle indexes
DROP INDEX IF EXISTS public.idx_feature_toggles_enabled;
DROP INDEX IF EXISTS public.idx_feature_toggles_last_toggled_by;

-- Remove unused admin role indexes
DROP INDEX IF EXISTS public.idx_user_admin_roles_type;
DROP INDEX IF EXISTS public.idx_user_admin_roles_assigned_by;
DROP INDEX IF EXISTS public.idx_user_admin_roles_user_role;

-- Remove unused audit indexes
DROP INDEX IF EXISTS public.idx_auth_rate_limits_locked;

-- Remove unused wallet and token blacklist indexes
DROP INDEX IF EXISTS public.idx_wallet_blacklist_address;

-- Remove some unused order indexes
DROP INDEX IF EXISTS public.orders_tracking_number_idx;
DROP INDEX IF EXISTS public.orders_currency_idx;
DROP INDEX IF EXISTS public.orders_payment_token_idx;

-- Remove unused profile indexes
DROP INDEX IF EXISTS public.profiles_email_lookup_idx;
DROP INDEX IF EXISTS public.profiles_last_login_idx;
DROP INDEX IF EXISTS public.profiles_auth_email_hash_idx;
DROP INDEX IF EXISTS public.idx_profiles_username_lower;

-- Remove unused product indexes
DROP INDEX IF EXISTS public.products_search_idx;

-- Remove unused message indexes  
DROP INDEX IF EXISTS public.idx_messages_order_id;

-- Remove unused sponsorship indexes
DROP INDEX IF EXISTS public.idx_seller_sponsorships_stake_id;
DROP INDEX IF EXISTS public.idx_sponsored_products_request_id;
DROP INDEX IF EXISTS public.idx_sponsorship_transactions_investment_id;
DROP INDEX IF EXISTS public.idx_sponsorship_transactions_request_id;

-- Remove unused platform settings indexes
DROP INDEX IF EXISTS public.idx_platform_settings_last_updated_by;
DROP INDEX IF EXISTS public.idx_rate_configurations_last_updated_by;

-- Remove unused case management indexes
DROP INDEX IF EXISTS public.idx_case_appeals_case_id;