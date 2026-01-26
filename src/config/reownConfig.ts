import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { polygon, polygonAmoy } from '@reown/appkit/networks';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

if (!projectId) {
  console.warn('VITE_REOWN_PROJECT_ID is not set. Wallet connection will not work.');
}

const metadata = {
  name: 'Ghetto Marketplace',
  description: 'Decentralized marketplace with escrow and social features',
  url: window.location.origin,
  icons: [`${window.location.origin}/icons/icon-192x192.svg`]
};

const networkEnv = import.meta.env.VITE_NETWORK_ENV || 'mainnet';
const networks = networkEnv === 'testnet' ? [polygonAmoy] : [polygon];

export const reownConfig = {
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId: projectId || '',
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
};

let appKitInstance: ReturnType<typeof createAppKit> | null = null;

export const getAppKit = () => {
  if (!appKitInstance) {
    appKitInstance = createAppKit(reownConfig);
  }
  return appKitInstance;
};

export const SUPPORTED_CHAIN_IDS = networks.map(n => n.id);
export const DEFAULT_CHAIN_ID = networks[0].id;
