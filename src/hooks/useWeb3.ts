import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const SUPPORTED_NETWORKS = {
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  polygonMumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai Testnet',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
};

export const useWeb3 = () => {
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string>('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const getTargetNetwork = useCallback(() => {
    const env = import.meta.env.VITE_NETWORK_ENV || 'polygon';
    return env === 'testnet' ? SUPPORTED_NETWORKS.polygonMumbai : SUPPORTED_NETWORKS.polygon;
  }, []);

  const checkNetwork = useCallback((currentChainId: number) => {
    const targetNetwork = getTargetNetwork();
    const isCorrect = currentChainId === targetNetwork.chainId;
    setIsCorrectNetwork(isCorrect);

    if (currentChainId === SUPPORTED_NETWORKS.polygon.chainId) {
      setNetworkName('Polygon Mainnet');
    } else if (currentChainId === SUPPORTED_NETWORKS.polygonMumbai.chainId) {
      setNetworkName('Polygon Mumbai');
    } else {
      setNetworkName('Unknown Network');
    }

    return isCorrect;
  }, [getTargetNetwork]);

  const switchToPolygon = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use this marketplace');
      return;
    }

    const targetNetwork = getTargetNetwork();
    const chainIdHex = `0x${targetNetwork.chainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: targetNetwork.name,
                nativeCurrency: targetNetwork.nativeCurrency,
                rpcUrls: [targetNetwork.rpcUrl],
                blockExplorerUrls: [targetNetwork.blockExplorer],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          throw new Error('Failed to add Polygon network to wallet');
        }
      } else {
        console.error('Failed to switch network:', switchError);
        throw new Error('Failed to switch to Polygon network');
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        const network = await browserProvider.getNetwork();
        const currentChainId = Number(network.chainId);

        setProvider(browserProvider);
        setAccount(accounts[0]);
        setChainId(currentChainId);
        setIsConnected(true);
        checkNetwork(currentChainId);

        localStorage.setItem('walletConnected', 'true');

        const targetNetwork = getTargetNetwork();
        if (currentChainId !== targetNetwork.chainId) {
          const shouldSwitch = confirm(
            `Please switch to ${targetNetwork.name} to use this marketplace. Would you like to switch now?`
          );
          if (shouldSwitch) {
            await switchToPolygon();
          }
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('Please install MetaMask to use this marketplace');
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setProvider(null);
    setIsConnected(false);
    setChainId(null);
    setNetworkName('');
    setIsCorrectNetwork(false);
    localStorage.removeItem('walletConnected');
  };

  const getBalance = async (): Promise<string> => {
    if (provider && account) {
      const balance = await provider.getBalance(account);
      return ethers.formatEther(balance);
    }
    return '0';
  };

  const sendTransaction = async (to: string, value: string) => {
    if (provider && account) {
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
      });
      return tx;
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined' && localStorage.getItem('walletConnected')) {
        await connectWallet();
      }
    };

    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setChainId(newChainId);
        checkNetwork(newChainId);
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return {
    account,
    provider,
    isConnected,
    chainId,
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