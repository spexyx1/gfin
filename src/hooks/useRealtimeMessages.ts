import { useEffect, useState } from 'react';
import { realtimeService, MessageChangePayload } from '../services/realtimeService';
import { Message } from '../types';
import { useAuth } from './useAuth';

interface UseRealtimeMessagesOptions {
  onNewMessage?: (message: Message) => void;
  autoNotify?: boolean;
}

export function useRealtimeMessages(options: UseRealtimeMessagesOptions = {}) {
  const { user } = useAuth();
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const handleMessageChange = (payload: MessageChangePayload) => {
      setLastUpdate(new Date());

      if (payload.event === 'INSERT') {
        setRealtimeMessages((prev) => [payload.message, ...prev]);
        setUnreadCount((prev) => prev + 1);
        options.onNewMessage?.(payload.message);

        if (options.autoNotify !== false && Notification.permission === 'granted') {
          new Notification('New Message', {
            body: payload.message.content.slice(0, 50),
            icon: '/icons/icon-192x192.svg',
          });
        }

        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    };

    const subscription = realtimeService.subscribeToMessages(user.id, handleMessageChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, options.autoNotify]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return {
    realtimeMessages,
    lastUpdate,
    unreadCount,
    markAsRead,
  };
}
