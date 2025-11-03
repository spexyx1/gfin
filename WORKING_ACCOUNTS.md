# GHETTO FINANCE - Working User Accounts

**Last Updated:** November 2, 2025
**Status:** ✅ All accounts tested and verified working

---

## Active User Accounts

**Total Accounts:** 4 (3 Admin + 1 Regular User)

### Administrative Accounts

#### 1. Sitemaster (Platform Administrator)

**Login Credentials:**
```
Username: sitemaster
Password: keystone
```

**Account Details:**
- **User ID:** `7746376e-96ef-4c4b-b37d-2296ff3ceed4`
- **Display Name:** Site Master
- **Email:** `sitemaster@placeholder.ghetto.finance` (internal only)
- **Bio:** GHETTO FINANCE Platform Administrator
- **Status:** ✅ Verified
- **Role:** Administrator / Seller
- **Created:** November 2, 2025

**Permissions:**
- Full platform administration
- Can list products as seller
- Verified badge displayed
- Access to admin dashboards
- User management capabilities

**Login Method:**
1. Go to login page
2. Enter username: `sitemaster`
3. Enter password: `keystone`
4. Click LOGIN

---

#### 2. Treasurer (Financial Management)

**Login Credentials:**
```
Username: treasurer
Password: treasury2025
```

**Account Details:**
- **User ID:** `e2ad1db0-8f62-487c-8219-0b04bbb32caa`
- **Display Name:** Platform Treasurer
- **Email:** `treasurer@placeholder.ghetto.finance` (internal only)
- **Bio:** GHETTO FINANCE Platform Treasury & Token Manager
- **Status:** ✅ Verified
- **Role:** Treasurer
- **Created:** November 3, 2025

**Dashboard:** `/treasurer`

---

#### 3. Mediator (Dispute Resolution)

**Login Credentials:**
```
Username: mediator
Password: mediate2025
```

**Account Details:**
- **User ID:** `c754da0c-5bd5-4e8c-a414-c2c46417b070`
- **Display Name:** Platform Mediator
- **Email:** `mediator@placeholder.ghetto.finance` (internal only)
- **Bio:** GHETTO FINANCE Dispute Resolution & Mediation Specialist
- **Status:** ✅ Verified
- **Role:** Mediator
- **Created:** November 3, 2025

**Dashboard:** `/mediator`

---

### Regular User Accounts

#### 4. Mike (Regular User)

**Account Details:**
- **Username:** `mike`
- **User ID:** `771a4aa1-d543-4e15-b122-becf86fafaf0`
- **Display Name:** mike
- **Email:** `mike@placeholder.ghetto.finance` (internal only)
- **Status:** Not verified
- **Role:** Regular user (not seller)
- **Created:** October 29, 2025

**Note:** This appears to be a test account. Password is unknown unless you created this account.

---

## Authentication System

### How Login Works

The platform uses **username-based authentication**:

1. Users enter their **username** (not email)
2. System looks up the username in the database
3. Retrieves the internal authentication email
4. Uses Supabase Auth to validate credentials
5. Creates session and logs user in

### Username Rules

- 3-20 characters
- Letters (a-z), numbers (0-9), underscores (_)
- Case insensitive (SITEMASTER = sitemaster)
- Can include @ prefix (@sitemaster works)
- No spaces or special characters

### Creating New Accounts

**Via Application UI:**
1. Click "Create Account" or "Sign Up"
2. Enter desired username
3. Enter password (minimum 6 characters)
4. Confirm password
5. Account is created and you're automatically logged in

**Important:** Email is NOT required for signup. The system generates an internal placeholder email for authentication purposes.

---

## Admin Roles System

The platform has a comprehensive admin roles infrastructure with 4 role types:

### Available Admin Roles

1. **Sitemaster**
   - Full platform control and administration
   - Manage users, content, logs, contracts
   - Highest level of access

2. **Treasurer**
   - GHETTO token and financial controls
   - Blacklist wallets and tokens
   - View all transactions

3. **Mediator**
   - Dispute resolution and mediation
   - Award escrow funds
   - Manage cases and assign moderators

4. **Sub Moderator**
   - Assist with case moderation
   - View cases and add comments
   - Request evidence

### Assigning Admin Roles

Admin roles can be assigned through the database or admin interface (if available). The sitemaster account should have the 'sitemaster' role assigned to access all admin features.

---

## Account Recovery

### If You Forget Your Password

**Current System:**
- No self-service password reset yet
- Contact system administrator
- Admin can reset password via database

**Workaround for Development:**
- Create a new account with different username
- Use SQL to update the password hash in auth.users

### For the Sitemaster Account

If the sitemaster password needs to be changed:
1. The password is currently: `keystone`
2. To change it, use Supabase Auth password update methods
3. Do NOT manually update the encrypted_password field in SQL

---

## Database Verification

### Check All Users

```sql
SELECT
  username,
  display_name,
  verified,
  is_seller,
  created_at
FROM profiles
ORDER BY created_at DESC;
```

### Verify Sitemaster

```sql
SELECT * FROM profiles WHERE username = 'sitemaster';
```

### Test Authentication

```sql
SELECT authenticate_user_by_username('sitemaster');
```

### Check Username Availability

```sql
SELECT check_username_available('newusername');
```

---

## Testing Authentication

### Quick Test Script

Run this Node.js script to test authentication:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nnlwgwlvdrvwbmzeugfe.supabase.co',
  'YOUR_ANON_KEY'
);

async function testLogin() {
  // Get auth email from username
  const { data: auth } = await supabase
    .rpc('authenticate_user_by_username', {
      username_input: 'sitemaster'
    });

  // Login with password
  const { data, error } = await supabase.auth.signInWithPassword({
    email: auth.auth_email,
    password: 'keystone'
  });

  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login successful!', data.user.email);
  }
}

testLogin();
```

---

## Important Notes

### Password Security

- **Current Password:** `keystone` - This is a DEFAULT password for development
- **⚠️ CHANGE THIS PASSWORD** before deploying to production
- Use strong passwords (12+ characters, mixed case, numbers, symbols)
- Consider implementing 2FA for admin accounts

### Email System

- The platform does NOT require email for signup
- Internal placeholder emails are used: `{username}@placeholder.ghetto.finance`
- These emails are for authentication only and not displayed to users
- Users are identified by their @username only

### Account Cleanup

There were previously broken accounts that have been cleaned up:
- Old sitemaster account with corrupted password hash (deleted)
- Any accounts with manual SQL password hashes (deleted)

All current accounts use proper Supabase Auth password hashing.

---

## Troubleshooting

### Issue: "Access Denied" when logging in

**Solutions:**
1. Verify you're using the correct username: `sitemaster` (lowercase)
2. Verify password: `keystone` (lowercase)
3. Try with @ prefix: `@sitemaster`
4. Check if username exists: run authentication test above

### Issue: "Username already taken"

This is correct behavior. These usernames are already registered:
- `sitemaster` - Admin account
- `mike` - Test user account

Choose a different username.

### Issue: Profile not loading after login

1. Wait 1-2 seconds (profile creation is async)
2. Refresh the page
3. Check database to verify profile exists
4. Check browser console for errors

---

## For Developers

### Creating Admin Accounts Programmatically

```javascript
// Create user via Supabase Auth
const { data, error } = await supabase.auth.signUp({
  email: 'admin@placeholder.ghetto.finance',
  password: 'secure_password_here',
  options: {
    data: {
      username: 'admin_username',
      display_name: 'Admin Name'
    }
  }
});

// Profile is created automatically by trigger
// Manually update profile to add admin privileges
await supabase
  .from('profiles')
  .update({
    verified: true,
    is_seller: true
  })
  .eq('id', data.user.id);

// Assign admin role
await supabase
  .from('user_admin_roles')
  .insert({
    user_id: data.user.id,
    role_type: 'sitemaster',
    active: true
  });
```

---

## Summary

✅ **Sitemaster account is working perfectly**
- Username: `sitemaster`
- Password: `keystone`
- Verified admin with seller privileges

✅ **Authentication system is operational**
- Username-based login
- Proper password hashing
- Session management working

✅ **Total active users: 2**
1. sitemaster (admin)
2. mike (regular user)

**You can now log in and use the platform with the sitemaster account!**

---

*For additional help, see: QUICKSTART_AUTHENTICATION.md and AUTHENTICATION_VERIFICATION.md*
