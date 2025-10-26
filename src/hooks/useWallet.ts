import { useState, useEffect } from 'react';
import { WalletBalance, Transaction } from '../types';
import { useWeb3 } from './useWeb3';

export function useWallet() {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { account, provider } = useWeb3();

  // Mock initial balances
  useEffect(() => {
    if (account) {
      const mockBalances: WalletBalance[] = [
        { symbol: 'ETH', name: 'Ethereum', balance: 2.5, usdValue: 6625.00, change24h: -1.23 },
        { symbol: 'USDC', name: 'USD Coin', balance: 1250.00, usdValue: 1250.00, change24h: 0.01 },
        { symbol: 'BTC', name: 'Bitcoin', balance: 0.05, usdValue: 2162.50, change24h: 2.45 },
        { symbol: 'SOL', name: 'Solana', balance: 15.0, usdValue: 1882.50, change24h: 4.67 },
      ];
      setBalances(mockBalances);

      // Mock transaction history
      const mockTransactions: Transaction[] = [
        {
          id: 'tx1',
          type: 'receive',
          toAsset: 'USDC',
          amount: 500,
          usdValue: 500,
          fee: 0,
          status: 'completed',
          txHash: '0x1234...5678',
          timestamp: new Date(Date.now() - 86400000),
        },
        {
          id: 'tx2',
          type: 'buy',
          fromAsset: 'USDC',
          toAsset: 'ETH',
          amount: 0.5,
          usdValue: 1325,
          fee: 3.25,
          status: 'completed',
          timestamp: new Date(Date.now() - 172800000),
        },
        {
          id: 'tx3',
          type: 'send',
          fromAsset: 'ETH',
          amount: 0.1,
          usdValue: 265,
          fee: 12.50,
          status: 'completed',
          counterparty: '0xabcd...efgh',
          timestamp: new Date(Date.now() - 259200000),
        },
      ];
      setTransactions(mockTransactions);
    }
  }, [account]);

  const getTotalBalance = () => {
    return balances.reduce((total, balance) => total + balance.usdValue, 0);
  };

  const getBalance = (symbol: string) => {
    return balances.find(b => b.symbol === symbol)?.balance || 0;
  };

  const sendCrypto = async (to: string, amount: number, asset: string) => {
    setIsLoading(true);
    try {
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'send',
        fromAsset: asset,
        amount,
        usdValue: amount * (balances.find(b => b.symbol === asset)?.usdValue || 0) / (balances.find(b => b.symbol === asset)?.balance || 1),
        fee: asset === 'ETH' ? 0.005 : 0.001,
        status: 'pending',
        counterparty: to,
        timestamp: new Date(),
      };

      setTransactions(prev => [newTransaction, ...prev]);

      // Update balance
      setBalances(prev => prev.map(balance => 
        balance.symbol === asset 
          ? { ...balance, balance: balance.balance - amount }
          : balance
      ));

      // Simulate confirmation
      setTimeout(() => {
        setTransactions(prev => prev.map(tx => 
          tx.id === newTransaction.id 
            ? { ...tx, status: 'completed' as const, txHash: `0x${Math.random().toString(16).substr(2, 8)}...` }
            : tx
        ));
      }, 3000);

      return newTransaction.id;
    } catch (error) {
      console.error('Send failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const buyCrypto = async (asset: string, amount: number, paymentMethod: 'card' | 'bank') => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const price = balances.find(b => b.symbol === asset)?.usdValue || 0;
      const usdValue = amount * (price / (balances.find(b => b.symbol === asset)?.balance || 1));
      
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'buy',
        toAsset: asset,
        amount,
        usdValue,
        fee: usdValue * 0.015, // 1.5% fee
        status: 'completed',
        timestamp: new Date(),
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setBalances(prev => prev.map(balance => 
        balance.symbol === asset 
          ? { ...balance, balance: balance.balance + amount }
          : balance
      ));

      return newTransaction.id;
    } catch (error) {
      console.error('Buy failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sellCrypto = async (asset: string, amount: number) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const price = balances.find(b => b.symbol === asset)?.usdValue || 0;
      const usdValue = amount * (price / (balances.find(b => b.symbol === asset)?.balance || 1));
      
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'sell',
        fromAsset: asset,
        amount,
        usdValue,
        fee: usdValue * 0.015, // 1.5% fee
        status: 'completed',
        timestamp: new Date(),
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setBalances(prev => prev.map(balance => 
        balance.symbol === asset 
          ? { ...balance, balance: balance.balance - amount }
          : balance
      ));

      return newTransaction.id;
    } catch (error) {
      console.error('Sell failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const swapCrypto = async (fromAsset: string, toAsset: string, fromAmount: number) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fromPrice = balances.find(b => b.symbol === fromAsset)?.usdValue || 0;
      const toPrice = balances.find(b => b.symbol === toAsset)?.usdValue || 0;
      const fromBalance = balances.find(b => b.symbol === fromAsset)?.balance || 1;
      const toBalance = balances.find(b => b.symbol === toAsset)?.balance || 1;
      
      const usdValue = fromAmount * (fromPrice / fromBalance);
      const toAmount = usdValue / (toPrice / toBalance);
      
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'swap',
        fromAsset,
        toAsset,
        amount: fromAmount,
        usdValue,
        fee: usdValue * 0.005, // 0.5% fee
        status: 'completed',
        timestamp: new Date(),
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setBalances(prev => prev.map(balance => {
        if (balance.symbol === fromAsset) {
          return { ...balance, balance: balance.balance - fromAmount };
        }
        if (balance.symbol === toAsset) {
          return { ...balance, balance: balance.balance + toAmount };
        }
        return balance;
      }));

      return newTransaction.id;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    balances,
    transactions,
    isLoading,
    getTotalBalance,
    getBalance,
    sendCrypto,
    buyCrypto,
    sellCrypto,
    swapCrypto,
  };
}