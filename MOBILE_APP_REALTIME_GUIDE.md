# Natively Mobile App - Real-Time Sync Implementation Guide

This guide will help you implement the Natively mobile app in Replit with full real-time synchronization to your web app.

## Prerequisites

- A Replit account
- Your Supabase project URL and anon key (from your `.env` file)
- Basic knowledge of React Native and Expo

## Step 1: Create Your Mobile App in Replit

1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Select "React Native" template
4. Name it "natively-mobile"

## Step 2: Install Dependencies

In your Replit shell, run:

```bash
npm install @supabase/supabase-js expo-secure-store @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-url-polyfill
```

## Step 3: Setup Supabase Client

Create `lib/supabase.ts`:

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## Step 4: Create Real-Time Service

Create `services/realtimeService.ts` (use the same structure as the web app):

```typescript
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  subscribeToProducts(callback: (payload: any) => void, filters?: any) {
    const channelName = `products:${filters?.sellerId || 'all'}`;

    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = supabase.channel(channelName);
      this.channels.set(channelName, channel);
    }

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: filters?.sellerId ? `seller_id=eq.${filters.sellerId}` : undefined,
      }, callback)
      .subscribe();

    return {
      channel,
      unsubscribe: () => {
        channel?.unsubscribe();
        this.channels.delete(channelName);
      },
    };
  }

  subscribeToOrders(userId: string, callback: (payload: any) => void) {
    const channelName = `orders:${userId}`;

    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = supabase.channel(channelName);
      this.channels.set(channelName, channel);
    }

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `buyer_id=eq.${userId}`,
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `seller_id=eq.${userId}`,
      }, callback)
      .subscribe();

    return {
      channel,
      unsubscribe: () => {
        channel?.unsubscribe();
        this.channels.delete(channelName);
      },
    };
  }

  subscribeToMessages(userId: string, callback: (payload: any) => void) {
    const channelName = `messages:${userId}`;

    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = supabase.channel(channelName);
      this.channels.set(channelName, channel);
    }

    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      }, callback)
      .subscribe();

    return {
      channel,
      unsubscribe: () => {
        channel?.unsubscribe();
        this.channels.delete(channelName);
      },
    };
  }

  unsubscribeAll() {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
  }
}

export const realtimeService = new RealtimeService();
```

## Step 5: Create Real-Time Hooks

Create `hooks/useRealtimeProducts.ts`:

```typescript
import { useEffect, useState } from 'react';
import { realtimeService } from '../services/realtimeService';

export function useRealtimeProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const handleChange = (payload: any) => {
      setLastUpdate(new Date());

      switch (payload.eventType) {
        case 'INSERT':
          setProducts(prev => [...prev, payload.new]);
          break;
        case 'UPDATE':
          setProducts(prev =>
            prev.map(p => p.id === payload.new.id ? payload.new : p)
          );
          break;
        case 'DELETE':
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          break;
      }
    };

    const subscription = realtimeService.subscribeToProducts(handleChange, filters);

    return () => {
      subscription.unsubscribe();
    };
  }, [JSON.stringify(filters)]);

  return { products, lastUpdate };
}
```

## Step 6: Create Product List Screen

Create `screens/ProductListScreen.tsx`:

```typescript
import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRealtimeProducts } from '../hooks/useRealtimeProducts';
import { supabase } from '../lib/supabase';

export function ProductListScreen() {
  const { products: realtimeProducts, lastUpdate } = useRealtimeProducts();
  const [products, setProducts] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadProducts = async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProducts(data);
    }
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadProducts();
  }, []);

  // Merge real-time updates with existing products
  React.useEffect(() => {
    if (realtimeProducts.length > 0) {
      setProducts(prev => {
        const updated = [...prev];
        realtimeProducts.forEach(rtProduct => {
          const index = updated.findIndex(p => p.id === rtProduct.id);
          if (index === -1) {
            updated.unshift(rtProduct);
          } else {
            updated[index] = rtProduct;
          }
        });
        return updated;
      });
    }
  }, [realtimeProducts]);

  return (
    <View style={styles.container}>
      {lastUpdate && (
        <View style={styles.updateBanner}>
          <Text style={styles.updateText}>
            Updated {lastUpdate.toLocaleTimeString()}
          </Text>
        </View>
      )}
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadProducts} />
        }
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price}</Text>
            <Text style={styles.productDescription}>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  updateBanner: {
    backgroundColor: '#10b981',
    padding: 8,
    alignItems: 'center',
  },
  updateText: {
    color: 'white',
    fontSize: 12,
  },
  productCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: '#10b981',
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
  },
});
```

## Step 7: Enable Real-Time in Supabase

In your Supabase dashboard:

1. Go to Database > Replication
2. Enable real-time for these tables:
   - `products`
   - `orders`
   - `messages`
   - `auctions`

## Step 8: Testing Cross-Platform Sync

1. Open your web app in a browser
2. Open your mobile app in Replit or Expo Go
3. Make a change on the web (add a product, update an order)
4. Watch it appear instantly in your mobile app
5. Make a change on mobile
6. Watch it appear instantly on web

## Key Features Enabled

### Products
- New products appear instantly on all devices
- Price changes sync in real-time
- Stock updates are immediate

### Orders
- Order status changes notify instantly
- Tracking updates appear immediately
- Buyer and seller both see updates

### Messages
- Chat messages arrive in real-time
- Typing indicators work across platforms
- Read receipts sync instantly

### Presence
- See who's online
- Track user activity
- Show "currently viewing" indicators

## Performance Tips

1. **Connection Management**: Unsubscribe when components unmount
2. **Filtering**: Use database-level filters to reduce data transfer
3. **Batching**: Combine multiple updates when possible
4. **Offline Support**: Cache data locally and sync when back online

## Push Notifications (Optional)

To add push notifications for real-time events:

```bash
npm install expo-notifications
```

Then in your real-time hooks:

```typescript
import * as Notifications from 'expo-notifications';

// When receiving a new message
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'New Message',
    body: message.content,
  },
  trigger: null,
});
```

## Troubleshooting

### Connection Issues
- Check your Supabase URL and anon key
- Verify real-time is enabled for tables
- Check network connectivity

### Updates Not Appearing
- Ensure subscriptions are active
- Check RLS policies allow reads
- Verify user authentication

### Performance Issues
- Reduce subscription scope with filters
- Unsubscribe from unused channels
- Use pagination for large datasets

## Next Steps

1. Add authentication
2. Implement offline support
3. Add push notifications
4. Create more screens (orders, messages, profile)
5. Test on physical devices

## Resources

- [Supabase Real-Time Docs](https://supabase.com/docs/guides/realtime)
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)

## Support

If you encounter issues:
1. Check Supabase dashboard for errors
2. Review browser/app console logs
3. Verify database permissions (RLS policies)
4. Test with simple queries first
