/*
# Fix sitemaster login: return auth_email from authenticate_user_by_username

1. Problem
- The frontend login flow (`useAuth.login`) calls `authenticate_user_by_username`
  and then passes `authResult.auth_email` to `signInWithPassword`.
- The function was hardened to avoid exposing real emails and now returns
  `auth_hint` (a truncated SHA-256 hash) instead of `auth_email`.
- Result: every username login fails at the password step because the client
  sends `undefined` as the email. No successful sign-in since 2025-11-17.

2. Changes (functions only, no schema changes)
- `authenticate_user_by_username(username_input text)`:
  - Keep the existing rate limit check (`check_rate_limit`, 5 attempts / 15 min).
  - Keep the anti-enumeration delay on unknown usernames.
  - Look up the profile by lowercase username (unchanged).
  - Return `auth_email` (the user's email from `auth.users`, normally a
    `<username>@placeholder.ghetto.finance` address) alongside `success`,
    `user_id`, and `username`, so the existing frontend login works again.
  - SECURITY DEFINER with a locked search_path, exactly as before.
  - Still never returns the password or anything sensitive beyond the email
    that `signInWithPassword` requires.

3. Security
- Same grants as before: EXECUTE for anon, authenticated, service_role.
- Rate limiting and enumeration protection are preserved.

4. Notes
- Idempotent: CREATE OR REPLACE on the same signature.
- No data is modified.
*/

CREATE OR REPLACE FUNCTION public.authenticate_user_by_username(username_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  profile_record RECORD;
  rate_limit_check jsonb;
  auth_email text;
BEGIN
  rate_limit_check := check_rate_limit(username_input, 'login', 5, '15 minutes'::interval);
  IF NOT (rate_limit_check->>'allowed')::boolean THEN
    RETURN rate_limit_check;
  END IF;

  SELECT id, username INTO profile_record
  FROM profiles
  WHERE username = lower(trim(username_input))
  LIMIT 1;

  IF profile_record IS NULL THEN
    PERFORM pg_sleep(0.5);
    RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
  END IF;

  SELECT email INTO auth_email
  FROM auth.users
  WHERE id = profile_record.id;

  IF auth_email IS NULL THEN
    PERFORM pg_sleep(0.5);
    RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', profile_record.id,
    'username', profile_record.username,
    'auth_email', auth_email
  );
END;
$function$;
