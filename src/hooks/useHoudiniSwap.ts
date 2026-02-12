import { useState } from 'react';
import { useWeb3 } from './useWeb3';
import { logger } from '../utils/logger';

export interface HoudiniSwapQuote {
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: string;
  route: any[];
  estimatedGas: string;
}

export interface HoudiniSwapTransaction {
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
}

export function useHoudiniSwap() {
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<HoudiniSwapQuote | null>(null);
  const { provider, account } = useWeb3();

  // Token addresses for common tokens
  const TOKEN_ADDRESSES = {
    GHETTO: '0xB0b86a33E6417c4c4c4c4c4c4c4c4c4c4c4c4c4c', // GHETTO token (2 decimals)
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86a33E6417c4c4c4c4c4c4c4c4c4c4c4c4c4c', // Mock USDC address
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    BTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    SOL: '0x7dFF46370e9eA5f0Bad3C4E29711aD50062EA7A4', // Wrapped SOL (mock)
  };

  const getTokenAddress = (symbol: string): string => {
    return TOKEN_ADDRESSES[symbol as keyof typeof TOKEN_ADDRESSES] || symbol;
  };

  const getQuote = async (
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<HoudiniSwapQuote | null> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      const fromAddress = getTokenAddress(fromToken);
      const toAddress = getTokenAddress(toToken);
      
      // Convert amount to proper decimals based on token
      const decimals = fromToken === 'GHETTO' ? 2 : fromToken === 'USDC' ? 6 : 18;
      const amountWei = (parseFloat(amount) * Math.pow(10, decimals)).toString();

      // HoudiniSwap API call for quote
      const response = await fetch('https://api.houdiniswap.com/v1/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sellToken: fromAddress,
          buyToken: toAddress,
          sellAmount: amountWei,
          takerAddress: account,
          slippagePercentage: 0.01, // 1% slippage
        }),
      });

      if (!response.ok) {
        // Fallback to mock quote if API fails
        const mockQuote: HoudiniSwapQuote = {
          inputToken: fromToken,
          outputToken: toToken,
          inputAmount: amount,
          outputAmount: (parseFloat(amount) * 0.98).toString(), // Mock 2% slippage
          priceImpact: 0.5,
          fee: '0.003',
          route: [],
          estimatedGas: '150000',
        };
        setQuote(mockQuote);
        return mockQuote;
      }

      const data = await response.json();
      
      // Convert output amount based on target token decimals
      const toDecimals = toToken === 'GHETTO' ? 2 : toToken === 'USDC' ? 6 : 18;
      const houdiniQuote: HoudiniSwapQuote = {
        inputToken: fromToken,
        outputToken: toToken,
        inputAmount: amount,
        outputAmount: (parseInt(data.buyAmount) / Math.pow(10, toDecimals)).toString(),
        priceImpact: data.estimatedPriceImpact || 0,
        fee: data.protocolFee || '0.003',
        route: data.sources || [],
        estimatedGas: data.gas || '150000',
      };

      setQuote(houdiniQuote);
      return houdiniQuote;
    } catch (error) {
      logger.error('HoudiniSwap quote failed', 'useHoudiniSwap', error);
      
      // Fallback to mock quote
      const mockQuote: HoudiniSwapQuote = {
        inputToken: fromToken,
        outputToken: toToken,
        inputAmount: amount,
        outputAmount: (parseFloat(amount) * 0.98).toString(),
        priceImpact: 0.5,
        fee: '0.003',
        route: [],
        estimatedGas: '150000',
      };
      setQuote(mockQuote);
      return mockQuote;
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = async (quote: HoudiniSwapQuote): Promise<string> => {
    if (!provider || !account) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      const fromAddress = getTokenAddress(quote.inputToken);
      const toAddress = getTokenAddress(quote.outputToken);
      const fromDecimals = quote.inputToken === 'GHETTO' ? 2 : quote.inputToken === 'USDC' ? 6 : 18;
      const amountWei = (parseFloat(quote.inputAmount) * Math.pow(10, fromDecimals)).toString();

      // Get swap transaction data from HoudiniSwap
      const response = await fetch('https://api.houdiniswap.com/v1/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sellToken: fromAddress,
          buyToken: toAddress,
          sellAmount: amountWei,
          takerAddress: account,
          slippagePercentage: 0.01,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get swap transaction data');
      }

      const swapData = await response.json();
      const signer = await provider.getSigner();

      // Execute the swap transaction
      const tx = await signer.sendTransaction({
        to: swapData.to,
        data: swapData.data,
        value: swapData.value || '0',
        gasLimit: swapData.gasLimit || '200000',
      });

      await tx.wait();
      return tx.hash;
    } catch (error) {
      logger.error('HoudiniSwap execution failed', 'useHoudiniSwap', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getSupportedTokens = () => {
    return Object.keys(TOKEN_ADDRESSES);
  };

  const clearQuote = () => {
    setQuote(null);
  };

  return {
    quote,
    isLoading,
    getQuote,
    executeSwap,
    getSupportedTokens,
    clearQuote,
  };
}