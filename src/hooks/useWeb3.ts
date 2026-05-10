import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import { useAppKit, useAppKitAccount, useAppKitProvider, useAppKitNetwork, useDisconnect } from '@reown/appkit/react';
import { polygon, polygonAmoy } from '@reown/appkit/networks';
import { DEFAULT_CHAIN_ID, SUPPORTED_CHAIN_IDS } from '../config/reownConfig';
import { logger } from '../utils/logger';

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
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const { switchNetwork, chainId } = useAppKitNetwork();
  const { disconnect } = useDisconnect();

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [networkName, setNetworkName] = useState<string>('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const getTargetNetwork = useCallback(() => {
    const env = import.meta.env.VITE_NETWORK_ENV || 'mainnet';
    return env === 'testnet' ? SUPPORTED_NETWORKS.polygonAmoy : SUPPORTED_NETWORKS.polygon;
  }, []);

  const checkNetwork = useCallback((currentChainId: number) => {
    const targetNetwork = getTargetNetwork();
    const isCorrect = (SUPPORTED_CHAIN_IDS as number[]).includes(currentChainId);
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
      checkNetwork(Number(chainId));
    }
  }, [chainId, checkNetwork]);

  const connectWallet = async () => {
    await open();
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
      logger.info('Wallet disconnected successfully', 'useWeb3');
    } catch (error) {
      logger.error('Failed to disconnect wallet', 'useWeb3', error);
      throw error;
    }
  };

  const switchToPolygon = async () => {
    if (isSwitchingNetwork) {
      logger.info('Network switch already in progress', 'useWeb3');
      return;
    }

    try {
      setIsSwitchingNetwork(true);
      const env = import.meta.env.VITE_NETWORK_ENV || 'mainnet';
      const targetNetwork = env === 'testnet' ? polygonAmoy : polygon;

      logger.info(`Switching to ${targetNetwork.name}`, 'useWeb3');
      await switchNetwork(targetNetwork);
      logger.info('Network switch successful', 'useWeb3');
    } catch (error) {
      logger.error('Failed to switch network', 'useWeb3', error);
      // If automatic switch fails, open the network selection UI as fallback
      await open({ view: 'Networks' });
      throw error;
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const getBalance = async (): Promise<string> => {
    if (provider && address) {
      try {
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
      } catch (error) {
        logger.error('Failed to get balance', 'useWeb3', error);
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
        logger.error('Failed to send transaction', 'useWeb3', error);
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
    isSwitchingNetwork,
    targetNetwork: getTargetNetwork(),
    supportedNetworks: SUPPORTED_NETWORKS,
  };
};
