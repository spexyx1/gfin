import { useEffect, useState } from 'react';
import { realtimeService, OrderChangePayload } from '../services/realtimeService';
import { Order } from '../types';
import { useAuth } from './useAuth';

interface UseRealtimeOrdersOptions {
  onOrderAdded?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
  onOrderDeleted?: (order: Order) => void;
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}) {
  const { user } = useAuth();
  const [realtimeOrders, setRealtimeOrders] = useState<Order[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const handleOrderChange = (payload: OrderChangePayload) => {
      setLastUpdate(new Date());

      switch (payload.event) {
        case 'INSERT':
          setRealtimeOrders((prev) => [payload.order, ...prev]);
          setUnreadCount((prev) => prev + 1);
          options.onOrderAdded?.(payload.order);

          if (Notification.permission === 'granted') {
            new Notification('New Order', {
              body: `Order #${payload.order.id.slice(0, 8)} received`,
              icon: '/icons/icon-192x192.svg',
            });
          }
          break;

        case 'UPDATE':
          setRealtimeOrders((prev) =>
            prev.map((o) => (o.id === payload.order.id ? payload.order : o))
          );
          options.onOrderUpdated?.(payload.order);

          if (Notification.permission === 'granted') {
            new Notification('Order Updated', {
              body: `Order #${payload.order.id.slice(0, 8)} status: ${payload.order.status}`,
              icon: '/icons/icon-192x192.svg',
            });
          }
          break;

        case 'DELETE':
          setRealtimeOrders((prev) => prev.filter((o) => o.id !== payload.order.id));
          options.onOrderDeleted?.(payload.order);
          break;
      }
    };

    const subscription = realtimeService.subscribeToOrders(user.id, handleOrderChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return {
    realtimeOrders,
    lastUpdate,
    unreadCount,
    markAsRead,
  };
}
