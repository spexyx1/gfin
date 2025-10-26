import { useState, useEffect, useCallback } from 'react';
import { supabase, requireSupabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from './useAuth';
import { ReferralCode, ReferredUser, ReferralBalance, ReferralTransaction, PlatformSetting } from '../types';

export function useReferrals() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [referralBalance, setReferralBalance] = useState<ReferralBalance | null>(null);
  const [referralTransactions, setReferralTransactions] = useState<ReferralTransaction[]>([]);
  const [platformSettings, setPlatformSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReferralData = useCallback(async () => {
    if (!user) {
      setReferralCode(null);
      setReferredUsers([]);
      setReferralBalance(null);
      setReferralTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const supabaseClient = requireSupabase();

      // Load referral code
      const { data: codeData, error: codeError } = await supabaseClient
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (codeError && codeError.code !== 'PGRST116') throw codeError; // PGRST116 = no rows found
      if (codeData) {
        setReferralCode({
          id: codeData.id,
          userId: codeData.user_id,
          code: codeData.code,
          createdAt: new Date(codeData.created_at),
        });
      } else {
        setReferralCode(null);
      }

      // Load referred users
      const { data: referredData, error: referredError } = await supabaseClient
        .from('referred_users')
        .select('*')
        .eq('referrer_id', user.id);
      if (referredError) throw referredError;
      setReferredUsers(referredData.map(ru => ({
        id: ru.id,
        referrerId: ru.referrer_id,
        referredUserId: ru.referred_user_id,
        accountRewardClaimed: ru.account_reward_claimed,
        firstPurchaseRewardClaimed: ru.first_purchase_reward_claimed,
        createdAt: new Date(ru.created_at),
      })));

      // Load referral balance
      const { data: balanceData, error: balanceError } = await supabaseClient
        .from('referral_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;
      if (balanceData) {
        setReferralBalance({
          userId: balanceData.user_id,
          balanceGhetto: parseFloat(balanceData.balance_ghetto),
          updatedAt: new Date(balanceData.updated_at),
        });
      } else {
        setReferralBalance(null);
      }

      // Load referral transactions
      const { data: transactionsData, error: transactionsError } = await supabaseClient
        .from('referral_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (transactionsError) throw transactionsError;
      setReferralTransactions(transactionsData.map(tx => ({
        id: tx.id,
        userId: tx.user_id,
        type: tx.type,
        amountGhetto: parseFloat(tx.amount_ghetto),
        sourceId: tx.source_id,
        createdAt: new Date(tx.created_at),
      })));

    } catch (err) {
      console.error('Error loading referral data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load referral data');
      handleSupabaseError(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadPlatformSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabaseClient = requireSupabase();
      const { data, error: settingsError } = await supabaseClient
        .from('platform_settings')
        .select('*');
      if (settingsError) throw settingsError;

      const settingsMap: Record<string, string> = {};
      data.forEach((setting: PlatformSetting) => {
        settingsMap[setting.key] = setting.value;
      });
      setPlatformSettings(settingsMap);
    } catch (err) {
      console.error('Error loading platform settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load platform settings');
      handleSupabaseError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferralData();
    loadPlatformSettings();
  }, [user, loadReferralData, loadPlatformSettings]);

  const redeemBalance = useCallback(async (amount: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setIsLoading(true);
    setError(null);
    try {
      const supabaseClient = requireSupabase();
      const { error: rpcError } = await supabaseClient.rpc('redeem_referral_balance', {
        p_user_id: user.id,
        p_amount: amount,
      });
      if (rpcError) throw rpcError;
      await loadReferralData(); // Refresh data
      return true;
    } catch (err) {
      console.error('Error redeeming balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to redeem balance');
      handleSupabaseError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, loadReferralData]);

  return {
    referralCode,
    referredUsers,
    referralBalance,
    referralTransactions,
    platformSettings,
    isLoading,
    error,
    loadReferralData,
    redeemBalance,
  };
}