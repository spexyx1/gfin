/*
  # Clean Up Deprecated Authentication Functions

  1. Purpose
    - Remove old authentication functions that are no longer needed
    - Clean up after migration to new handle-based authentication system

  2. Functions Removed
    - `get_auth_email_by_user_id` - No longer needed, replaced by authenticate_user_by_handle

  3. Impact
    - No impact on current functionality
    - Old login flow has been replaced with new streamlined approach
    - All demo accounts tested and working with new system

  4. Notes
    - This is safe to run as the new authentication system is already in place
    - Frontend code has been updated to use new authentication flow
*/

-- Drop the old get_auth_email_by_user_id function
DROP FUNCTION IF EXISTS get_auth_email_by_user_id(uuid);

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Deprecated authentication functions have been removed';
  RAISE NOTICE 'New authenticate_user_by_handle function is now the standard';
END $$;
