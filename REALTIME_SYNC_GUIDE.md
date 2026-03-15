# Real-Time Synchronization System

This guide explains how the Natively marketplace uses Supabase Real-Time to enable instant cross-platform synchronization between web and mobile applications.

## Overview

The real-time system allows instant data synchronization across all connected devices. When a change happens on one device (web or mobile), it appears immediately on all other devices without requiring manual refresh.

## Architecture

### Core Components

1. **RealtimeService** (`src/services/realtimeService.ts`)
   - Central service managing all WebSocket connections
   - Handles subscriptions to database changes
   - Manages presence tracking and broadcasts

2. **Real-Time Hooks**
   - `useRealtimeProducts` - Product updates
   - `useRealtimeOrders` - Order status changes
   - `useRealtimeMessages` - New messages
   - `useRealtimePresence` - Online user tracking

3. **UI Components**
   - `RealtimeNotificationSystem` - Notification panel
   - `RealtimeStatusIndicator` - Connection status

## What Gets Synchronized

### Products
- New product listings appear instantly
- Price updates sync immediately
- Stock changes reflect in real-time
- Product deletions propagate instantly

### Orders
- Order placement notifications
- Status updates (pending → shipped → delivered)
- Tracking number updates
- Dispute status changes

### Messages
- Chat messages arrive instantly
- Typing indicators work in real-time
- Read receipts sync immediately
- Unread counts update automatically

### User Presence
- See who's online
- Track active users in conversations
- Show "currently viewing" indicators

## How It Works

### Database Level

Supabase listens to PostgreSQL database changes using:
```sql
-- Changes to products table trigger real-time events
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Application Level

1. **Subscribe to Changes**
```typescript
const subscription = realtimeService.subscribeToProducts((payload) => {
  // payload.event: 'INSERT' | 'UPDATE' | 'DELETE'
  // payload.product: The product data
  console.log('Product changed:', payload);
});
```

2. **Receive Updates**
- WebSocket connection established to Supabase
- Database changes trigger events
- Callbacks fire with new data
- UI updates automatically

3. **Clean Up**
```typescript
// Unsubscribe when component unmounts
subscription.unsubscribe();
```

## Usage Examples

### Track Product Updates

```typescript
import { useRealtimeProducts } from './hooks/useRealtimeProducts';

function ProductList() {
  const { realtimeProducts, lastUpdate } = useRealtimeProducts({
    category: 'electronics',
    onProductAdded: (product) => {
      console.log('New product:', product.name);
    }
  });

  return (
    <div>
      {lastUpdate && <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>}
      {/* Product list */}
    </div>
  );
}
```

### Monitor Order Status

```typescript
import { useRealtimeOrders } from './hooks/useRealtimeOrders';

function OrderTracker() {
  const { unreadCount, markAsRead } = useRealtimeOrders({
    onOrderUpdated: (order) => {
      if (order.status === 'shipped') {
        // Show notification
        console.log('Your order has shipped!');
      }
    }
  });

  return <div>Orders with updates: {unreadCount}</div>;
}
```

### Listen for Messages

```typescript
import { useRealtimeMessages } from './hooks/useRealtimeMessages';

function ChatInterface() {
  const { realtimeMessages, unreadCount } = useRealtimeMessages({
    onNewMessage: (message) => {
      // Play notification sound
      // Show toast notification
    },
    autoNotify: true // Enable desktop notifications
  });

  return <div>Unread messages: {unreadCount}</div>;
}
```

### Track User Presence

```typescript
import { useRealtimePresence } from './hooks/useRealtimePresence';

function OnlineUsers() {
  const { onlineUsers, onlineCount } = useRealtimePresence({
    roomName: 'marketplace',
    metadata: { viewing: 'electronics' }
  });

  return (
    <div>
      <p>{onlineCount} users online</p>
      {onlineUsers.map(user => (
        <div key={user.user_id}>{user.user_id}</div>
      ))}
    </div>
  );
}
```

## Notifications

### Browser Notifications

Desktop notifications work when:
1. User grants permission
2. Tab is not in focus
3. New events occur

```typescript
// Request permission
const permission = await Notification.requestPermission();

// Notifications fire automatically for:
// - New orders
// - Order status changes
// - New messages
// - Important updates
```

### In-App Notifications

The `RealtimeNotificationSystem` provides:
- Sliding notification panel
- Unread count badge
- Notification history
- Mark as read functionality
- Clear all option

## Connection Status

The `RealtimeStatusIndicator` shows:
- Connected (green)
- Connecting (yellow, pulsing)
- Disconnected (gray)
- Error (red)

Click the indicator to see:
- Current status
- Last connected time
- Connection details
- Reconnect option

## Performance Considerations

### Efficient Subscriptions

Use filters to reduce data transfer:
```typescript
// Only subscribe to specific seller's products
realtimeService.subscribeToProducts(callback, {
  sellerId: 'user-123'
});
```

### Connection Management

```typescript
// Unsubscribe when not needed
useEffect(() => {
  const subscription = realtimeService.subscribeToProducts(callback);

  return () => {
    subscription.unsubscribe(); // Clean up
  };
}, []);
```

### Batching Updates

Real-time events are batched automatically to prevent overwhelming the UI with rapid changes.

## Mobile App Integration

See `MOBILE_APP_REALTIME_GUIDE.md` for detailed instructions on:
- Setting up Supabase client in React Native
- Creating the same real-time hooks
- Building mobile UI components
- Testing cross-platform sync

## Security

### Row Level Security (RLS)

Real-time respects all RLS policies:
```sql
-- Users only receive updates for data they can access
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
```

### Authentication

Real-time connections require:
1. Valid Supabase session
2. Authenticated user token
3. Proper RLS permissions

## Troubleshooting

### Connection Issues

**Symptoms:** Status shows "Disconnected" or "Error"

**Solutions:**
1. Check internet connectivity
2. Verify Supabase project is active
3. Refresh the page
4. Check browser console for errors

### Updates Not Appearing

**Symptoms:** Changes on one device don't appear on another

**Solutions:**
1. Ensure real-time is enabled for the table in Supabase dashboard
2. Check RLS policies allow SELECT permission
3. Verify subscription filters aren't too restrictive
4. Check browser console for subscription errors

### High Memory Usage

**Symptoms:** Browser/app slows down over time

**Solutions:**
1. Ensure subscriptions are cleaned up on unmount
2. Use filters to reduce data volume
3. Limit subscription scope
4. Call `unsubscribeAll()` when navigating away

### Notifications Not Working

**Symptoms:** No desktop notifications appear

**Solutions:**
1. Check browser notification permission
2. Verify notifications aren't blocked in OS settings
3. Ensure tab/app is not in Do Not Disturb mode
4. Check browser console for notification errors

## Testing Real-Time Sync

### Local Testing

1. Open web app in two browser windows
2. Login as different users in each window
3. Create a product in window 1
4. Watch it appear instantly in window 2

### Cross-Platform Testing

1. Open web app in browser
2. Open mobile app in emulator/device
3. Make changes in web app
4. Verify they appear in mobile app
5. Make changes in mobile app
6. Verify they appear in web app

### Performance Testing

```javascript
// Monitor connection quality
const startTime = Date.now();

realtimeService.subscribeToProducts((payload) => {
  const latency = Date.now() - payload.timestamp;
  console.log('Update latency:', latency, 'ms');
});
```

## Best Practices

### 1. Always Unsubscribe

```typescript
useEffect(() => {
  const sub = realtimeService.subscribeToProducts(callback);
  return () => sub.unsubscribe(); // Essential!
}, []);
```

### 2. Use Specific Filters

```typescript
// Good - specific filter
subscribeToProducts(callback, { sellerId: userId });

// Bad - subscribes to everything
subscribeToProducts(callback);
```

### 3. Batch UI Updates

```typescript
const [products, setProducts] = useState([]);

useRealtimeProducts({
  onProductAdded: (product) => {
    // Batch with requestAnimationFrame
    requestAnimationFrame(() => {
      setProducts(prev => [...prev, product]);
    });
  }
});
```

### 4. Handle Offline Gracefully

```typescript
const { status } = useRealtimeStatus();

if (status === 'disconnected') {
  // Show offline banner
  // Queue actions for when back online
  // Use cached data
}
```

## Advanced Features

### Custom Broadcasts

Send custom events between clients:
```typescript
// Sender
await realtimeService.broadcast('chat', 'typing', {
  userId: user.id,
  isTyping: true
});

// Receiver
realtimeService.subscribeToBroadcast('chat', 'typing', (payload) => {
  console.log('User typing:', payload.userId);
});
```

### Presence Tracking

Track user activity:
```typescript
const { onlineUsers } = useRealtimePresence({
  roomName: 'product-page-123',
  metadata: {
    viewing: 'product',
    productId: '123'
  }
});
```

## Resources

- [Supabase Real-Time Docs](https://supabase.com/docs/guides/realtime)
- [PostgreSQL LISTEN/NOTIFY](https://www.postgresql.org/docs/current/sql-notify.html)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

## Support

For issues with real-time sync:
1. Check this guide first
2. Review Supabase dashboard logs
3. Check browser/app console
4. Test with simple queries first
5. Contact support with specific error messages
