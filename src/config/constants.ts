export const APP_CONFIG = {
  name: 'Ghetto Marketplace',
  version: '1.0.0',
  description: 'Decentralized marketplace with escrow and social features',
} as const;

export const CACHE_CONFIG = {
  names: {
    profile: 'profile-data-v1',
    products: 'products-data-v1',
    static: 'static-assets-v1',
  },
  maxAge: {
    profile: 24 * 60 * 60 * 1000,
    products: 60 * 60 * 1000,
    static: 7 * 24 * 60 * 60 * 1000,
  },
  maxSize: {
    profile: 50 * 1024 * 1024,
    products: 100 * 1024 * 1024,
    static: 500 * 1024 * 1024,
  },
} as const;

export const BLOCKCHAIN_CONFIG = {
  supportedChains: {
    polygon: {
      id: 137,
      name: 'Polygon',
      rpcUrl: 'https://polygon-rpc.com',
      blockExplorer: 'https://polygonscan.com',
    },
    polygonMumbai: {
      id: 80001,
      name: 'Polygon Mumbai',
      rpcUrl: 'https://rpc-mumbai.maticvigil.com',
      blockExplorer: 'https://mumbai.polygonscan.com',
    },
  },
  defaultChain: 137,
} as const;

export const TRANSACTION_CONFIG = {
  fees: {
    platformFee: 0.0125,
    gasBuffer: 1.2,
  },
  timeouts: {
    confirmation: 60000,
    approval: 120000,
  },
  escrow: {
    autoReleaseDelay: 7 * 24 * 60 * 60 * 1000,
    disputePeriod: 14 * 24 * 60 * 60 * 1000,
  },
} as const;

export const UI_CONFIG = {
  pagination: {
    itemsPerPage: 20,
    maxPages: 100,
  },
  search: {
    debounceDelay: 300,
    minSearchLength: 2,
    maxResults: 100,
  },
  animation: {
    transitionDuration: 200,
    fadeInDuration: 300,
  },
  toast: {
    duration: 5000,
    position: 'top-right' as const,
  },
} as const;

export const STORAGE_KEYS = {
  theme: 'app-theme',
  language: 'app-language',
  recentSearches: 'recent-searches',
  viewPreferences: 'view-preferences',
  walletConnection: 'wallet-connection',
} as const;

export const API_CONFIG = {
  retries: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
  },
  timeouts: {
    default: 30000,
    upload: 120000,
    longRunning: 300000,
  },
} as const;

export const VALIDATION_CONFIG = {
  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
  password: {
    minLength: 8,
    maxLength: 128,
  },
  message: {
    minLength: 1,
    maxLength: 5000,
  },
  product: {
    titleMinLength: 3,
    titleMaxLength: 100,
    descriptionMinLength: 10,
    descriptionMaxLength: 5000,
    minPrice: 0.01,
    maxPrice: 1000000,
  },
  upload: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
} as const;

export const ROUTES = {
  home: '/',
  marketplace: '/marketplace',
  social: '/social',
  profile: '/profile',
  wallet: '/wallet',
  orders: '/orders',
  messages: '/messages',
  settings: '/settings',
  legal: '/legal',
  faq: '/faq',
  contact: '/contact',
} as const;
