# Create Sitemaster Account with Known Password

## Option 1: Use Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Users
3. Find user with email `sitemaster@placeholder.ghetto.finance`
4. Click the three dots menu → "Reset Password"
5. Set new password to `keystone` (or your preferred password)

## Option 2: Create New Account via App

Since the authentication system uses username-based login:

1. **Logout** if currently logged in
2. **Go to signup page**
3. **Create new account** with:
   - Username: `admin` (or any username you prefer)
   - Password: `keystone`
4. **Then run this SQL** to grant sitemaster role:

```sql
-- Grant sitemaster role to the new account
INSERT INTO user_admin_roles (user_id, role_type, active)
SELECT id, 'sitemaster', true
FROM profiles
WHERE username = 'admin'
ON CONFLICT (user_id, role_type) DO UPDATE SET active = true;
```

## Option 3: Update Existing Password via Supabase SQL

Unfortunately, Supabase Auth passwords cannot be updated via SQL directly for security reasons. You must use one of the above options.

## Current Sitemaster Account Details

- **Username**: `sitemaster`
- **Auth Email**: `sitemaster@placeholder.ghetto.finance`
- **User ID**: `7746376e-96ef-4c4b-b37d-2296ff3ceed4`
- **Role**: sitemaster (active)
- **Created**: November 2, 2025

## Verification After Password Reset

Once you've reset the password, test login:

1. Navigate to your app
2. Click "Login"
3. Enter:
   - Username: `sitemaster`
   - Password: `keystone` (or whatever you set)
4. After login, the Shield icon should appear in the navigation
5. Click Shield icon to access dashboard

## Alternative: Use Supabase CLI

If you have the Supabase CLI installed and linked to your project:

```bash
# Reset user password
supabase auth update-user sitemaster@placeholder.ghetto.finance --password keystone
```

## Support

The account exists and has the correct role assigned. The only issue is password access. Once you reset it via any of the above methods, you'll have full dashboard access.
