import { useState, useEffect } from 'react';
import { requireSupabase } from '../lib/supabase';

export interface TokenOperation {
  id: string;
  operation_type: string;
  treasurer_id: string;
  wallet_address?: string;
  token_id?: string;
  amount?: number;
  reason?: string;
  transaction_hash?: string;
  metadata: any;
  created_at: string;
}

export interface BlacklistedWallet {
  id: string;
  wallet_address: string;
  blacklisted_by: string;
  reason: string;
  evidence: any;
  blacklisted_at: string;
  active: boolean;
}

export interface BlacklistedToken {
  id: string;
  token_id: string;
  order_id?: string;
  blacklisted_by: string;
  reason: string;
  evidence: any;
  blacklisted_at: string;
  active: boolean;
}

export function useTreasurer() {
  const [operations, setOperations] = useState<TokenOperation[]>([]);
  const [blacklistedWallets, setBlacklistedWallets] = useState<BlacklistedWallet[]>([]);
  const [blacklistedTokens, setBlacklistedTokens] = useState<BlacklistedToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isTreasurer = async () => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return false;

    const { data } = await db
      .from('user_admin_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role_type', 'treasurer')
      .eq('active', true)
      .maybeSingle();

    return !!data;
  };

  const logOperation = async (
    operationType: string,
    data: Partial<TokenOperation>
  ) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: operation, error } = await db
      .from('ghetto_token_operations')
      .insert({
        operation_type: operationType,
        treasurer_id: user.id,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return operation;
  };

  const blacklistWallet = async (walletAddress: string, reason: string, evidence: any = {}) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('wallet_blacklist')
      .insert({
        wallet_address: walletAddress,
        blacklisted_by: user.id,
        reason,
        evidence
      })
      .select()
      .single();

    if (error) throw error;
    await fetchBlacklistedWallets();
    return data;
  };

  const unblacklistWallet = async (walletId: string) => {
    const db = requireSupabase();
    const { error } = await db
      .from('wallet_blacklist')
      .update({ active: false })
      .eq('id', walletId);

    if (error) throw error;
    await fetchBlacklistedWallets();
  };

  const blacklistToken = async (tokenId: string, reason: string, orderId?: string, evidence: any = {}) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('token_blacklist')
      .insert({
        token_id: tokenId,
        order_id: orderId,
        blacklisted_by: user.id,
        reason,
        evidence
      })
      .select()
      .single();

    if (error) throw error;
    await fetchBlacklistedTokens();
    return data;
  };

  const unblacklistToken = async (tokenBlacklistId: string) => {
    const db = requireSupabase();
    const { error } = await db
      .from('token_blacklist')
      .update({ active: false })
      .eq('id', tokenBlacklistId);

    if (error) throw error;
    await fetchBlacklistedTokens();
  };

  const fetchOperations = async () => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('ghetto_token_operations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      setError(error.message);
    } else {
      setOperations(data || []);
    }
  };

  const fetchBlacklistedWallets = async () => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('wallet_blacklist')
      .select('*')
      .eq('active', true)
      .order('blacklisted_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setBlacklistedWallets(data || []);
    }
  };

  const fetchBlacklistedTokens = async () => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('token_blacklist')
      .select('*')
      .eq('active', true)
      .order('blacklisted_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setBlacklistedTokens(data || []);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchOperations(),
        fetchBlacklistedWallets(),
        fetchBlacklistedTokens()
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    operations,
    blacklistedWallets,
    blacklistedTokens,
    loading,
    error,
    isTreasurer,
    logOperation,
    blacklistWallet,
    unblacklistWallet,
    blacklistToken,
    unblacklistToken,
    refresh: fetchAll
  };
}
