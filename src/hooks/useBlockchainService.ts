import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { useAuth } from './useAuth';
import { useWeb3 } from './useWeb3';
import { supabase, requireSupabase, handleSupabaseError } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface BlockchainTransaction {
  id?: string;
  txHash: string;
  contractAddress: string;
  contractType: 'token' | 'escrow' | 'other';
  functionName: string;
  fromAddress: string;
  toAddress?: string;
  valueWei?: string;
  valueFormatted?: number;
  gasUsed?: bigint;
  gasPriceGwei?: number;
  totalCostEth?: number;
  status: 'pending' | 'confirmed' | 'failed' | 'reverted';
  confirmations?: number;
  blockNumber?: bigint;
  blockTimestamp?: Date;
  errorMessage?: string;
  metadata?: any;
}

export interface ContractConfig {
  address: string;
  abi: any[];
  name: string;
  type: 'token' | 'escrow';
}

export function useBlockchainService() {
  const { user } = useAuth();
  const { provider, account } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<BlockchainTransaction[]>([]);

  const getPolygonProvider = useCallback(() => {
    if (!provider) {
      const rpcUrl = import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com';
      return new ethers.JsonRpcProvider(rpcUrl);
    }
    return provider;
  }, [provider]);

  const getSigner = useCallback(async () => {
    if (!provider) {
      throw new Error('No wallet provider available');
    }
    return await provider.getSigner();
  }, [provider]);

  const getContract = useCallback(async (config: ContractConfig) => {
    const signer = await getSigner();
    return new ethers.Contract(config.address, config.abi, signer);
  }, [getSigner]);

  const recordTransaction = useCallback(async (tx: BlockchainTransaction) => {
    try {
      const supabaseClient = requireSupabase();

      const { data, error } = await supabaseClient
        .from('blockchain_transactions')
        .insert({
          tx_hash: tx.txHash,
          contract_address: tx.contractAddress,
          contract_type: tx.contractType,
          function_name: tx.functionName,
          from_address: tx.fromAddress,
          to_address: tx.toAddress,
          value_wei: tx.valueWei,
          value_formatted: tx.valueFormatted,
          gas_used: tx.gasUsed ? tx.gasUsed.toString() : null,
          gas_price_gwei: tx.gasPriceGwei,
          total_cost_eth: tx.totalCostEth,
          status: tx.status,
          confirmations: tx.confirmations || 0,
          block_number: tx.blockNumber ? tx.blockNumber.toString() : null,
          block_timestamp: tx.blockTimestamp,
          initiated_by: user?.id,
          error_message: tx.errorMessage,
          metadata: tx.metadata
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Failed to record transaction', 'useBlockchainService', error);
      throw error;
    }
  }, [user]);

  const updateTransactionStatus = useCallback(async (
    txHash: string,
    status: 'pending' | 'confirmed' | 'failed' | 'reverted',
    receipt?: ethers.TransactionReceipt
  ) => {
    try {
      const supabaseClient = requireSupabase();

      const updateData: any = {
        status,
        confirmations: receipt?.confirmations || 0,
        updated_at: new Date().toISOString()
      };

      if (receipt) {
        updateData.gas_used = receipt.gasUsed.toString();
        updateData.block_number = receipt.blockNumber.toString();
        updateData.total_cost_eth = parseFloat(ethers.formatEther(receipt.gasUsed * receipt.gasPrice));

        if (status === 'failed' || status === 'reverted') {
          updateData.error_message = 'Transaction reverted on blockchain';
        }
      }

      const { error } = await supabaseClient
        .from('blockchain_transactions')
        .update(updateData)
        .eq('tx_hash', txHash);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to update transaction status', 'useBlockchainService', error);
    }
  }, []);

  const executeTransaction = useCallback(async (
    contractConfig: ContractConfig,
    functionName: string,
    args: any[],
    options?: { value?: bigint }
  ): Promise<ethers.TransactionReceipt> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);

    try {
      const contract = await getContract(contractConfig);

      logger.info('Executing transaction', 'useBlockchainService', {
        contract: contractConfig.address,
        function: functionName,
        args
      });

      const tx = await contract[functionName](...args, options || {});

      const txRecord: BlockchainTransaction = {
        txHash: tx.hash,
        contractAddress: contractConfig.address,
        contractType: contractConfig.type,
        functionName,
        fromAddress: account,
        status: 'pending',
        valueWei: options?.value?.toString(),
        metadata: { args }
      };

      await recordTransaction(txRecord);

      setPendingTransactions(prev => [...prev, txRecord]);

      logger.info('Transaction submitted', 'useBlockchainService', { hash: tx.hash });

      const receipt = await tx.wait();

      await updateTransactionStatus(
        tx.hash,
        receipt.status === 1 ? 'confirmed' : 'failed',
        receipt
      );

      setPendingTransactions(prev => prev.filter(t => t.txHash !== tx.hash));

      if (receipt.status !== 1) {
        throw new Error('Transaction failed on blockchain');
      }

      logger.info('Transaction confirmed', 'useBlockchainService', {
        hash: tx.hash,
        block: receipt.blockNumber
      });

      return receipt;
    } catch (error: any) {
      logger.error('Transaction failed', 'useBlockchainService', error);

      if (error.transactionHash) {
        await updateTransactionStatus(error.transactionHash, 'failed');
        setPendingTransactions(prev => prev.filter(t => t.txHash !== error.transactionHash));
      }

      throw new Error(error.reason || error.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  }, [account, getContract, recordTransaction, updateTransactionStatus]);

  const waitForConfirmations = useCallback(async (
    txHash: string,
    confirmations: number = 3
  ): Promise<boolean> => {
    try {
      const polygonProvider = getPolygonProvider();
      const receipt = await polygonProvider.waitForTransaction(txHash, confirmations);

      if (receipt) {
        await updateTransactionStatus(txHash, receipt.status === 1 ? 'confirmed' : 'failed', receipt);
        return receipt.status === 1;
      }

      return false;
    } catch (error) {
      logger.error('Error waiting for confirmations', 'useBlockchainService', error);
      return false;
    }
  }, [getPolygonProvider, updateTransactionStatus]);

  const getTransactionHistory = useCallback(async (
    filters?: {
      contractType?: 'token' | 'escrow' | 'other';
      status?: string;
      fromAddress?: string;
      toAddress?: string;
      limit?: number;
    }
  ) => {
    try {
      const supabaseClient = requireSupabase();

      let query = supabaseClient
        .from('blockchain_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.contractType) {
        query = query.eq('contract_type', filters.contractType);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.fromAddress) {
        query = query.eq('from_address', filters.fromAddress);
      }
      if (filters?.toAddress) {
        query = query.eq('to_address', filters.toAddress);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Failed to get transaction history', 'useBlockchainService', error);
      return [];
    }
  }, []);

  const recordEvent = useCallback(async (
    contractAddress: string,
    contractType: 'token' | 'escrow',
    eventName: string,
    eventData: any,
    txHash: string,
    blockNumber: bigint,
    logIndex: number
  ) => {
    try {
      const supabaseClient = requireSupabase();
      const polygonProvider = getPolygonProvider();

      const block = await polygonProvider.getBlock(blockNumber);

      const { error } = await supabaseClient
        .from('contract_events')
        .insert({
          contract_address: contractAddress,
          contract_type: contractType,
          event_name: eventName,
          event_signature: eventData.signature || '',
          event_data: eventData,
          indexed_params: eventData.topics || [],
          tx_hash: txHash,
          block_number: blockNumber.toString(),
          block_timestamp: block?.timestamp ? new Date(block.timestamp * 1000) : new Date(),
          log_index: logIndex
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to record event', 'useBlockchainService', error);
    }
  }, [getPolygonProvider]);

  const getCurrentBlock = useCallback(async (): Promise<number> => {
    try {
      const polygonProvider = getPolygonProvider();
      return await polygonProvider.getBlockNumber();
    } catch (error) {
      logger.error('Failed to get current block', 'useBlockchainService', error);
      return 0;
    }
  }, [getPolygonProvider]);

  const getGasPrice = useCallback(async (): Promise<bigint> => {
    try {
      const polygonProvider = getPolygonProvider();
      const feeData = await polygonProvider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      logger.error('Failed to get gas price', 'useBlockchainService', error);
      return BigInt(0);
    }
  }, [getPolygonProvider]);

  const estimateGas = useCallback(async (
    contractConfig: ContractConfig,
    functionName: string,
    args: any[]
  ): Promise<bigint> => {
    try {
      const contract = await getContract(contractConfig);
      return await contract[functionName].estimateGas(...args);
    } catch (error) {
      logger.error('Failed to estimate gas', 'useBlockchainService', error);
      return BigInt(0);
    }
  }, [getContract]);

  useEffect(() => {
    const checkPendingTransactions = async () => {
      if (pendingTransactions.length === 0) return;

      for (const tx of pendingTransactions) {
        try {
          await waitForConfirmations(tx.txHash, 1);
        } catch (error) {
          logger.error('Error checking pending transaction', 'useBlockchainService', error);
        }
      }
    };

    const interval = setInterval(checkPendingTransactions, 10000);
    return () => clearInterval(interval);
  }, [pendingTransactions, waitForConfirmations]);

  return {
    isLoading,
    pendingTransactions,
    executeTransaction,
    waitForConfirmations,
    getTransactionHistory,
    recordTransaction,
    updateTransactionStatus,
    recordEvent,
    getCurrentBlock,
    getGasPrice,
    estimateGas,
    getSigner,
    getContract
  };
}
