import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useBlockchainService } from './useBlockchainService';
import { useContractAddresses } from './useContractAddresses';
import { requireSupabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { GHETTO_TOKEN_ABI } from '../config/contractAbis';

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  externalTransfersAllowed: boolean;
  paused: boolean;
  owner: string;
  contractAddress: string;
}

export interface TokenHolder {
  address: string;
  balance: number;
  balanceWei: string;
  percentageOfSupply: number;
  isBlacklisted: boolean;
  isWhitelisted: boolean;
  transactionCount: number;
  lastTransferAt?: Date;
}

export interface TokenTransfer {
  from: string;
  to: string;
  amount: number;
  amountWei: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  transferType: 'transfer' | 'mint' | 'burn';
}

export function useTokenManager() {
  const { addresses } = useContractAddresses('polygon');
  const {
    executeTransaction,
    getContract,
    recordEvent,
    isLoading: blockchainLoading
  } = useBlockchainService();

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [transfers, setTransfers] = useState<TokenTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const tokenAddress = addresses.ghettoToken || import.meta.env.VITE_GHETTO_TOKEN_ADDRESS;
  const DECIMALS = 2;

  const getTokenContract = useCallback(() => {
    return {
      address: tokenAddress,
      abi: GHETTO_TOKEN_ABI,
      name: 'GhettoToken',
      type: 'token' as const
    };
  }, [tokenAddress]);

  const loadTokenInfo = useCallback(async () => {
    try {
      const contract = await getContract(getTokenContract());

      const [tokenInfoData, paused, owner] = await Promise.all([
        contract.getTokenInfo(),
        contract.paused(),
        contract.owner()
      ]);

      const info: TokenInfo = {
        name: tokenInfoData[0],
        symbol: tokenInfoData[1],
        decimals: parseInt(tokenInfoData[2].toString()),
        totalSupply: parseFloat(ethers.formatUnits(tokenInfoData[3], DECIMALS)),
        externalTransfersAllowed: tokenInfoData[4],
        paused,
        owner,
        contractAddress: tokenAddress
      };

      setTokenInfo(info);
      return info;
    } catch (error) {
      logger.error('Failed to load token info', 'useTokenManager', error);
      throw error;
    }
  }, [getContract, getTokenContract, tokenAddress]);

  const loadHolders = useCallback(async () => {
    try {
      const supabaseClient = requireSupabase();

      const { data, error } = await supabaseClient
        .from('token_holders')
        .select('*')
        .order('balance', { ascending: false });

      if (error) throw error;

      const holderList: TokenHolder[] = (data || []).map(h => ({
        address: h.wallet_address,
        balance: parseFloat(h.balance),
        balanceWei: h.balance_wei,
        percentageOfSupply: parseFloat(h.percentage_of_supply || 0),
        isBlacklisted: h.is_blacklisted || false,
        isWhitelisted: h.is_whitelisted || false,
        transactionCount: h.transaction_count || 0,
        lastTransferAt: h.last_transfer_at ? new Date(h.last_transfer_at) : undefined
      }));

      setHolders(holderList);
      return holderList;
    } catch (error) {
      logger.error('Failed to load holders', 'useTokenManager', error);
      return [];
    }
  }, []);

  const loadTransfers = useCallback(async (limit: number = 100) => {
    try {
      const supabaseClient = requireSupabase();

      const { data, error } = await supabaseClient
        .from('token_transfers')
        .select('*')
        .eq('token_contract', tokenAddress)
        .order('block_timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const transferList: TokenTransfer[] = (data || []).map(t => ({
        from: t.from_address,
        to: t.to_address,
        amount: parseFloat(t.amount),
        amountWei: t.amount_wei,
        txHash: t.tx_hash,
        blockNumber: parseInt(t.block_number),
        timestamp: new Date(t.block_timestamp),
        transferType: t.transfer_type || 'transfer'
      }));

      setTransfers(transferList);
      return transferList;
    } catch (error) {
      logger.error('Failed to load transfers', 'useTokenManager', error);
      return [];
    }
  }, [tokenAddress]);

  const mintTokens = useCallback(async (toAddress: string, amount: number): Promise<string> => {
    try {
      setIsLoading(true);

      const amountWei = ethers.parseUnits(amount.toString(), DECIMALS);

      const receipt = await executeTransaction(
        getTokenContract(),
        'mint',
        [toAddress, amountWei]
      );

      await loadTokenInfo();
      await loadHolders();

      logger.info('Tokens minted successfully', 'useTokenManager', {
        to: toAddress,
        amount,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to mint tokens', 'useTokenManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getTokenContract, loadTokenInfo, loadHolders]);

  const burnTokens = useCallback(async (amount: number, fromAddress?: string): Promise<string> => {
    try {
      setIsLoading(true);

      const amountWei = ethers.parseUnits(amount.toString(), DECIMALS);

      const receipt = fromAddress
        ? await executeTransaction(getTokenContract(), 'burnFrom', [fromAddress, amountWei])
        : await executeTransaction(getTokenContract(), 'burn', [amountWei]);

      await loadTokenInfo();
      await loadHolders();

      logger.info('Tokens burned successfully', 'useTokenManager', {
        from: fromAddress,
        amount,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to burn tokens', 'useTokenManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getTokenContract, loadTokenInfo, loadHolders]);

  const setAddressBlacklisted = useCallback(async (
    address: string,
    blacklisted: boolean,
    reason?: string
  ): Promise<string> => {
    try {
      setIsLoading(true);

      const receipt = await executeTransaction(
        getTokenContract(),
        'setBlacklisted',
        [address, blacklisted]
      );

      const supabaseClient = requireSupabase();
      await supabaseClient
        .from('token_holders')
        .update({ is_blacklisted: blacklisted, updated_at: new Date().toISOString() })
        .eq('wallet_address', address);

      await loadHolders();

      logger.info('Address blacklist status updated', 'useTokenManager', {
        address,
        blacklisted,
        reason,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to update blacklist status', 'useTokenManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getTokenContract, loadHolders]);

  const setContractWhitelisted = useCallback(async (
    contractAddress: string,
    whitelisted: boolean,
    name?: string
  ): Promise<string> => {
    try {
      setIsLoading(true);

      const receipt = await executeTransaction(
        getTokenContract(),
        'setMarketplaceContract',
        [contractAddress, whitelisted]
      );

      logger.info('Contract whitelist status updated', 'useTokenManager', {
        contract: contractAddress,
        whitelisted,
        name,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to update whitelist status', 'useTokenManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getTokenContract]);

  const toggleExternalTransfers = useCallback(async (allowed: boolean): Promise<string> => {
    try {
      setIsLoading(true);

      const receipt = await executeTransaction(
        getTokenContract(),
        'setExternalTransfersAllowed',
        [allowed]
      );

      await loadTokenInfo();

      logger.info('External transfers toggled', 'useTokenManager', {
        allowed,
        txHash: receipt.hash
      });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to toggle external transfers', 'useTokenManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getTokenContract, loadTokenInfo]);

  const pauseToken = useCallback(async (): Promise<string> => {
    try {
      setIsLoading(true);

      const receipt = await executeTransaction(getTokenContract(), 'pause', []);

      await loadTokenInfo();

      logger.info('Token paused', 'useTokenManager', { txHash: receipt.hash });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to pause token', 'useTokenManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getTokenContract, loadTokenInfo]);

  const unpauseToken = useCallback(async (): Promise<string> => {
    try {
      setIsLoading(true);

      const receipt = await executeTransaction(getTokenContract(), 'unpause', []);

      await loadTokenInfo();

      logger.info('Token unpaused', 'useTokenManager', { txHash: receipt.hash });

      return receipt.hash;
    } catch (error) {
      logger.error('Failed to unpause token', 'useTokenManager', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [executeTransaction, getTokenContract, loadTokenInfo]);

  const checkBalance = useCallback(async (address: string): Promise<number> => {
    try {
      const contract = await getContract(getTokenContract());
      const balance = await contract.balanceOf(address);
      return parseFloat(ethers.formatUnits(balance, DECIMALS));
    } catch (error) {
      logger.error('Failed to check balance', 'useTokenManager', error);
      return 0;
    }
  }, [getContract, getTokenContract]);

  const checkBlacklisted = useCallback(async (address: string): Promise<boolean> => {
    try {
      const contract = await getContract(getTokenContract());
      return await contract.blacklisted(address);
    } catch (error) {
      logger.error('Failed to check blacklist status', 'useTokenManager', error);
      return false;
    }
  }, [getContract, getTokenContract]);

  const checkWhitelisted = useCallback(async (contractAddress: string): Promise<boolean> => {
    try {
      const contract = await getContract(getTokenContract());
      return await contract.marketplaceContracts(contractAddress);
    } catch (error) {
      logger.error('Failed to check whitelist status', 'useTokenManager', error);
      return false;
    }
  }, [getContract, getTokenContract]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTokenInfo(),
        loadHolders(),
        loadTransfers()
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [loadTokenInfo, loadHolders, loadTransfers]);

  useEffect(() => {
    if (tokenAddress) {
      refreshData();
    }
  }, [tokenAddress]);

  return {
    tokenInfo,
    holders,
    transfers,
    isLoading: isLoading || blockchainLoading,
    isSyncing,
    mintTokens,
    burnTokens,
    setAddressBlacklisted,
    setContractWhitelisted,
    toggleExternalTransfers,
    pauseToken,
    unpauseToken,
    checkBalance,
    checkBlacklisted,
    checkWhitelisted,
    loadTokenInfo,
    loadHolders,
    loadTransfers,
    refreshData
  };
}
