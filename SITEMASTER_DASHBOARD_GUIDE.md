# GHETTO FINANCE - Sitemaster Dashboard Guide

**Complete Platform Control and Administration**

---

## Access Credentials

**Username:** `sitemaster`
**Password:** `keystone`

**Dashboard URL:** `/sitemaster` (Click the Shield icon in the header after logging in)

---

## Overview

The Sitemaster Dashboard provides complete control over all aspects of the GHETTO FINANCE platform. You have full authority to manage users, content, settings, features, rates, escrow transactions, and monitor all platform activity.

---

## Dashboard Sections

### 1. Overview Tab

**Platform Statistics:**
- Total Users
- Total Products/Listings
- Total Orders
- Active Suspensions

**Quick View:**
- Recent Flags (last 5)
- Recent Platform Activity (last 5)
- Quick action buttons to resolve flags

### 2. Users Tab

**Capabilities:**
- **Search Users:** Find any user by username or name
- **View User Activity:** See complete activity history for any user
- **Flag Users:** Mark users for violations with categorization
- **Suspend Users:** Temporarily or permanently suspend accounts
- **Message Users:** Send direct admin messages to users

**Actions Available:**
- View (Eye icon) - View user activity logs
- Flag (Flag icon) - Flag user for violations
- Suspend (Ban icon) - Suspend user account
- Message (Message icon) - Send admin message

### 3. Content Tab

**Search Content:**
- Switch between Users and Listings
- Search by name, username, or description

**Content Moderation:**
- **Delete Listings:** Remove products/listings with reason
- **Delete Posts:** Remove social posts
- **Track Deletions:** All deletions are logged

### 4. Flags Tab

**View All Active Flags:**
- Flag type and status
- Reason for flagging
- Date flagged
- Flagged by whom

**Actions:**
- Resolve flags with one click
- View flag evidence
- Track flag history

### 5. Suspensions Tab

**Manage User Suspensions:**
- View all active suspensions
- See suspension reason and duration
- Expiration dates for temporary suspensions

**Actions:**
- Lift suspensions immediately
- View suspension history
- Monitor suspended users

### 6. Activity Tab

**Complete Activity Log:**
- All platform activities tracked
- User IDs associated with actions
- IP addresses recorded
- Timestamps for all activities

**Use Cases:**
- Security monitoring
- Fraud detection
- User behavior analysis
- Compliance auditing

### 7. Features Tab

**Toggle Platform Features:**

Each feature can be enabled or disabled instantly:

- **Marketplace** - Main marketplace functionality
- **Social Platform** - Social networking features
- **Messaging** - Direct messaging between users
- **Auctions** - Auction listing functionality
- **Escrow System** - Escrow payment protection
- **Seller Registration** - Allow users to become sellers
- **Referral System** - Referral rewards program

**For Each Feature:**
- Enable/Disable toggle
- Description of feature
- Which user types are affected
- Last toggled by and timestamp

### 8. Rates Tab

**Adjust All Platform Rates:**

Configure financial parameters for the platform:

**Fees:**
- **Platform Fee Percentage** (0-10%) - Platform fee on transactions
  - Current: 2.5%
  - Controls revenue from each transaction

**Collateral:**
- **Seller Collateral Percentage** (50-200%) - Seller security deposit
  - Current: 100%
  - Ensures seller commitment

**Rewards:**
- **Referral Signup Reward** (0-1 GHETTO) - Tokens for referral signup
  - Current: 0.1 GHETTO
- **Referral Purchase Reward** (0-5 GHETTO) - Tokens for referral first purchase
  - Current: 0.25 GHETTO

**Escrow:**
- **Auto Release Days** (3-30 days) - Days after delivery for auto-release
  - Current: 7 days
  - Critical for transaction finalization

**For Each Rate:**
- Current value displayed
- Minimum and maximum bounds enforced
- Input validation
- Update button for immediate changes

### 9. Escrow Tab

**Complete Escrow Order Management:**

**View Orders By Status:**
- All Orders
- Funded Orders
- Disputed Orders

**For Each Order:**
- Order ID
- Buyer and Seller usernames
- Amount in USDC
- Status badge (color-coded)
- Creation date

**Actions:**
- **Force Release** (Green checkmark) - Release escrow funds immediately
  - Requires reason
  - Irreversible action
  - Logs the action with timestamp
- **Cancel Order** (Red X) - Cancel the entire order
  - Requires reason
  - Logs cancellation
  - Refunds both parties

**Use Cases:**
- Resolve stuck transactions
- Handle special circumstances
- Override automatic processes
- Emergency interventions

### 10. Transactions Tab

**Search and View All Transactions:**

**Search Capabilities:**
- Search by Order ID
- Search by description
- Returns up to 50 results

**Transaction Table:**
- Order ID (first 8 characters)
- Buyer username
- Seller username
- Amount
- Status badge
- Transaction date

**Use Cases:**
- Audit transactions
- Investigate issues
- Track payments
- Monitor platform volume

### 11. Messages Tab

**View All Platform Messages:**

**Complete Message Visibility:**
- See all messages between users
- From and To usernames
- Message preview
- Timestamp

**Features:**
- Up to 50 most recent messages
- Real-time monitoring
- Privacy oversight for security
- Compliance monitoring

**Use Cases:**
- Fraud prevention
- Harassment detection
- Dispute evidence
- Terms violation detection

### 12. Settings Tab

**Platform Configuration:**

**Available Settings:**
- **Platform Name** - Display name
- **Maintenance Mode** - Enable/disable access
- **New User Registration** - Allow signups
- **Max Login Attempts** - Security threshold
- **Min Escrow Amount** - Minimum transaction size

**For Each Setting:**
- Setting key name
- Description
- Current value (JSON format)
- Update button

---

## Key Features

### User Management

**Suspend Users:**
1. Search for user in Users tab
2. Click Ban icon
3. Enter reason for suspension
4. Enter duration in hours (or leave empty for permanent)
5. Confirm suspension

**Flag Users:**
1. Find user
2. Click Flag icon
3. Enter flag type (spam, abuse, fraud, etc.)
4. Enter reason
5. Submit flag

**Message Users:**
1. Find user
2. Click Message icon
3. Enter subject
4. Write message
5. Select priority (low, normal, high, urgent)
6. Send message

### Content Moderation

**Delete Listings:**
1. Go to Content tab
2. Select "Listings" search type
3. Search for listing
4. Click delete (X) button
5. Enter reason for deletion
6. Confirm deletion

**Delete Posts:**
- Same process as listings
- Select "Users" type to delete user posts

### Platform Control

**Enable/Disable Features:**
1. Go to Features tab
2. Click on feature toggle button
3. Feature immediately enabled/disabled
4. Change logged with timestamp

**Adjust Rates:**
1. Go to Rates tab
2. Find rate to adjust
3. Enter new value (respects min/max)
4. Click Update
5. Change applied immediately

### Escrow Management

**Force Release Escrow:**
1. Go to Escrow tab
2. Find order
3. Click green checkmark
4. Confirm action
5. Enter reason
6. Funds released immediately

**Cancel Order:**
1. Go to Escrow tab
2. Find order
3. Click red X
4. Confirm cancellation
5. Enter reason
6. Order cancelled

---

## Security & Permissions

### Access Control

- **Only sitemaster role** can access this dashboard
- Attempting access without role shows "Access Denied"
- All actions are logged with user ID and timestamp
- RLS policies enforce permission checks

### Action Logging

Every sitemaster action is logged:
- User suspensions
- Flag resolutions
- Content deletions
- Escrow interventions
- Setting changes
- Rate adjustments

### Audit Trail

All logs include:
- Activity type
- User ID performing action
- Target user/content ID
- Reason provided
- IP address
- Timestamp

---

## Best Practices

### User Management

1. **Document Reasons:** Always provide clear reasons for suspensions/flags
2. **Temporary First:** Use temporary suspensions before permanent ones
3. **Warning Messages:** Message users before suspending when appropriate
4. **Review Activity:** Check user activity log before taking action

### Content Moderation

1. **Review Context:** View content thoroughly before deletion
2. **Document Violations:** Record which terms/rules were violated
3. **Consistent Standards:** Apply rules equally to all users
4. **Keep Records:** Document all moderation decisions

### Rate Adjustments

1. **Test Impact:** Consider impact on users before changing rates
2. **Gradual Changes:** Make small adjustments rather than large jumps
3. **Monitor Effects:** Watch transaction volume after rate changes
4. **Document Reasoning:** Note why rates were changed

### Escrow Interventions

1. **Last Resort:** Only intervene when automated processes fail
2. **Gather Evidence:** Review transaction history first
3. **Communicate:** Message involved parties before intervention
4. **Document Thoroughly:** Detailed reasons for all interventions

---

## Troubleshooting

### Dashboard Won't Load

1. Verify sitemaster role is assigned:
   ```sql
   SELECT * FROM user_admin_roles
   WHERE user_id = (SELECT id FROM profiles WHERE username = 'sitemaster');
   ```

2. Check role is active:
   ```sql
   SELECT active FROM user_admin_roles
   WHERE user_id = (SELECT id FROM profiles WHERE username = 'sitemaster')
   AND role_type = 'sitemaster';
   ```

### Cannot Update Settings

1. Check RLS policies are enabled
2. Verify sitemaster role has permissions
3. Check for database errors in browser console

### Actions Not Working

1. Verify authentication session is active
2. Check browser console for errors
3. Refresh dashboard and try again
4. Clear browser cache

---

## Database Tables

### Tables Managed by Dashboard

1. **user_admin_roles** - Admin role assignments
2. **platform_settings** - Platform configuration
3. **feature_toggles** - Feature enable/disable states
4. **rate_configurations** - All platform rates
5. **user_flags** - User flagging system
6. **user_suspensions** - Suspension records
7. **content_moderation** - Content deletion logs
8. **admin_messages** - Admin-to-user messages
9. **activity_logs** - All platform activity
10. **orders** - Escrow transactions

### Direct Database Access

For advanced operations, you can query directly:

```sql
-- View all settings
SELECT * FROM platform_settings ORDER BY category, setting_key;

-- View all feature toggles
SELECT * FROM feature_toggles ORDER BY feature_name;

-- View all rates
SELECT * FROM rate_configurations WHERE active = true;

-- View recent activity
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100;

-- View active flags
SELECT * FROM user_flags WHERE status = 'active';

-- View active suspensions
SELECT * FROM user_suspensions WHERE active = true;
```

---

## Smart Contract Integration

### GHETTO Token Permissions

While the dashboard provides visibility into platform operations, blockchain operations require separate smart contract interactions:

**Token Operations:**
- Minting GHETTO tokens
- Burning tokens
- Transfer restrictions
- Blacklisting addresses

**Escrow Operations:**
- On-chain escrow creation
- Fund release
- Dispute resolution
- Fee collection

**Note:** The dashboard force-release feature updates the database status. For actual blockchain fund transfers, use the smart contract functions directly or through the Treasurer Dashboard.

---

## Support & Maintenance

### Regular Monitoring

**Daily Tasks:**
- Review active flags
- Check suspension list
- Monitor activity logs for anomalies
- Review dispute cases

**Weekly Tasks:**
- Analyze platform statistics
- Review rate effectiveness
- Check feature toggle usage
- Audit escrow interventions

**Monthly Tasks:**
- Full security audit
- User behavior analysis
- Platform performance review
- Rate optimization assessment

### Getting Help

For technical issues:
1. Check browser console for errors
2. Review database logs
3. Check RLS policies
4. Verify authentication session

For platform questions:
1. Review this guide
2. Check database documentation
3. Review migration files
4. Consult security policies

---

## Changelog

**Version 1.0** - November 2, 2025
- Initial comprehensive sitemaster dashboard
- 12 management sections
- Full CRUD operations on all platform resources
- Real-time activity monitoring
- Complete escrow control
- Feature toggle system
- Rate configuration management
- Message monitoring
- Transaction oversight

---

## Security Reminders

1. **Change Default Password:** The sitemaster account uses password "keystone" - change this in production
2. **Log Out:** Always log out when finished
3. **Secure Connection:** Only access dashboard over HTTPS
4. **Private Computer:** Use dashboard from secure, private devices
5. **Monitor Access:** Regularly review who has sitemaster access
6. **Document Actions:** Keep external records of major decisions
7. **Backup Settings:** Export settings before making major changes

---

## Quick Reference

| Task | Tab | Action |
|------|-----|--------|
| Suspend user | Users | Click Ban icon |
| Delete listing | Content | Click X icon |
| Release escrow | Escrow | Click green checkmark |
| Disable feature | Features | Click toggle button |
| Adjust fee | Rates | Update rate value |
| View messages | Messages | View table |
| Check activity | Activity | Review log table |
| Flag user | Users | Click Flag icon |
| Message user | Users | Click Message icon |
| Cancel order | Escrow | Click red X |

---

**Dashboard Path:** `/sitemaster`
**Login Required:** Yes
**Role Required:** sitemaster
**Status:** Production Ready

---

*For questions or issues, refer to database documentation or contact development team.*
