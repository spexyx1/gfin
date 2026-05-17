import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Message } from '../types/database';
import { RootStackParamList } from '../navigation/types';
import { formatDistanceToNow } from 'date-fns';

type RouteProps = RouteProp<RootStackParamList, 'ChatThread'>;

export function ChatThreadScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const { userId, userName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ headerTitle: userName });
  }, [userName, navigation]);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    markAsRead();

    const channel = supabase
      .channel(`chat-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as Message;
        if (
          (msg.sender_id === userId && msg.receiver_id === user.id) ||
          (msg.sender_id === user.id && msg.receiver_id === userId)
        ) {
          setMessages(prev => [...prev, msg]);
          markAsRead();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userId]);

  const fetchMessages = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const markAsRead = async () => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', userId)
      .eq('receiver_id', user.id)
      .eq('read', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: userId,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
    }
    setSending(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMine && styles.myMessageText]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Start a conversation with {userName}</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesList: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  messageBubble: {
    maxWidth: '78%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    ...typography.body,
    color: colors.text,
  },
  myMessageText: {
    color: colors.textInverse,
  },
  messageTime: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  myMessageTime: {
    color: 'rgba(0,0,0,0.5)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 14,
  },
});
