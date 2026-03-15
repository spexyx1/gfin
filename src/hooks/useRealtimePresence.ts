import { useEffect, useState } from 'react';
import { realtimeService } from '../services/realtimeService';
import { useAuth } from './useAuth';

interface PresenceUser {
  user_id: string;
  online_at: string;
  [key: string]: any;
}

interface UseRealtimePresenceOptions {
  roomName: string;
  metadata?: Record<string, any>;
}

export function useRealtimePresence(options: UseRealtimePresenceOptions) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    setIsTracking(true);

    const subscription = realtimeService.subscribeToUserPresence(
      options.roomName,
      user.id,
      options.metadata
    );

    const channel = subscription.channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users: PresenceUser[] = [];

      Object.keys(state).forEach((key) => {
        const presences = state[key] as PresenceUser[];
        users.push(...presences);
      });

      setOnlineUsers(users);
    });

    return () => {
      setIsTracking(false);
      subscription.unsubscribe();
    };
  }, [user?.id, options.roomName, JSON.stringify(options.metadata)]);

  return {
    onlineUsers,
    isTracking,
    onlineCount: onlineUsers.length,
  };
}
