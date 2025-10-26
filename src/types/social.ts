export interface UserProfile {
  id: string;
  handle: string; // @username
  displayName: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  joinedAt: Date;
  followers: string[];
  following: string[];
  isVerified: boolean;
  badges: ProfileBadge[];
  stats: ProfileStats;
  socialLinks: SocialLink[];
  storeSettings: StoreSettings;
}

export interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
}

export interface ProfileStats {
  totalSales: number;
  totalPurchases: number;
  rating: number;
  reviewCount: number;
  completedTrades: number;
  groupsJoined: number;
}

export interface SocialLink {
  platform: string;
  url: string;
  verified: boolean;
}

export interface StoreSettings {
  isEnabled: boolean;
  storeName: string;
  storeDescription: string;
  storeTheme: 'dark' | 'neon' | 'minimal' | 'cyberpunk';
  featuredProducts: string[];
  customBanner?: string;
  storeCategories: string[];
}

export interface TradingGroup {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  createdBy: string;
  createdAt: Date;
  members: GroupMember[];
  isPrivate: boolean;
  category: string;
  tags: string[];
  rules: string[];
  stats: GroupStats;
  settings: GroupSettings;
}

export interface GroupMember {
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  permissions: GroupPermission[];
  reputation: number;
}

export interface GroupPermission {
  action: string;
  granted: boolean;
}

export interface GroupStats {
  memberCount: number;
  totalTrades: number;
  totalVolume: number;
  activeMembers: number;
  messagesCount: number;
}

export interface GroupSettings {
  allowInvites: boolean;
  requireApproval: boolean;
  allowTrades: boolean;
  allowFundTransfers: boolean;
  maxMembers: number;
  tradingFeePercent: number;
}

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  content: string;
  type: 'text' | 'trade_offer' | 'fund_request' | 'product_share' | 'poll';
  attachments: PostAttachment[];
  reactions: PostReaction[];
  comments: GroupComment[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  tags: string[];
}

export interface PostAttachment {
  id: string;
  type: 'image' | 'document' | 'product' | 'trade_offer';
  url: string;
  metadata: any;
}

export interface PostReaction {
  userId: string;
  type: 'like' | 'love' | 'fire' | 'rocket' | 'diamond';
  createdAt: Date;
}

export interface GroupComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  reactions: PostReaction[];
  replies: GroupComment[];
}

export interface TradeOffer {
  id: string;
  groupId: string;
  createdBy: string;
  title: string;
  description: string;
  offerType: 'buy' | 'sell' | 'trade' | 'service';
  items: TradeItem[];
  requestedItems: TradeItem[];
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  location?: string;
  expiresAt: Date;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  interestedUsers: string[];
  createdAt: Date;
}

export interface TradeItem {
  type: 'product' | 'service' | 'crypto' | 'nft';
  name: string;
  description: string;
  quantity: number;
  estimatedValue: number;
  currency: string;
  images?: string[];
  metadata?: any;
}

export interface FundTransfer {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  txHash?: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  invitedBy: string;
  invitedUser: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}