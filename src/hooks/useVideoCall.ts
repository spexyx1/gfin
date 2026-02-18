import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase, requireSupabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export type CallStatus = 'ringing' | 'active' | 'ended' | 'declined';

export interface CallSession {
  id: string;
  conversationId: string;
  initiatedBy: string;
  roomName: string;
  status: CallStatus;
  createdAt: Date;
  endedAt?: Date;
}

export interface IncomingCall {
  session: CallSession;
  callerName: string;
  callerAvatar?: string;
}

export function useVideoCall() {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase
      .channel('call_sessions_' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
        },
        async (payload) => {
          const row = payload.new as any;
          if (row.initiated_by === user.id) return;

          try {
            const supabaseClient = requireSupabase();
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('display_name, username, avatar')
              .eq('id', row.initiated_by)
              .maybeSingle();

            const session: CallSession = {
              id: row.id,
              conversationId: row.conversation_id,
              initiatedBy: row.initiated_by,
              roomName: row.room_name,
              status: row.status,
              createdAt: new Date(row.created_at),
            };

            setIncomingCall({
              session,
              callerName: profile?.display_name || profile?.username || 'Unknown User',
              callerAvatar: profile?.avatar,
            });
          } catch (err) {
            logger.error('Failed to process incoming call', 'useVideoCall', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
        },
        (payload) => {
          const row = payload.new as any;

          if (activeCall && activeCall.id === row.id) {
            if (row.status === 'ended' || row.status === 'declined') {
              setActiveCall(null);
            } else {
              setActiveCall(prev => prev ? { ...prev, status: row.status } : null);
            }
          }

          if (incomingCall && incomingCall.session.id === row.id) {
            if (row.status === 'ended' || row.status === 'declined') {
              setIncomingCall(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, activeCall, incomingCall]);

  const initiateCall = useCallback(async (conversationId: string): Promise<CallSession | null> => {
    if (!user) return null;

    setIsInitiating(true);
    try {
      const supabaseClient = requireSupabase();
      const roomName = `call-${conversationId.slice(0, 8)}-${Date.now()}`;

      const { data, error } = await supabaseClient
        .from('call_sessions')
        .insert({
          conversation_id: conversationId,
          initiated_by: user.id,
          room_name: roomName,
          status: 'ringing',
        })
        .select()
        .single();

      if (error) throw error;

      const session: CallSession = {
        id: data.id,
        conversationId: data.conversation_id,
        initiatedBy: data.initiated_by,
        roomName: data.room_name,
        status: data.status,
        createdAt: new Date(data.created_at),
      };

      setActiveCall(session);
      return session;
    } catch (err) {
      logger.error('Failed to initiate call', 'useVideoCall', err);
      return null;
    } finally {
      setIsInitiating(false);
    }
  }, [user]);

  const acceptCall = useCallback(async (session: CallSession): Promise<void> => {
    if (!user) return;

    try {
      const supabaseClient = requireSupabase();
      const { error } = await supabaseClient
        .from('call_sessions')
        .update({ status: 'active' })
        .eq('id', session.id);

      if (error) throw error;

      setActiveCall({ ...session, status: 'active' });
      setIncomingCall(null);
    } catch (err) {
      logger.error('Failed to accept call', 'useVideoCall', err);
    }
  }, [user]);

  const declineCall = useCallback(async (session: CallSession): Promise<void> => {
    if (!user) return;

    try {
      const supabaseClient = requireSupabase();
      const { error } = await supabaseClient
        .from('call_sessions')
        .update({ status: 'declined', ended_at: new Date().toISOString() })
        .eq('id', session.id);

      if (error) throw error;

      setIncomingCall(null);
    } catch (err) {
      logger.error('Failed to decline call', 'useVideoCall', err);
    }
  }, [user]);

  const endCall = useCallback(async (): Promise<void> => {
    if (!user || !activeCall) return;

    try {
      const supabaseClient = requireSupabase();
      const { error } = await supabaseClient
        .from('call_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', activeCall.id);

      if (error) throw error;

      setActiveCall(null);
    } catch (err) {
      logger.error('Failed to end call', 'useVideoCall', err);
      setActiveCall(null);
    }
  }, [user, activeCall]);

  return {
    activeCall,
    incomingCall,
    isInitiating,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
  };
}
