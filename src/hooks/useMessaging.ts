import { useState, useEffect } from 'react';
import { Message, Conversation } from '../types';
import { useAuth } from './useAuth';
import { supabase, requireSupabase, handleSupabaseError } from '../lib/supabase';
import { logger } from '../utils/logger';

export function useMessaging() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const { user } = useAuth();

  // Load conversations and messages from Supabase
  useEffect(() => {
    if (user) {
      loadConversations();
      setupRealtimeSubscription();
    } else {
      setConversations([]);
      setMessages({});
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      // Load conversations where user is a participant
      const { data: conversationsData, error } = await supabaseClient
        .from('conversations')
        .select(`
          *,
          messages!inner(
            id,
            sender_id,
            content,
            message_type,
            order_id,
            read,
            created_at
          )
        `)
        .filter('participants', 'cs', `{"${user.id}"}`)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Process conversations and their messages
      const processedConversations: Conversation[] = [];
      const allMessages: Record<string, Message[]> = {};

      for (const conv of conversationsData || []) {
        // Get the last message
        const lastMessage = conv.messages && conv.messages.length > 0 
          ? conv.messages[conv.messages.length - 1] 
          : undefined;

        // Count unread messages
        const unreadCount = conv.messages?.filter((msg: any) => 
          msg.sender_id !== user.id && !msg.read
        ).length || 0;

        const conversation: Conversation = {
          id: conv.id,
          participants: conv.participants,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            conversationId: conv.id,
            senderId: lastMessage.sender_id,
            receiverId: conv.participants.find((p: string) => p !== lastMessage.sender_id) || '',
            content: lastMessage.content,
            timestamp: new Date(lastMessage.created_at),
            read: lastMessage.read,
            messageType: lastMessage.message_type as Message['messageType'],
            orderId: lastMessage.order_id,
          } : undefined,
          unreadCount,
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
        };

        processedConversations.push(conversation);

        // Load all messages for this conversation
        await loadConversationMessages(conv.id);
      }

      setConversations(processedConversations);
    } catch (error) {
      logger.error('Failed to load conversations', 'useMessaging', error);
      handleSupabaseError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    if (!user) return;

    try {
      const supabaseClient = requireSupabase();
      
      const { data: messagesData, error } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Convert database records to Message format
      const conversationMessages: Message[] = messagesData?.map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        receiverId: '', // Will be determined from conversation participants
        content: msg.content,
        timestamp: new Date(msg.created_at),
        read: msg.read,
        messageType: msg.message_type as Message['messageType'],
        orderId: msg.order_id,
      })) || [];

      setMessages(prev => ({
        ...prev,
        [conversationId]: conversationMessages
      }));
    } catch (error) {
      logger.error('Failed to load messages', 'useMessaging', error);
      handleSupabaseError(error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!supabase || !user) return;

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as any;
          
          // Check if this message belongs to user's conversations
          const conversation = conversations.find(conv => conv.id === newMessage.conversation_id);
          if (conversation && conversation.participants.includes(user.id)) {
            const message: Message = {
              id: newMessage.id,
              conversationId: newMessage.conversation_id,
              senderId: newMessage.sender_id,
              receiverId: conversation.participants.find(p => p !== newMessage.sender_id) || '',
              content: newMessage.content,
              timestamp: new Date(newMessage.created_at),
              read: newMessage.read,
              messageType: newMessage.message_type,
              orderId: newMessage.order_id,
            };

            setMessages(prev => ({
              ...prev,
              [newMessage.conversation_id]: [
                ...(prev[newMessage.conversation_id] || []),
                message
              ]
            }));

            // Update conversation with new last message
            setConversations(prev => prev.map(conv => 
              conv.id === newMessage.conversation_id
                ? {
                    ...conv,
                    lastMessage: message,
                    updatedAt: new Date(newMessage.created_at),
                    unreadCount: newMessage.sender_id !== user.id ? conv.unreadCount + 1 : conv.unreadCount
                  }
                : conv
            ));
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  };

  const createConversation = async (participantId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      // Use the database function to find or create conversation
      const { data: conversationId, error } = await supabaseClient
        .rpc('find_or_create_conversation', {
          user1_id: user.id,
          user2_id: participantId
        });

      if (error) {
        throw error;
      }

      // Check if conversation is already in local state
      const existingConv = conversations.find(conv => conv.id === conversationId);
      if (!existingConv) {
        // Load the new conversation
        await loadConversations();
      }

      return conversationId;
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (
    conversationId: string,
    content: string,
    messageType: 'text' | 'order' | 'system' = 'text',
    orderId?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      // Insert message into database
      const { data: newMessage, error } = await supabaseClient
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
          order_id: orderId,
          read: false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newMessage.id;
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      const supabaseClient = requireSupabase();
      
      // Use database function to mark messages as read
      const { error } = await supabaseClient
        .rpc('mark_conversation_read', {
          conv_id: conversationId,
          user_id: user.id
        });

      if (error) {
        throw error;
      }

      // Update local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId]?.map(msg => 
          msg.senderId !== user.id ? { ...msg, read: true } : msg
        ) || []
      }));

      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ));
    } catch (error) {
      logger.error('Failed to mark messages as read', 'useMessaging', error);
      handleSupabaseError(error);
    }
  };

  const getConversationMessages = (conversationId: string): Message[] => {
    return messages[conversationId] || [];
  };

  const getUnreadCount = async (): Promise<number> => {
    if (!user) return 0;

    try {
      const supabaseClient = requireSupabase();
      
      const { data: count, error } = await supabaseClient
        .rpc('get_unread_count', { user_id: user.id });

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      logger.error('Failed to get unread count', 'useMessaging', error);
      return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    }
  };

  const getUserInfo = async (userId: string) => {
    try {
      const supabaseClient = requireSupabase();
      
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('username, display_name, avatar')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return { name: `User ${userId.slice(0, 6)}...${userId.slice(-4)}` };
      }

      return {
        name: profile.display_name || profile.username,
        avatar: profile.avatar,
        username: profile.username,
      };
    } catch (error) {
      logger.error('Failed to get user info', 'useMessaging', error);
      return { name: `User ${userId.slice(0, 6)}...${userId.slice(-4)}` };
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      const supabaseClient = requireSupabase();
      
      // Delete conversation from database (messages will be cascade deleted)
      const { error } = await supabaseClient
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .filter('participants', 'cs', `{"${user.id}"}`);

      if (error) {
        throw error;
      }

      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[conversationId];
        return newMessages;
      });
    } catch (error) {
      logger.error('Failed to delete conversation', 'useMessaging', error);
      handleSupabaseError(error);
    }
  };

  const searchConversations = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return conversations.filter(conv => 
      conv.lastMessage?.content.toLowerCase().includes(lowercaseQuery) ||
      conv.participants.some(p => p.toLowerCase().includes(lowercaseQuery))
    );
  };

  return {
    conversations,
    messages,
    isLoading,
    createConversation,
    sendMessage,
    markAsRead,
    getConversationMessages,
    getUnreadCount,
    getUserInfo,
    deleteConversation,
    searchConversations,
    loadConversations,
  };
}