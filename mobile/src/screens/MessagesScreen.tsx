import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from '../navigation/types';
import { formatDistanceToNow } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Conversation {
  userId: string;
  displayName: string;
  handle: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function MessagesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchConversations();

    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!messages) {
      setLoading(false);
      return;
    }

    const conversationMap = new Map<string, any>();
    for (const msg of messages) {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unreadCount: !msg.read && msg.receiver_id === user.id ? 1 : 0,
        });
      } else if (!msg.read && msg.receiver_id === user.id) {
        const conv = conversationMap.get(otherUserId);
        conv.unreadCount += 1;
      }
    }

    const userIds = Array.from(conversationMap.keys());
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, handle')
        .in('id', userIds);

      if (profiles) {
        for (const profile of profiles) {
          const conv = conversationMap.get(profile.id);
          if (conv) {
            conv.displayName = profile.display_name;
            conv.handle = profile.handle;
          }
        }
      }
    }

    setConversations(Array.from(conversationMap.values()));
    setLoading(false);
  };

  const handleConversationPress = (conv: Conversation) => {
    navigation.navigate('ChatThread', { userId: conv.userId, userName: conv.displayName });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => handleConversationPress(item)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.displayName || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName}>{item.displayName || 'Unknown'}</Text>
                <Text style={styles.conversationTime}>
                  {formatDistanceToNow(new Date(item.lastMessageAt), { addSuffix: true })}
                </Text>
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {loading ? 'Loading messages...' : 'No conversations yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              Messages from transactions and inquiries will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading1,
  },
  list: {
    padding: spacing.lg,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    ...typography.body,
    fontWeight: '600',
  },
  conversationTime: {
    ...typography.caption,
  },
  lastMessage: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  unreadText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    ...typography.heading3,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
