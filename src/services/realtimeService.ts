import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { requireSupabase } from '../lib/supabase';
import { Product, Order, Message } from '../types';
import { logger } from '../utils/logger';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface ProductChangePayload {
  event: RealtimeEvent;
  product: Product;
}

export interface OrderChangePayload {
  event: RealtimeEvent;
  order: Order;
}

export interface MessageChangePayload {
  event: RealtimeEvent;
  message: Message;
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  subscribeToProducts(
    callback: (payload: ProductChangePayload) => void,
    filters?: { sellerId?: string; category?: string }
  ): RealtimeSubscription {
    const channelName = `products:${filters?.sellerId || 'all'}:${filters?.category || 'all'}`;

    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = requireSupabase().channel(channelName);
      this.channels.set(channelName, channel);
    }

    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: filters?.sellerId ? `seller_id=eq.${filters.sellerId}` : undefined,
        },
        (payload: RealtimePostgresChangesPayload<Product>) => {
          callback({
            event: payload.eventType as RealtimeEvent,
            product: (payload.new as Product) || (payload.old as Product),
          });
        }
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => {
        channel?.unsubscribe();
        this.channels.delete(channelName);
      },
    };
  }

  subscribeToOrders(
    userId: string,
    callback: (payload: OrderChangePayload) => void
  ): RealtimeSubscription {
    const channelName = `orders:${userId}`;

    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = requireSupabase().channel(channelName);
      this.channels.set(channelName, channel);
    }

    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          callback({
            event: payload.eventType as RealtimeEvent,
            order: (payload.new as Order) || (payload.old as Order),
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          callback({
            event: payload.eventType as RealtimeEvent,
            order: (payload.new as Order) || (payload.old as Order),
          });
        }
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => {
        channel?.unsubscribe();
        this.channels.delete(channelName);
      },
    };
  }

  subscribeToMessages(
    userId: string,
    callback: (payload: MessageChangePayload) => void
  ): RealtimeSubscription {
    const channelName = `messages:${userId}`;

    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = requireSupabase().channel(channelName);
      this.channels.set(channelName, channel);
    }

    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          callback({
            event: 'INSERT',
            message: payload.new as Message,
          });
        }
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => {
        channel?.unsubscribe();
        this.channels.delete(channelName);
      },
    };
  }

  subscribeToUserPresence(
    roomName: string,
    userId: string,
    metadata?: Record<string, any>
  ): RealtimeSubscription {
    const channelName = `presence:${roomName}`;

    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = requireSupabase().channel(channelName);
      this.channels.set(channelName, channel);
    }

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        logger.debug('Presence state', 'RealtimeService', { state });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        logger.debug('User joined', 'RealtimeService', { key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        logger.debug('User left', 'RealtimeService', { key, leftPresences });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...metadata,
          });
        }
      });

    return {
      channel,
      unsubscribe: () => {
        channel?.unsubscribe();
        this.channels.delete(channelName);
      },
    };
  }

  subscribeToBroadcast(
    channelName: string,
    eventName: string,
    callback: (payload: any) => void
  ): RealtimeSubscription {
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = requireSupabase().channel(channelName);
      this.channels.set(channelName, channel);
    }

    channel
      .on('broadcast', { event: eventName }, (payload) => {
        callback(payload);
      })
      .subscribe();

    return {
      channel,
      unsubscribe: () => {
        channel?.unsubscribe();
        this.channels.delete(channelName);
      },
    };
  }

  async broadcast(channelName: string, eventName: string, payload: any): Promise<void> {
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = requireSupabase().channel(channelName);
      this.channels.set(channelName, channel);
      await channel.subscribe();
    }

    await channel.send({
      type: 'broadcast',
      event: eventName,
      payload,
    });
  }

  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

export const realtimeService = new RealtimeService();
