import { useState, useEffect } from 'react';
import { requireSupabase } from '../lib/supabase';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';

interface SupportedToken {
  id: string;
  chain_id: number;
  chain_name: string;
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_decimals: number;
  is_gasless_enabled: boolean;
  is_active: boolean;
  icon_url: string | null;
}

interface AtomicSwap {
  id: string;
  initiator_id: string;
  recipient_id: string;
  initiator_token_id: string;
  recipient_token_id: string;
  initiator_amount: string;
  recipient_amount: string;
  initiator_chain_id: number;
  recipient_chain_id: number;
  status: string;
  is_gasless: boolean;
  gas_covered_by_platform: boolean;
  swap_hash: string | null;
  initiator_signed: boolean;
  recipient_signed: boolean;
  expires_at: string;
  completed_at: string | null;
  created_at: string;
  initiator_token?: SupportedToken;
  recipient_token?: SupportedToken;
}

export function useAtomicSwap() {
  const [supportedTokens, setSupportedTokens] = useState<SupportedToken[]>([]);
  const [userSwaps, setUserSwaps] = useState<AtomicSwap[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSupportedTokens = async () => {
    try {
      const { data, error } = await requireSupabase()
        .from('supported_swap_tokens')
        .select('*')
        .eq('is_active', true)
        .order('chain_id', { ascending: true })
        .order('token_symbol', { ascending: true });

      if (error) throw error;
      setSupportedTokens(data || []);
    } catch (error) {
      logger.error('Error loading supported tokens', 'useAtomicSwap', error);
    }
  };

  const loadUserSwaps = async (userId: string) => {
    try {
      const { data, error } = await requireSupabase()
        .from('atomic_swaps')
        .select(`
          *,
          initiator_token:initiator_token_id(
            id,
            chain_name,
            token_symbol,
            token_name,
            is_gasless_enabled
          ),
          recipient_token:recipient_token_id(
            id,
            chain_name,
            token_symbol,
            token_name,
            is_gasless_enabled
          )
        `)
        .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUserSwaps(data || []);
    } catch (error) {
      logger.error('Error loading user swaps', 'useAtomicSwap', error);
    }
  };

  const createSwap = async (params: {
    recipientAddress: string;
    initiatorTokenId: string;
    recipientTokenId: string;
    initiatorAmount: string;
    recipientAmount: string;
    duration: number;
  }): Promise<boolean> => {
    setLoading(true);
    try {
      const db = requireSupabase();
      const { data: session } = await db.auth.getSession();
      if (!session.session?.user) {
        throw new Error('Not authenticated');
      }

      const initiatorToken = supportedTokens.find(t => t.id === params.initiatorTokenId);
      const recipientToken = supportedTokens.find(t => t.id === params.recipientTokenId);

      if (!initiatorToken || !recipientToken) {
        throw new Error('Invalid tokens');
      }

      const isGasless = initiatorToken.is_gasless_enabled && recipientToken.is_gasless_enabled;

      const { data: recipientProfile, error: profileError } = await db
        .from('profiles')
        .select('id')
        .eq('wallet_address', params.recipientAddress)
        .maybeSingle();

      if (profileError) throw profileError;

      const { error } = await db
        .from('atomic_swaps')
        .insert({
          initiator_id: session.session.user.id,
          recipient_id: recipientProfile?.id || null,
          initiator_token_id: params.initiatorTokenId,
          recipient_token_id: params.recipientTokenId,
          initiator_amount: params.initiatorAmount,
          recipient_amount: params.recipientAmount,
          initiator_chain_id: initiatorToken.chain_id,
          recipient_chain_id: recipientToken.chain_id,
          is_gasless: isGasless,
          gas_covered_by_platform: isGasless,
          expires_at: new Date(Date.now() + params.duration * 1000).toISOString()
        });

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error creating swap', 'useAtomicSwap', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const depositTokens = async (swapId: string, isInitiator: boolean): Promise<boolean> => {
    setLoading(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to deposit tokens');
        return false;
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      const db = requireSupabase();
      const { data: swap, error } = await db
        .from('atomic_swaps')
        .select(`
          *,
          initiator_token:initiator_token_id(*),
          recipient_token:recipient_token_id(*)
        `)
        .eq('id', swapId)
        .single();

      if (error || !swap) throw new Error('Swap not found');

      const token = isInitiator ? swap.initiator_token : swap.recipient_token;
      const amount = isInitiator ? swap.initiator_amount : swap.recipient_amount;

      const tokenContract = new ethers.Contract(
        token.token_address,
        [
          'function approve(address spender, uint256 amount) external returns (bool)',
          'function transfer(address to, uint256 amount) external returns (bool)'
        ],
        signer
      );

      const amountInWei = ethers.parseUnits(amount, token.token_decimals);

      const tx = await tokenContract.approve(
        '0x0000000000000000000000000000000000000000',
        amountInWei
      );

      await tx.wait();

      const { error: updateError } = await db
        .from('atomic_swaps')
        .update({
          [isInitiator ? 'initiator_signed' : 'recipient_signed']: true,
          swap_hash: tx.hash
        })
        .eq('id', swapId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      logger.error('Error depositing tokens', 'useAtomicSwap', error);
      alert('Failed to deposit tokens');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelSwap = async (swapId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await requireSupabase()
        .from('atomic_swaps')
        .update({ status: 'cancelled' })
        .eq('id', swapId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error cancelling swap', 'useAtomicSwap', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const expireOldSwaps = async () => {
    try {
      await requireSupabase().rpc('expire_old_swaps');
    } catch (error) {
      logger.error('Error expiring swaps', 'useAtomicSwap', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      expireOldSwaps();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    supportedTokens,
    userSwaps,
    loading,
    createSwap,
    depositTokens,
    cancelSwap,
    loadSupportedTokens,
    loadUserSwaps,
    expireOldSwaps
  };
}
