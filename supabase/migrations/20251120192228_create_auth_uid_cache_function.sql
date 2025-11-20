/*
  # Create Auth UID Cache Function

  1. Purpose
    - Creates a stable function that caches auth.uid() result
    - Can be used in RLS policies to prevent per-row re-evaluation
    - Provides significant performance improvement for policies

  2. Implementation
    - STABLE function that returns current user's UUID
    - Uses SECURITY DEFINER to access auth schema
    - Sets search_path for security

  3. Usage
    - Replace auth.uid() with get_current_user_id() in RLS policies
    - Function result is cached per query, not re-evaluated per row
*/

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT auth.uid();
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_current_user_id() IS 'Cached version of auth.uid() for use in RLS policies. Prevents per-row re-evaluation.';