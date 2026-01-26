import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { DEFAULT_CHAIN_ID, SUPPORTED_CHAIN_IDS } from '../config/reownConfig';

const SUPPORTED_NETWORKS = {
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  polygonAmoy: {
    chainId: 80002,
    name: 'Polygon Amoy Testnet',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    blockExplorer: 'https://amoy.polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
};

export const useWeb3 = () => {
  const { open } = useAppKit();
  const { address, isConnected, chainId } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [networkName, setNetworkName] = useState<string>('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const getTargetNetwork = useCallback(() => {
    const env = import.meta.env.VITE_NETWORK_ENV || 'polygon';
    return env === 'testnet' ? SUPPORTED_NETWORKS.polygonAmoy : SUPPORTED_NETWORKS.polygon;
  }, []);

  const checkNetwork = useCallback((currentChainId: number) => {
    const targetNetwork = getTargetNetwork();
    const isCorrect = SUPPORTED_CHAIN_IDS.includes(currentChainId);
    setIsCorrectNetwork(isCorrect);

    if (currentChainId === SUPPORTED_NETWORKS.polygon.chainId) {
      setNetworkName('Polygon Mainnet');
    } else if (currentChainId === SUPPORTED_NETWORKS.polygonAmoy.chainId) {
      setNetworkName('Polygon Amoy');
    } else {
      setNetworkName('Unknown Network');
    }

    return isCorrect;
  }, [getTargetNetwork]);

  useEffect(() => {
    if (walletProvider) {
      const ethersProvider = new BrowserProvider(walletProvider as any);
      setProvider(ethersProvider);
    } else {
      setProvider(null);
    }
  }, [walletProvider]);

  useEffect(() => {
    if (chainId) {
      checkNetwork(chainId);
    }
  }, [chainId, checkNetwork]);

  const connectWallet = async () => {
    await open();
  };

  const disconnectWallet = async () => {
    await open();
  };

  const switchToPolygon = async () => {
    await open({ view: 'Networks' });
  };

  const getBalance = async (): Promise<string> => {
    if (provider && address) {
      try {
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
      } catch (error) {
        console.error('Failed to get balance:', error);
        return '0';
      }
    }
    return '0';
  };

  const sendTransaction = async (to: string, value: string) => {
    if (provider && address) {
      try {
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({
          to,
          value: ethers.parseEther(value),
        });
        return tx;
      } catch (error) {
        console.error('Failed to send transaction:', error);
        throw error;
      }
    }
    throw new Error('Wallet not connected');
  };

  return {
    account: address || '',
    provider,
    isConnected,
    chainId: chainId || null,
    networkName,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    getBalance,
    sendTransaction,
    switchToPolygon,
    targetNetwork: getTargetNetwork(),
    supportedNetworks: SUPPORTED_NETWORKS,
  };
};
