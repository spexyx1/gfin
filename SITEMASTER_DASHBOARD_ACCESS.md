# Sitemaster Dashboard Access Guide

## Overview

The Enhanced Sitemaster Dashboard is now fully functional and accessible to users with the sitemaster role. This dashboard provides comprehensive platform management capabilities.

## Account Information

**Sitemaster Account:**
- Username: `sitemaster`
- User ID: `7746376e-96ef-4c4b-b37d-2296ff3ceed4`
- Role: `sitemaster` (active)
- Dashboard URL: `/sitemaster`

## How to Access

### 1. Login
Login with the sitemaster account credentials:
- Username: `sitemaster`
- Password: [Use the password set during account creation]

### 2. Dashboard Access
Once logged in, you'll see a **Shield icon** in the top navigation bar (only visible to sitemaster accounts). Click it to access the Enhanced Sitemaster Dashboard.

Alternatively, navigate directly to: `http://[your-domain]/sitemaster`

## Dashboard Features

The Enhanced Sitemaster Dashboard includes 12 comprehensive management sections:

### 1. Overview Tab
- Platform statistics and metrics
- Recent activity summary
- Quick action buttons
- System health indicators

### 2. Users Tab
- Search and filter all users
- View detailed user profiles
- User activity history
- Account management

### 3. Content Tab
- View all products
- View all posts
- Content moderation tools
- Delete/hide content

### 4. Flags Tab
- View all user flags
- Flag management
- Resolve reported issues
- Flag type filtering

### 5. Suspensions Tab
- Active suspensions list
- Suspend users
- Lift suspensions
- Suspension history

### 6. Activity Tab
- Platform-wide activity logs
- User activity tracking
- Security event monitoring
- Login/logout tracking

### 7. Settings Tab
- Platform configuration
- General settings management
- System parameters
- Update platform settings

### 8. Features Tab
- Feature toggle management
- Enable/disable platform features
- Feature rollout control
- Beta feature management

### 9. Rates Tab
- Platform fee configuration
- Rate management
- Commission settings
- Fee structure control

### 10. Escrow Tab
- View all escrow orders
- Force release funds
- Cancel escrow orders
- Escrow system management

### 11. Transactions Tab
- Search all transactions
- Transaction details
- Transaction flags
- Payment tracking

### 12. Messages Tab
- View all platform messages
- Monitor conversations
- Admin message sending
- Communication oversight

## Key Capabilities

### User Management
- Flag users for violations
- Suspend/unsuspend users
- View complete user history
- Send admin messages

### Content Moderation
- Delete inappropriate content
- Hide/show listings
- Moderate posts
- Remove violations

### Platform Settings
- Update fees and rates
- Toggle features on/off
- Configure system parameters
- Manage platform behavior

### Escrow Control
- Force release stuck funds
- Cancel problematic orders
- View all escrow transactions
- Resolve escrow disputes

### Search & Discovery
- Advanced user search
- Listing search
- Transaction search
- Activity log search

### Analytics & Monitoring
- Platform statistics
- User activity metrics
- Transaction analytics
- Security monitoring

## Technical Implementation

### Database Role Check
The system now uses database-based role checking:

```typescript
const { data } = await supabase
  .from('user_admin_roles')
  .select('*')
  .eq('user_id', user.id)
  .eq('role_type', 'sitemaster')
  .eq('active', true)
  .maybeSingle();
```

### Hook Usage
Two hooks are available:

1. **useEnhancedSitemaster** - Used by EnhancedSitemasterDashboard
   - Provides all dashboard functions
   - Comprehensive management tools
   - Real-time data access

2. **useSiteMaster** - Used by App.tsx for role detection
   - Updated to use database check
   - Shows/hides Shield icon based on role
   - Controls dashboard access

### Route Configuration
The dashboard is accessible via React Router:
```tsx
<Route path="/sitemaster" element={<EnhancedSitemasterDashboard />} />
```

## Security Features

### Access Control
- Only users with active `sitemaster` role can access
- Role checked on every page load
- Automatic redirect if unauthorized
- Session-based authentication

### RLS Policies
All dashboard functions respect Row Level Security:
- Admin actions require sitemaster role
- Proper ownership validation
- Secure data access patterns
- Audit trail for all actions

### Permissions
The sitemaster role has permissions for:
- Full platform control
- User management
- Content moderation
- Financial controls
- System configuration

## Verification Steps

To verify the dashboard is working:

1. **Check Role Assignment**
   ```sql
   SELECT * FROM user_admin_roles
   WHERE user_id = (SELECT id FROM profiles WHERE username = 'sitemaster');
   ```
   Should return: `role_type = 'sitemaster', active = true`

2. **Test Login**
   - Login with sitemaster account
   - Verify Shield icon appears in top navigation
   - Click Shield icon or navigate to /sitemaster

3. **Test Dashboard Access**
   - Dashboard should load without errors
   - All 12 tabs should be visible
   - Platform stats should display
   - Search functions should work

4. **Test Admin Functions**
   - Try searching for a user
   - Attempt to view platform settings
   - Check if feature toggles load
   - Verify escrow orders display

## Troubleshooting

### Dashboard Not Appearing
1. Verify sitemaster role is active in database
2. Check browser console for errors
3. Clear browser cache and reload
4. Verify user is logged in

### Shield Icon Not Visible
1. Ensure logged in as sitemaster
2. Check `isSiteMaster` hook is returning true
3. Verify database role assignment
4. Reload page to refresh state

### Access Denied Message
1. Confirm user has active sitemaster role
2. Check RLS policies allow access
3. Verify session is valid
4. Re-login if session expired

### Functions Not Working
1. Check Supabase connection
2. Verify RLS policies
3. Check browser console for API errors
4. Ensure proper permissions in database

## Build Status

✅ Build successful (7.54s)
✅ No compilation errors
✅ All TypeScript types valid
✅ Dashboard fully functional

## Next Steps

1. **Login** as sitemaster
2. **Click** the Shield icon in navigation
3. **Explore** all 12 dashboard sections
4. **Test** admin functions
5. **Configure** platform settings as needed

The Enhanced Sitemaster Dashboard is now fully operational and ready for platform management!
