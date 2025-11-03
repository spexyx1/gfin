# GHETTO FINANCE - Admin Accounts

**Complete list of all administrative accounts with full access credentials**

**Last Updated:** November 3, 2025

---

## Active Admin Accounts

### 1. Sitemaster (Platform Administrator)

**Complete Platform Control**

```
Username: sitemaster
Password: keystone
Dashboard: /sitemaster
```

**Account Details:**
- **User ID:** `7746376e-96ef-4c4b-b37d-2296ff3ceed4`
- **Display Name:** Site Master
- **Email:** `sitemaster@placeholder.ghetto.finance` (internal)
- **Bio:** GHETTO FINANCE Platform Administrator
- **Status:** ✅ Verified
- **Created:** November 2, 2025

**Role Permissions:**
- Full platform administration and control
- User management (search, suspend, flag, message)
- Content moderation (delete listings, posts)
- Feature toggles (enable/disable any feature)
- Rate configurations (adjust all fees and rates)
- Escrow management (force release, cancel orders)
- Platform settings configuration
- Complete activity monitoring
- All transaction visibility
- All message oversight

**Dashboard Features:**
- 12 management sections
- Real-time platform statistics
- User search and actions
- Content moderation tools
- Flag resolution
- Suspension management
- Activity logs viewer
- Feature toggle controls
- Rate adjustment interface
- Escrow order management
- Transaction search
- Message monitoring
- Settings configuration

---

### 2. Treasurer (Financial Management)

**Token & Treasury Control**

```
Username: treasurer
Password: treasury2025
Dashboard: /treasurer
```

**Account Details:**
- **User ID:** `e2ad1db0-8f62-487c-8219-0b04bbb32caa`
- **Display Name:** Platform Treasurer
- **Email:** `treasurer@placeholder.ghetto.finance` (internal)
- **Bio:** GHETTO FINANCE Platform Treasury & Token Manager
- **Status:** ✅ Verified
- **Created:** November 3, 2025

**Role Permissions:**
- GHETTO token management
- Treasury operations logging
- Wallet blacklisting/whitelisting
- Token blacklisting/whitelisting
- Financial transaction oversight
- Token minting authorization
- Token burning authorization
- Fee collection management

**Dashboard Features:**
- Operations log tracking
- Blacklisted wallets management
- Blacklisted tokens management
- Treasury actions panel
- Real-time operation history
- Wallet address search
- Token ID search
- Action reason documentation

**Key Responsibilities:**
- Monitor GHETTO token supply
- Manage blacklisted addresses
- Log all treasury operations
- Oversee platform financial health
- Control token distribution
- Manage platform treasury

---

### 3. Mediator (Dispute Resolution)

**Dispute Resolution & Mediation**

```
Username: mediator
Password: mediate2025
Dashboard: /mediator
```

**Account Details:**
- **User ID:** `c754da0c-5bd5-4e8c-a414-c2c46417b070`
- **Display Name:** Platform Mediator
- **Email:** `mediator@placeholder.ghetto.finance` (internal)
- **Bio:** GHETTO FINANCE Dispute Resolution & Mediation Specialist
- **Status:** ✅ Verified
- **Created:** November 3, 2025

**Role Permissions:**
- Dispute case management
- Evidence collection and review
- Case resolution authority
- Moderator assignment
- User rewards/fines
- Appeal review
- Case comment management
- Escrow award decisions

**Dashboard Features:**
- Active cases overview
- Appeals management
- Case detail viewer
- Evidence management
- Comment system
- Moderator assignment
- Resolution tools
- Status filtering
- Case history tracking

**Key Responsibilities:**
- Review and resolve disputes
- Collect and analyze evidence
- Make fair escrow decisions
- Assign sub-moderators to cases
- Handle appeals
- Document resolutions
- Maintain dispute records

---

## Access Matrix

| Account | Dashboard | Role Type | Primary Function |
|---------|-----------|-----------|------------------|
| sitemaster | `/sitemaster` | sitemaster | Complete platform control |
| treasurer | `/treasurer` | treasurer | Financial & token management |
| mediator | `/mediator` | mediator | Dispute resolution |

---

## Login Instructions

### Method 1: Username Login (All Accounts)

1. Go to the platform login page
2. Enter username (e.g., `sitemaster`, `treasurer`, `mediator`)
3. Enter password
4. Click LOGIN
5. Navigate to your dashboard

### Method 2: Direct Dashboard Access

1. Log in with your credentials
2. Navigate directly to your dashboard URL:
   - Sitemaster: `/sitemaster`
   - Treasurer: `/treasurer`
   - Mediator: `/mediator`

---

## Role Hierarchy

```
┌─────────────────┐
│   SITEMASTER    │  ← Full Control
│  (All Powers)   │
└────────┬────────┘
         │
    ┌────┴────┬─────────────┐
    │         │             │
┌───▼───┐ ┌──▼───┐  ┌──────▼──────┐
│TREASR │ │MEDTR │  │SUB-MODERATOR│
└───────┘ └──────┘  └─────────────┘
```

**Sitemaster:**
- Can do everything
- Assign/revoke all roles
- Override all decisions

**Treasurer:**
- Financial operations only
- Cannot moderate users
- Cannot resolve disputes

**Mediator:**
- Dispute resolution only
- Can assign sub-moderators
- Cannot access treasury

**Sub-Moderator:**
- Assist with cases
- Cannot resolve independently
- Assigned by mediators

---

## Database Verification

### Check All Admin Roles

```sql
SELECT
  p.username,
  p.display_name,
  uar.role_type,
  uar.active,
  uar.assigned_at
FROM profiles p
JOIN user_admin_roles uar ON uar.user_id = p.id
WHERE p.username IN ('sitemaster', 'treasurer', 'mediator')
ORDER BY p.username;
```

### Check Specific Account

```sql
-- Sitemaster
SELECT * FROM profiles WHERE username = 'sitemaster';
SELECT * FROM user_admin_roles WHERE user_id = '7746376e-96ef-4c4b-b37d-2296ff3ceed4';

-- Treasurer
SELECT * FROM profiles WHERE username = 'treasurer';
SELECT * FROM user_admin_roles WHERE user_id = 'e2ad1db0-8f62-487c-8219-0b04bbb32caa';

-- Mediator
SELECT * FROM profiles WHERE username = 'mediator';
SELECT * FROM user_admin_roles WHERE user_id = 'c754da0c-5bd5-4e8c-a414-c2c46417b070';
```

---

## Security Best Practices

### Password Management

⚠️ **IMPORTANT:** All accounts use default passwords for development

**Before Production:**
1. Change all default passwords
2. Use strong passwords (12+ characters, mixed case, numbers, symbols)
3. Consider password manager
4. Enable 2FA for all admin accounts

**Change Password:**
```typescript
// After logging in
await supabase.auth.updateUser({
  password: 'new_secure_password_here'
});
```

### Session Security

- Always log out when finished
- Use dashboard from secure, private devices
- Access only over HTTPS in production
- Monitor login activity regularly
- Set up session timeout

### Access Control

- Only share credentials with authorized personnel
- Document who has access
- Revoke access immediately when no longer needed
- Regular access audits
- Monitor admin activity logs

---

## Common Tasks

### Sitemaster Tasks

```
Suspend User:       Users tab → Search → Ban icon
Enable Feature:     Features tab → Toggle button
Adjust Rate:        Rates tab → Input new value → Update
Release Escrow:     Escrow tab → Green checkmark
View Messages:      Messages tab → View table
```

### Treasurer Tasks

```
Blacklist Wallet:   Wallets tab → Add button → Enter address
Log Operation:      Actions tab → Select type → Log
View Operations:    Operations tab → View history
Unblacklist:        Find address → Remove button
```

### Mediator Tasks

```
Review Case:        Cases tab → Select case → View details
Add Evidence:       Case detail → Evidence section → Upload
Resolve Case:       Case detail → Resolution → Decide
Assign Moderator:   Case detail → Assign button
Review Appeal:      Appeals tab → Select appeal → Review
```

---

## Troubleshooting

### Cannot Access Dashboard

**Check:**
1. Logged in with correct username/password
2. Account has proper role assigned
3. Role is active in database
4. Browser cache cleared
5. No RLS policy errors in console

**Fix:**
```sql
-- Verify role is assigned and active
SELECT * FROM user_admin_roles
WHERE user_id = 'YOUR_USER_ID'
AND active = true;
```

### Dashboard Shows "Access Denied"

**Causes:**
- Role not assigned
- Role inactive
- Wrong dashboard for role type
- Session expired

**Solution:**
1. Log out completely
2. Clear browser cache
3. Log back in
4. Verify role in database
5. Contact sitemaster if needed

### Actions Not Working

**Check:**
1. Session is active
2. Role has proper permissions
3. RLS policies allow action
4. No database errors
5. Browser console for errors

---

## Quick Reference

### Dashboard URLs

| Role | URL | Icon |
|------|-----|------|
| Sitemaster | `/sitemaster` | 🛡️ Shield |
| Treasurer | `/treasurer` | 💰 Dollar |
| Mediator | `/mediator` | ⚖️ Scale |

### Primary Responsibilities

**Sitemaster:**
- Platform integrity
- User management
- Feature control
- Rate management

**Treasurer:**
- Token supply
- Financial health
- Blacklist management
- Treasury operations

**Mediator:**
- Fair resolutions
- Evidence review
- Case management
- Appeal handling

---

## Support Contacts

### For Technical Issues

1. Check browser console for errors
2. Verify database connection
3. Review RLS policies
4. Check role assignments

### For Account Issues

Contact the sitemaster account holder for:
- Role assignments
- Permission changes
- Account activation
- Access problems

---

## Maintenance Schedule

### Daily Tasks

**All Admins:**
- Check dashboard for alerts
- Review recent activity
- Respond to urgent issues

**Sitemaster:**
- Review flags and suspensions
- Monitor platform health

**Treasurer:**
- Check treasury operations log
- Review blacklist requests

**Mediator:**
- Review new cases
- Respond to appeals

### Weekly Tasks

**All Admins:**
- Review weekly statistics
- Update any necessary settings
- Document major actions

### Monthly Tasks

**All Admins:**
- Full security audit
- Access review
- Password updates (recommended)
- Performance review

---

## Important Notes

1. ⚠️ **All passwords are defaults** - Change before production
2. ✅ **All accounts verified** - Ready to use
3. 🔒 **All actions logged** - Complete audit trail
4. 📊 **Real-time access** - Dashboards updated live
5. 🛡️ **RLS protected** - Database-level security

---

## Summary

**Total Admin Accounts:** 3

1. **Sitemaster** - Full control ✅
2. **Treasurer** - Financial management ✅
3. **Mediator** - Dispute resolution ✅

**All accounts are active, verified, and ready for use!**

---

**For detailed usage guides:**
- Sitemaster: See `SITEMASTER_DASHBOARD_GUIDE.md`
- Treasurer: See TreasurerDashboard component
- Mediator: See MediatorDashboard component

**For technical details:**
- Setup: `SITEMASTER_SETUP_COMPLETE.md`
- Authentication: `WORKING_ACCOUNTS.md`
- Quick Start: `QUICKSTART_SITEMASTER.md`

---

*Created: November 3, 2025*
*Status: Production Ready* ✅
