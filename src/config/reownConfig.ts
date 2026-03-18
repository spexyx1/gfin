import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { polygon, polygonAmoy } from '@reown/appkit/networks';
import { logger } from '../utils/logger';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '';

if (!projectId) {
  logger.error('VITE_REOWN_PROJECT_ID is not set. Wallet connection features will be limited.', 'reownConfig');
} else {
  logger.info(`Reown AppKit initialized with project ID: ${projectId.substring(0, 8)}...`, 'reownConfig');
}

const metadata = {
  name: 'Ghetto Marketplace',
  description: 'Decentralized marketplace with escrow and social features',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://ghettofinance.com',
  icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://ghettofinance.com'}/icons/icon-192x192.svg`]
};

const networkEnv = import.meta.env.VITE_NETWORK_ENV || 'mainnet';
const networks = networkEnv === 'testnet' ? [polygonAmoy] : [polygon];

export const SUPPORTED_CHAIN_IDS = networks.map(n => n.id);
export const DEFAULT_CHAIN_ID = networks[0].id;

logger.info(`Configuring Reown AppKit for ${networkEnv} environment`, 'reownConfig');
logger.info(`Supported networks: ${networks.map(n => `${n.name} (${n.id})`).join(', ')}`, 'reownConfig');

try {
  createAppKit({
    adapters: [new EthersAdapter()],
    networks,
    metadata,
    projectId,
    features: {
      analytics: true,
      email: false,
      socials: false,
      swaps: false,
      onramp: false,
    },
    themeMode: 'dark' as const,
    themeVariables: {
      '--w3m-accent': '#10b981',
      '--w3m-border-radius-master': '4px',
    }
  });
  logger.info('Reown AppKit created successfully', 'reownConfig');
} catch (error) {
  logger.error('Failed to create Reown AppKit', 'reownConfig', error);
}
