export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'GHETTO' | 'USDC' | 'ETH' | 'BTC' | 'SOL';
  image: string;
  category: string;
  seller: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
  };
  inStock: boolean;
  tags: string[];
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface BaseUser {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  walletAddress?: string;
  isSeller: boolean;
  verified: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface User extends BaseUser {
  email: string;
  rating: number;
}

export interface AuthUser extends BaseUser {
  email?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'awaiting_release' | 'funds_released' | 'completed' | 'disputed';
  txHash?: string;
  blockNumber?: number;
  createdAt: Date;
  buyer: User;
  seller: User;
  productImage?: string;
  productName?: string;
  quantity?: number;
  deliveryConfirmedAt?: Date;
  fundsReleaseDeadline?: Date;
  fundsReleasedAt?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  messageType: 'text' | 'order' | 'system';
  orderId?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export interface ProductImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: Date;
  isPrimary: boolean;
}

export interface SellerProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: 'GHETTO' | 'USDC' | 'ETH' | 'BTC' | 'SOL';
  category: string;
  images: ProductImage[];
  tags: string[];
  inStock: boolean;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'paused' | 'sold';
}

export interface WalletBalance {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  change24h: number;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'buy' | 'sell' | 'swap' | 'deposit' | 'withdraw';
  fromAsset?: string;
  toAsset?: string;
  amount: number;
  usdValue: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  timestamp: Date;
  counterparty?: string;
}

export interface TradeOrder {
  id: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  pair: string;
  amount: number;
  price?: number;
  filled: number;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

export interface GhettoCollateral {
  sellerId: string;
  totalCollateral: number;
  availableCollateral: number;
  heldCollateral: number;
  maxOrderValue: number;
}

export interface PaymentOption {
  token: string;
  symbol: string;
  name: string;
  feePercent: number;
  isPreferred: boolean;
}

export interface ReferralCode {
  id: string;
  userId: string;
  code: string;
  createdAt: Date;
}

export interface ReferredUser {
  id: string;
  referrerId: string;
  referredUserId: string;
  accountRewardClaimed: boolean;
  firstPurchaseRewardClaimed: boolean;
  createdAt: Date;
}

export interface ReferralBalance {
  userId: string;
  balanceGhetto: number;
  updatedAt: Date;
}

export interface ReferralTransaction {
  id: string;
  userId: string;
  type: 'signup_reward' | 'first_purchase_reward' | 'commission' | 'redemption';
  amountGhetto: number;
  sourceId?: string;
  createdAt: Date;
}

export type PlatformSetting = { key: string; value: string };

export interface Auction {
  id: string;
  productId: string;
  sellerId: string;
  auctionType: 'english' | 'dutch';
  startPrice: number;
  reservePrice?: number;
  currentPrice: number;
  buyNowPrice?: number;
  startTime: Date;
  endTime: Date;
  originalEndTime: Date;
  status: 'active' | 'ended' | 'cancelled';
  winnerId?: string;
  totalBids: number;
  viewCount: number;
  extensionCount: number;
  dutchDecrementHours: number;
  dutchDecrementPercent: number;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
  seller?: {
    id: string;
    name: string;
    username: string;
    verified: boolean;
    rating: number;
  };
  winner?: {
    id: string;
    name: string;
    username: string;
  };
}

export interface AuctionBid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  bidType: 'manual' | 'auto';
  autoBidMax?: number;
  isWinning: boolean;
  createdAt: Date;
  bidder?: {
    id: string;
    name: string;
    username: string;
    verified: boolean;
  };
}

export interface AuctionWatcher {
  id: string;
  auctionId: string;
  userId: string;
  notifyOutbid: boolean;
  notifyEndingSoon: boolean;
  notifyWon: boolean;
  createdAt: Date;
}

export interface AuctionFormData {
  productId: string;
  auctionType: 'english' | 'dutch';
  startPrice: number;
  reservePrice?: number;
  buyNowPrice?: number;
  durationMinutes: number;
  dutchDecrementHours?: number;
  dutchDecrementPercent?: number;
}