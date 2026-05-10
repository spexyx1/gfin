import { useState } from 'react';
import { requireSupabase } from '../lib/supabase';

export interface TransactionReputation {
  id: string;
  user_id: string;
  status: 'reliable' | 'caution';
  total_transactions: number;
  successful_count: number;
  disputed_count: number;
  consecutive_unsuccessful: number;
  last_unsuccessful_date?: string;
  suspension_count: number;
  last_suspension_date?: string;
  suspension_end_date?: string;
  is_suspended: boolean;
  collateral_held: boolean;
  collateral_redemption_requested: boolean;
  member_since: string;
  created_at: string;
  updated_at: string;
}

export interface ReputationHistory {
  id: string;
  user_id: string;
  event_type: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  triggered_by: string;
  moderator_id?: string;
  details: any;
  created_at: string;
}

export function useReputation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMyReputation = async () => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return null;

    const { data, error } = await db
      .from('transaction_reputation')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  const getUserReputation = async (userId: string) => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('transaction_reputation')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  const getReputationHistory = async (userId?: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const targetUserId = userId || user.id;

    const { data, error } = await db
      .from('transaction_reputation_history')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const overrideSuspension = async (userId: string, reason: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await db
      .from('transaction_reputation')
      .update({
        is_suspended: false,
        status: 'reliable',
        consecutive_unsuccessful: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    const { error: overrideError } = await db
      .from('suspension_overrides')
      .insert({
        user_id: userId,
        overridden_by: user.id,
        reason
      });

    if (overrideError) throw overrideError;

    const { error: historyError } = await db
      .from('transaction_reputation_history')
      .insert({
        user_id: userId,
        event_type: 'override',
        old_value: 'suspended',
        new_value: 'reliable',
        reason,
        triggered_by: 'manual',
        moderator_id: user.id
      });

    if (historyError) throw historyError;
  };

  const requestCollateralRedemption = async () => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await db
      .from('transaction_reputation')
      .update({
        collateral_redemption_requested: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) throw error;
  };

  const processCollateralRedemption = async (
    userId: string,
    approve: boolean,
    notes: string
  ) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (approve) {
      const { error } = await db
        .from('transaction_reputation')
        .update({
          collateral_held: false,
          collateral_redemption_requested: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      await db
        .from('transaction_reputation_history')
        .insert({
          user_id: userId,
          event_type: 'collateral_release',
          old_value: 'held',
          new_value: 'released',
          reason: notes,
          triggered_by: 'manual',
          moderator_id: user.id
        });
    } else {
      await db
        .from('transaction_reputation')
        .update({
          collateral_redemption_requested: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      await db
        .from('transaction_reputation_history')
        .insert({
          user_id: userId,
          event_type: 'collateral_hold',
          reason: `Redemption denied: ${notes}`,
          triggered_by: 'manual',
          moderator_id: user.id
        });
    }
  };

  const getAllSuspendedUsers = async () => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('transaction_reputation')
      .select('*, profile:profiles!user_id(username, display_name)')
      .eq('is_suspended', true)
      .order('last_suspension_date', { ascending: false });

    if (error) throw error;
    return data;
  };

  const getCollateralRedemptionRequests = async () => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('transaction_reputation')
      .select('*, profile:profiles!user_id(username, display_name, email)')
      .eq('collateral_redemption_requested', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const liftExpiredSuspensions = async () => {
    const db = requireSupabase();
    const { error } = await db.rpc('lift_expired_suspensions');
    if (error) throw error;
  };

  return {
    loading,
    error,
    getMyReputation,
    getUserReputation,
    getReputationHistory,
    overrideSuspension,
    requestCollateralRedemption,
    processCollateralRedemption,
    getAllSuspendedUsers,
    getCollateralRedemptionRequests,
    liftExpiredSuspensions
  };
}
