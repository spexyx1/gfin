import { useState, useEffect } from 'react';
import { WalletBalance, Transaction } from '../types';
import { useWeb3 } from './useWeb3';
import { fetchMultipleTokenPrices } from '../services/priceService';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';

export function useWallet() {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { account, provider, chainId } = useWeb3();

  useEffect(() => {
    if (!account || !provider) {
      setBalances([]);
      setTransactions([]);
      return;
    }

    const loadBalances = async () => {
      try {
        const nativeBalance = await provider.getBalance(account);
        const nativeAmount = parseFloat(ethers.formatEther(nativeBalance));

        // Determine native token based on chain
        const isPolygon = chainId === 137 || chainId === 80002;
        const nativeSymbol = isPolygon ? 'POL' : 'ETH';
        const nativeName = isPolygon ? 'Polygon' : 'Ethereum';
        const priceSymbol = isPolygon ? 'MATIC' : 'ETH'; // Use MATIC for price lookup

        const prices = await fetchMultipleTokenPrices([priceSymbol, 'USDC', 'BTC', 'SOL']);

        const newBalances: WalletBalance[] = [];

        const nativePrice = prices.get(priceSymbol);
        if (nativePrice) {
          newBalances.push({
            symbol: nativeSymbol,
            name: nativeName,
            balance: nativeAmount,
            usdValue: nativeAmount * nativePrice.usd,
            change24h: nativePrice.usd_24h_change
          });
        }

        setBalances(newBalances);
      } catch (error) {
        logger.error('Error loading balances', 'useWallet', error);
        setBalances([]);
      }
    };

    loadBalances();
    const interval = setInterval(loadBalances, 60000);
    return () => clearInterval(interval);
  }, [account, provider, chainId]);

  const getTotalBalance = () => {
    return balances.reduce((total, balance) => total + balance.usdValue, 0);
  };

  const getBalance = (symbol: string) => {
    return balances.find(b => b.symbol === symbol)?.balance || 0;
  };

  const sendCrypto = async (to: string, amount: number, asset: string) => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      // Determine native token based on chain
      const isPolygon = chainId === 137 || chainId === 80002;
      const nativeSymbol = isPolygon ? 'POL' : 'ETH';

      if (asset !== nativeSymbol && asset !== 'ETH' && asset !== 'POL') {
        throw new Error(`Only ${nativeSymbol} transfers are currently supported`);
      }

      const signer = await provider.getSigner(account);
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount.toString())
      });

      const newTransaction: Transaction = {
        id: tx.hash,
        type: 'send',
        fromAsset: asset,
        amount,
        usdValue: 0,
        fee: 0,
        status: 'pending',
        counterparty: to,
        txHash: tx.hash,
        timestamp: new Date(),
      };

      setTransactions(prev => [newTransaction, ...prev]);

      const receipt = await tx.wait();

      setTransactions(prev => prev.map(t =>
        t.id === tx.hash
          ? { ...t, status: 'completed' as const }
          : t
      ));

      return tx.hash;
    } catch (error) {
      logger.error('Send failed', 'useWallet', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const buyCrypto = async (asset: string, amount: number, paymentMethod: 'card' | 'bank') => {
    throw new Error('Buy crypto is not yet implemented. Please use an exchange.');
  };

  const sellCrypto = async (asset: string, amount: number) => {
    throw new Error('Sell crypto is not yet implemented. Please use an exchange.');
  };

  const swapCrypto = async (fromAsset: string, toAsset: string, fromAmount: number) => {
    throw new Error('Swap crypto is not yet implemented. Please use the Swap Interface.');
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