# Debug Instructions: Shield Icon Not Appearing

## What I've Done

I've added detailed console logging to track exactly why the shield icon isn't appearing. Here's what I added:

### 1. In `useSiteMaster` Hook
- Logs when the user object changes
- Logs the sitemaster role check query result
- Logs any errors from Supabase

### 2. In `App.tsx`
- Logs the shield icon status whenever it changes
- Shows whether the user is logged in and if `isSiteMaster` is true

## How to Debug

1. **Open your application in the browser**
2. **Open Browser Console** (F12 or right-click → Inspect → Console tab)
3. **Login with credentials:**
   - Username: `sitemaster`
   - Password: `keystone`

4. **Watch the console output** - You should see logs like:
   ```
   [useSiteMaster] User changed: { hasUser: true, userId: "...", username: "sitemaster", ... }
   Sitemaster role check result: { userId: "...", data: {...}, isSiteMaster: true }
   [App] Shield Icon Status: { hasUser: true, username: "sitemaster", isSiteMaster: true, shouldShowShield: true }
   ```

## What to Look For

### If you see: "Supabase client not initialized"
**Problem:** Environment variables not loaded
**Solution:**
- Check that `.env` file exists in project root
- Restart the dev server
- Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### If you see: "Error checking sitemaster role: ..."
**Problem:** Database query failing
**Solution:** Share the complete error message with me

### If you see: `isSiteMaster: false` after login
**Problem:** Role not found in database
**Solution:** This means the database query returned no results. We need to verify:
1. User ID from login matches the profile ID
2. The role exists in `user_admin_roles` table

### If you DON'T see any logs
**Problem:** Code not executing
**Solution:**
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Make sure you're looking at the right console tab

## What Information I Need

Please copy and paste ALL console logs that appear when you:
1. Load the page
2. Login with sitemaster/keystone
3. After login completes

Share the complete console output with me so I can see exactly what's happening.

## My Mistake

You were right to question my 100% confidence. I was verifying the database and code logic, but I didn't actually test the runtime execution. The console logs will show us the real issue.

## Expected vs Actual

**Expected behavior:**
1. User logs in as `sitemaster`
2. `useAuth` sets the user object with the correct ID
3. `useSiteMaster` queries the database with that ID
4. Database returns the sitemaster role
5. `isSiteMaster` becomes `true`
6. Shield icon renders

**Actual behavior:**
Step ? is failing - that's what we need to find out from the console logs.
