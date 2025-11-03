# Sitemaster Advanced Features & Comprehensive Management

**Complete Platform Control & Advanced Capabilities**

**Last Updated:** November 3, 2025

---

## Overview

The sitemaster account now has **comprehensive advanced management capabilities** with full access to all platform data, analytics, and control functions. The enhanced system provides complete oversight and management of every aspect of the GHETTO FINANCE platform.

---

## New Advanced Capabilities

### 1. Comprehensive User Management

**View All Users:**
- Paginated user list (100 users per page)
- Complete user profiles with all details
- User activity history
- Orders, products, flags, and suspensions per user

**Detailed User Information:**
```typescript
getUserDetails(userId)
```

Returns:
- Profile information
- Order history (last 20 orders)
- Products listed (if seller)
- All flags received
- All suspensions (active and past)

**User Profile Updates:**
```typescript
updateUserProfile(userId, {
  display_name: 'New Name',
  bio: 'Updated bio',
  verified: true
})
```

**User Deletion:**
```typescript
deleteUser(userId, reason)
```
- Soft delete (preserves data)
- Logs the action
- Documents reason
- Cannot be undone easily

---

### 2. Advanced Transaction Oversight

**View All Transactions:**
```typescript
getAllTransactions(limit, offset)
```
- Complete transaction history
- Buyer and seller information
- Product details
- Order status and amounts
- Timestamps and metadata

**Transaction Details:**
```typescript
getTransactionDetails(orderId)
```
- Full order information
- Complete buyer profile
- Complete seller profile
- Product details
- Transaction timeline

**Refund Transactions:**
```typescript
refundTransaction(orderId, reason)
```
- Immediate refund processing
- Status update to 'refunded'
- Activity logging
- Reason documentation

---

### 3. Enhanced Escrow Management

**Escrow Statistics:**
```typescript
getEscrowStatistics()
```

Provides:
- Total active escrow orders
- Total funds in escrow (USDC)
- Number of disputed orders
- Amount in disputed orders
- Completed orders count

**Escrow Analytics:**
- Real-time fund tracking
- Dispute rate monitoring
- Completion metrics
- Risk assessment data

---

### 4. Platform Analytics & Reporting

**Comprehensive Analytics:**
```typescript
getPlatformAnalytics()
```

Returns:
- **Current Totals:**
  - Total users
  - Total products
  - Total orders
  - Total revenue (completed orders)

- **Growth Metrics (Last 30 Days):**
  - New users
  - New products
  - New orders

- **Trends:**
  - User growth rate
  - Product listing velocity
  - Order completion rate

**Usage:**
The analytics are displayed in a dedicated Analytics tab with:
- Stat cards with icons
- Growth indicators
- Visual metrics
- Trend analysis

---

### 5. Bulk Operations

**Bulk User Suspension:**
```typescript
bulkSuspendUsers(userIds, reason, durationHours?)
```
- Suspend multiple users at once
- Same reason applies to all
- Optional duration for all
- Logged as bulk action

**Example:**
```typescript
// Suspend 10 spam accounts for 72 hours
await bulkSuspendUsers(
  ['user-id-1', 'user-id-2', ...],
  'Spam posting violation',
  72
);
```

**Bulk Content Deletion:**
```typescript
bulkDeleteContent(contentType, contentIds, reason)
```
- Delete multiple items at once
- Support for products, posts, messages
- Logged as bulk action
- Reason documented

**Example:**
```typescript
// Delete multiple spam products
await bulkDeleteContent(
  'product',
  ['prod-id-1', 'prod-id-2', ...],
  'Spam listings removed'
);
```

---

### 6. Advanced Search

**Multi-Type Search:**
```typescript
advancedSearch(query, type)
```

**Search Types:**
- `'all'` - Search everything
- `'users'` - Search users only
- `'products'` - Search products only
- `'orders'` - Search orders only
- `'messages'` - Search messages only

**Search Fields:**
- **Users:** username, display_name, bio
- **Products:** name, description
- **Orders:** order ID
- **Messages:** content, message text

**Returns:**
```typescript
{
  users: [...],      // Up to 20 results
  products: [...],   // Up to 20 results
  orders: [...],     // Up to 20 results
  messages: [...]    // Up to 20 results
}
```

---

### 7. Complete Data Access

**All Users List:**
```typescript
getAllUsers(limit, offset)
```
- Paginated user list
- Full profile data
- Sortable and filterable
- Export capable

**All Products/Listings:**
```typescript
getAllProducts(limit)
```
- All platform listings
- Seller information included
- Product status
- Pricing and details

**All Transactions:**
```typescript
getAllTransactions(limit, offset)
```
- Complete transaction log
- Both parties' information
- Product linked
- Status tracking

**All Messages:**
```typescript
getAllMessages(limit)
```
- Platform-wide messages
- Sender and receiver data
- Message content
- Timestamps

**All Posts:**
```typescript
getAllPosts(limit)
```
- Social platform posts
- Author information
- Deleted status tracking
- Engagement metrics

---

## New Dashboard Features

### Analytics Tab

**Displays:**
- Platform statistics overview
- Growth metrics (30-day)
- Escrow statistics
- Revenue tracking
- Visual stat cards with icons

**Metrics:**
- Total users with user count
- Total products listed
- Total orders processed
- Total revenue in USD
- New users (last 30 days)
- New products (last 30 days)
- New orders (last 30 days)
- Active escrow orders
- Escrow funds held
- Disputed orders count

### Listings Tab (Coming Soon)

**Will Display:**
- All platform listings
- Seller information
- Product status
- Quick moderation actions
- Bulk operations

### Advanced Tab (Coming Soon)

**Will Include:**
- Advanced search interface
- Bulk operations panel
- Custom reports
- Data export tools
- Advanced filters

---

## Hook Functions Reference

### User Management Functions

| Function | Parameters | Purpose |
|----------|-----------|---------|
| `getAllUsers` | limit, offset | Get paginated user list |
| `getUserDetails` | userId | Get complete user info |
| `updateUserProfile` | userId, updates | Update user profile |
| `deleteUser` | userId, reason | Delete/deactivate user |
| `searchUsers` | query | Search users by username |

### Transaction Functions

| Function | Parameters | Purpose |
|----------|-----------|---------|
| `getAllTransactions` | limit, offset | Get all transactions |
| `getTransactionDetails` | orderId | Get transaction details |
| `refundTransaction` | orderId, reason | Refund a transaction |
| `searchTransactions` | query | Search by order ID |

### Escrow Functions

| Function | Parameters | Purpose |
|----------|-----------|---------|
| `getEscrowOrders` | status? | Get escrow orders |
| `getEscrowStatistics` | none | Get escrow stats |
| `cancelEscrowOrder` | orderId, reason | Cancel order |
| `forceReleaseEscrow` | orderId, reason | Force release funds |

### Analytics Functions

| Function | Parameters | Purpose |
|----------|-----------|---------|
| `getPlatformAnalytics` | none | Get platform analytics |
| `getPlatformStats` | none | Get basic stats |
| `getEscrowStatistics` | none | Get escrow metrics |

### Bulk Operations

| Function | Parameters | Purpose |
|----------|-----------|---------|
| `bulkSuspendUsers` | userIds, reason, duration? | Suspend multiple users |
| `bulkDeleteContent` | type, ids, reason | Delete multiple items |

### Advanced Search

| Function | Parameters | Purpose |
|----------|-----------|---------|
| `advancedSearch` | query, type | Multi-type search |
| `searchUsers` | query | Search users |
| `searchListings` | query | Search products |
| `searchTransactions` | query | Search orders |

### Content Management

| Function | Parameters | Purpose |
|----------|-----------|---------|
| `getAllProducts` | limit | Get all products |
| `getAllPosts` | limit | Get all posts |
| `getAllMessages` | limit | Get all messages |
| `deleteContent` | type, id, reason | Delete content |

---

## Usage Examples

### Example 1: View User Complete History

```typescript
// Get detailed user information
const userInfo = await getUserDetails('user-id-123');

console.log('Profile:', userInfo.profile);
console.log('Orders:', userInfo.orders.length);
console.log('Products:', userInfo.products.length);
console.log('Flags:', userInfo.flags.length);
console.log('Active Suspensions:', userInfo.suspensions.filter(s => s.active).length);
```

### Example 2: Bulk Suspend Spam Accounts

```typescript
// Identify spam accounts
const spamUsers = await searchUsers('spam');
const spamUserIds = spamUsers.map(u => u.id);

// Bulk suspend for 7 days
await bulkSuspendUsers(
  spamUserIds,
  'Automated spam detection - bulk suspension',
  168  // 7 days in hours
);

console.log(`Suspended ${spamUserIds.length} spam accounts`);
```

### Example 3: Platform Health Check

```typescript
// Get comprehensive analytics
const analytics = await getPlatformAnalytics();
const escrowStats = await getEscrowStatistics();

console.log('Platform Health Report:');
console.log('=====================');
console.log(`Total Users: ${analytics.totalUsers}`);
console.log(`New Users (30d): ${analytics.newUsersLast30Days}`);
console.log(`Growth Rate: ${(analytics.newUsersLast30Days / analytics.totalUsers * 100).toFixed(2)}%`);
console.log('');
console.log(`Total Revenue: $${analytics.totalRevenue}`);
console.log(`Orders Pending: ${escrowStats.totalEscrowOrders}`);
console.log(`Funds in Escrow: $${escrowStats.totalEscrowAmount}`);
console.log(`Dispute Rate: ${(escrowStats.disputedOrders / escrowStats.totalEscrowOrders * 100).toFixed(2)}%`);
```

### Example 4: Advanced Search Across Platform

```typescript
// Search for "suspicious" across all content
const results = await advancedSearch('suspicious', 'all');

console.log('Search Results:');
console.log(`Users: ${results.users?.length || 0}`);
console.log(`Products: ${results.products?.length || 0}`);
console.log(`Orders: ${results.orders?.length || 0}`);
console.log(`Messages: ${results.messages?.length || 0}`);

// Review messages for policy violations
results.messages?.forEach(msg => {
  console.log(`From: ${msg.sender.username} To: ${msg.receiver.username}`);
  console.log(`Content: ${msg.content}`);
});
```

### Example 5: Refund Multiple Transactions

```typescript
// Find transactions to refund
const problematicOrders = await searchTransactions('problem-seller-id');

// Refund each one
for (const order of problematicOrders) {
  await refundTransaction(
    order.id,
    'Seller account compromised - automatic refunds issued'
  );
  console.log(`Refunded order ${order.id} - $${order.amount}`);
}
```

---

## Security & Permissions

### Access Control

All advanced functions check for:
1. Valid authentication session
2. Active sitemaster role
3. RLS policy compliance
4. Action logging

### Audit Logging

Every action is logged with:
- User ID (sitemaster)
- Action type
- Target (user, content, transaction)
- Reason provided
- Timestamp
- Additional metadata

### Activity Types Logged

- `sitemaster_delete_user`
- `sitemaster_bulk_suspend`
- `sitemaster_bulk_delete_content`
- `sitemaster_refund_transaction`
- `sitemaster_force_release`
- `sitemaster_cancel_order`
- All existing activity types

---

## Performance Considerations

### Pagination

Large data sets use pagination:
```typescript
// Get users in batches of 100
let offset = 0;
while (true) {
  const users = await getAllUsers(100, offset);
  if (users.length === 0) break;

  // Process users
  processUsers(users);

  offset += 100;
}
```

### Bulk Operations Limits

- Bulk suspend: Recommended max 100 users per call
- Bulk delete: Recommended max 50 items per call
- Search results: Limited to 20 per type

### Caching

Analytics data should be cached client-side:
```typescript
// Cache for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
let analyticsCache = null;
let cacheTime = 0;

const getAnalytics = async () => {
  if (analyticsCache && Date.now() - cacheTime < CACHE_DURATION) {
    return analyticsCache;
  }

  analyticsCache = await getPlatformAnalytics();
  cacheTime = Date.now();
  return analyticsCache;
};
```

---

## Best Practices

### 1. Always Provide Reasons

```typescript
// Good
await deleteUser(userId, 'Repeated policy violations after 3 warnings');

// Bad
await deleteUser(userId, 'bad user');
```

### 2. Use Bulk Operations Wisely

```typescript
// Good - targeted bulk action
const violators = await identifyPolicyViolators();
await bulkSuspendUsers(violators.map(u => u.id), 'Policy violation batch 2025-11-03', 48);

// Bad - indiscriminate bulk action
await bulkSuspendUsers(allUserIds, 'cleanup');
```

### 3. Monitor Before Acting

```typescript
// Good - check details first
const userInfo = await getUserDetails(userId);
if (userInfo.flags.length > 3 && userInfo.orders.length === 0) {
  await deleteUser(userId, 'Multiple flags, no legitimate activity');
}

// Bad - act without context
await deleteUser(userId, 'flagged');
```

### 4. Document Major Actions

```typescript
// Keep external log of major actions
const action = {
  date: new Date(),
  action: 'bulk_suspend',
  userCount: 25,
  reason: 'Coordinated spam attack',
  decision_maker: 'sitemaster',
  reversible: true
};

// Save to external audit log
await saveToAuditLog(action);
```

---

## Troubleshooting

### Issue: Function Returns Empty Results

**Check:**
1. RLS policies allow read access
2. Table has data
3. Filters are not too restrictive
4. Pagination offset is valid

### Issue: Bulk Operation Fails

**Solutions:**
1. Reduce batch size
2. Check each ID is valid
3. Ensure reason is provided
4. Verify sitemaster role is active

### Issue: Analytics Slow to Load

**Solutions:**
1. Implement client-side caching
2. Reduce date range for growth metrics
3. Use pagination for large result sets
4. Consider database indexing

---

## Future Enhancements

### Planned Features

1. **Real-time Dashboard:**
   - Live activity feed
   - Real-time statistics
   - WebSocket integration

2. **Advanced Reporting:**
   - Custom report builder
   - Scheduled reports
   - CSV/PDF export

3. **AI-Powered Insights:**
   - Anomaly detection
   - Fraud prediction
   - User behavior analysis

4. **Automation Rules:**
   - Auto-suspend on criteria
   - Auto-flag suspicious activity
   - Scheduled cleanup tasks

5. **Enhanced Search:**
   - Full-text search
   - Advanced filters
   - Saved searches
   - Search history

---

## Summary

The sitemaster account now has **complete platform control** with:

✅ **User Management:**
- View, search, update, delete users
- Detailed user profiles with history
- Bulk operations

✅ **Transaction Oversight:**
- View all transactions
- Transaction details
- Refund capability
- Search and filter

✅ **Escrow Control:**
- Statistics and metrics
- Force release
- Cancel orders
- Dispute tracking

✅ **Analytics:**
- Platform-wide metrics
- Growth tracking
- Revenue monitoring
- Escrow statistics

✅ **Advanced Operations:**
- Bulk suspensions
- Bulk deletions
- Multi-type search
- Complete data access

✅ **Full Visibility:**
- All users
- All listings
- All transactions
- All messages
- All posts
- All activity logs

**The sitemaster has comprehensive advanced management capabilities to maintain platform integrity and protect all users!**

---

*For basic dashboard usage, see SITEMASTER_DASHBOARD_GUIDE.md*
*For setup information, see SITEMASTER_SETUP_COMPLETE.md*
*For credentials, see ADMIN_ACCOUNTS.md*
