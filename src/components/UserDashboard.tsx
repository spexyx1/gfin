import { useState, useEffect, useCallback } from 'react';
import { X, User, Settings, ShoppingBag, Wallet, MessageCircle, Share2, Package, TrendingUp, AlertCircle, Activity, Shield, Star, Award, Copy, Check, DollarSign, Users, Target, BarChart3, Clock, Wand2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useReferrals } from '../hooks/useReferrals';
import { useCart } from '../hooks/useCart';
import { useMessaging } from '../hooks/useMessaging';
import { useSellerProducts } from '../hooks/useSellerProducts';
import { useSponsorship } from '../hooks/useSponsorship';
import { useSiteMaster } from '../hooks/useSiteMaster';
import { useEnhancedSitemaster } from '../hooks/useEnhancedSitemaster';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useVideoCall } from '../hooks/useVideoCall';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '../utils/logger';
import { OrderManagement } from './OrderManagement';
import { WalletDashboard } from './WalletDashboard';
import { MessagingCenter } from './MessagingCenter';
import { SellerDashboard } from './SellerDashboard';
import { OfflineBanner } from './OfflineBanner';
import { VideoCallModal } from './VideoCallModal';
import { IncomingCallNotification } from './IncomingCallNotification';
import { CacheManagement } from './CacheManagement';

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type DashboardSection = 'overview' | 'orders' | 'wallet' | 'messages' | 'referrals' | 'listings' | 'sponsorships' | 'disputes' | 'activity' | 'settings' | 'sitemaster-users' | 'sitemaster-content' | 'sitemaster-flags' | 'sitemaster-settings' | 'sitemaster-escrow' | 'sitemaster-analytics' | 'sitemaster-wizardry';

export function UserDashboard({ isOpen, onClose }: UserDashboardProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { user, updateProfile } = useAuth();
  const { isOffline, isOnline } = useNetworkStatus();
  const {
    referralCode,
    referredUsers,
    referralBalance,
    referralTransactions,
    platformSettings,
    isLoading: referralsLoading,
    redeemBalance
  } = useReferrals();
  const { getItemCount } = useCart();
  const { getUnreadCount } = useMessaging();
  const { products, getProductStats } = useSellerProducts();
  const { myInvestments, myRequests } = useSponsorship();
  const { issitemaster } = useSiteMaster();
  const {
    flags,
    suspensions,
    activityLogs,
    searchUsers,
    searchListings,
    flagUser,
    resolveFlag,
    suspendUser,
    liftSuspension,
    deleteContent,
    getPlatformStats,
    getSettingsByCategory,
    updateSetting,
    getEscrowOrders,
    getAllProducts,
    getAllMessages,
    getAllPosts
  } = useEnhancedSitemaster();

  const {
    activeCall,
    incomingCall,
    isInitiating,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
  } = useVideoCall();

  const [callParticipantName, setCallParticipantName] = useState('');

  const handleStartCall = useCallback(async (conversationId: string) => {
    const session = await initiateCall(conversationId);
    if (session) {
      setCallParticipantName('Connecting...');
    }
  }, [initiateCall]);

  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall) return;
    setCallParticipantName(incomingCall.callerName);
    await acceptCall(incomingCall.session);
  }, [incomingCall, acceptCall]);

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    messageNotifications: true,
    disputeUpdates: true,
    referralNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
  });
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [smSearchQuery, setSmSearchQuery] = useState('');
  const [smSearchResults, setSmSearchResults] = useState<any[]>([]);
  const [smEscrowOrders, setSmEscrowOrders] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      logger.debug('[UserDashboard] User loaded', 'UserDashboard', { username: user.username, issitemaster });
      loadUnreadMessages();
      if (issitemaster) {
        logger.debug('[UserDashboard] Loading sitemaster data...', 'UserDashboard');
        loadSitemasterData();
      } else {
        logger.debug('[UserDashboard] User is not a sitemaster', 'UserDashboard');
      }
    }
  }, [user, issitemaster]);

  const loadSitemasterData = async () => {
    try {
      const stats = await getPlatformStats();
      setPlatformStats(stats);
      const orders = await getEscrowOrders();
      setSmEscrowOrders(orders);
    } catch (error) {
      logger.error('Failed to load sitemaster data', 'UserDashboard', error);
    }
  };

  const loadUnreadMessages = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadMessages(count);
    } catch (error) {
      logger.error('Failed to load unread count', 'UserDashboard', error);
    }
  };

  const productStats = getProductStats();

  const handleCopyReferralLink = () => {
    if (referralCode) {
      const link = `${window.location.origin}/?ref=${referralCode.code}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRedeemBalance = async () => {
    if (!referralBalance || !platformSettings.referral_min_redeem_ghetto) return;
    const amount = parseFloat(redeemAmount);
    const minRedeem = parseFloat(platformSettings.referral_min_redeem_ghetto);

    if (isNaN(amount) || amount < minRedeem || amount > referralBalance.balanceGhetto) {
      alert(`Please enter a valid amount to redeem (min ${minRedeem} GHETTO, max ${referralBalance.balanceGhetto} GHETTO).`);
      return;
    }

    const success = await redeemBalance(amount);
    if (success) {
      alert('Referral balance redeemed successfully!');
      setRedeemAmount('');
    }
  };

  const shareOnSocial = (platform: string) => {
    if (!referralCode) return;
    const link = `${window.location.origin}/?ref=${referralCode.code}`;
    const text = 'Join GHETTO FINANCE - The secure P2P marketplace with crypto payments!';

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(link)}&title=${encodeURIComponent(text)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (!isOpen || !user) return null;

  const baseMenuItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: 0 },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'messages', label: 'Messages', icon: MessageCircle, badge: unreadMessages },
    { id: 'referrals', label: 'Referrals', icon: Share2 },
    { id: 'listings', label: 'My Listings', icon: Package, badge: productStats.active },
    { id: 'sponsorships', label: 'Sponsorships', icon: TrendingUp },
    { id: 'disputes', label: 'Disputes', icon: AlertCircle },
    { id: 'activity', label: 'Activity', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sitemasterMenuItems = issitemaster ? [
    { id: 'sitemaster-users', label: 'SM: Users', icon: Users, badge: platformStats?.totalUsers || 0 },
    { id: 'sitemaster-content', label: 'SM: Content', icon: Package, badge: platformStats?.totalProducts || 0 },
    { id: 'sitemaster-flags', label: 'SM: Flags', icon: AlertCircle, badge: flags?.length || 0 },
    { id: 'sitemaster-escrow', label: 'SM: Escrow', icon: Shield, badge: smEscrowOrders?.length || 0 },
    { id: 'sitemaster-analytics', label: 'SM: Analytics', icon: BarChart3 },
    { id: 'sitemaster-settings', label: 'SM: Settings', icon: Settings },
    { id: 'sitemaster-wizardry', label: 'SM: Wizardry', icon: Wand2 },
  ] : [];

  const menuItems = [...baseMenuItems, ...sitemasterMenuItems];

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Welcome back, {user.name}!</h2>
        <p className="text-gray-400">Here's what's happening with your account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <ShoppingBag className="w-8 h-8 text-blue-400" />
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Active</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">0</p>
          <p className="text-gray-400 text-sm">Active Orders</p>
        </div>

        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Wallet className="w-8 h-8 text-green-400" />
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Available</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">0.00</p>
          <p className="text-gray-400 text-sm">GHETTO Balance</p>
        </div>

        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Share2 className="w-8 h-8 text-luxe-gold" />
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">Earned</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{referralBalance?.balanceGhetto.toFixed(2) || '0.00'}</p>
          <p className="text-gray-400 text-sm">Referral Rewards</p>
        </div>

        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Star className="w-8 h-8 text-orange-400" />
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Rating</span>
          </div>
          <p className="text-3xl font-black text-white mb-1">{user.rating || 0}</p>
          <p className="text-gray-400 text-sm">User Rating</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-black text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-luxe-gold" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowOrdersModal(true)}
              className="p-4 luxe-glass hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <ShoppingBag className="w-6 h-6 text-blue-400 mb-2" />
              <p className="text-white font-medium text-sm">View Orders</p>
            </button>
            <button
              onClick={() => setShowWalletModal(true)}
              className="p-4 luxe-glass hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <Wallet className="w-6 h-6 text-green-400 mb-2" />
              <p className="text-white font-medium text-sm">Manage Wallet</p>
            </button>
            <button
              onClick={() => setShowMessagesModal(true)}
              className="p-4 luxe-glass hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <MessageCircle className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-white font-medium text-sm">Messages</p>
            </button>
            <button
              onClick={() => setActiveSection('referrals')}
              className="p-4 luxe-glass hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <Share2 className="w-6 h-6 text-yellow-400 mb-2" />
              <p className="text-white font-medium text-sm">Refer & Earn</p>
            </button>
          </div>
        </div>

        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-black text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-luxe-gold" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 luxe-glass rounded-lg">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">Account created</p>
                <p className="text-gray-400 text-xs">{formatDistanceToNow(user.createdAt, { addSuffix: true })}</p>
              </div>
            </div>
            {referralTransactions.slice(0, 2).map((tx) => (
              <div key={tx.id} className="flex items-start space-x-3 p-3 luxe-glass rounded-lg">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                  <p className="text-gray-400 text-xs">{formatDistanceToNow(tx.createdAt, { addSuffix: true })}</p>
                </div>
                <span className="text-green-400 font-black text-sm">+{tx.amountGhetto.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReferrals = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Referral Program</h2>
        <p className="text-gray-400">Share your link and earn rewards when friends join and trade</p>
      </div>

      <div className="bg-gradient-to-r from-neon-blue/20 to-neon-yellow/20 rounded-2xl p-6 border border-luxe-gold/50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-black text-white mb-2">Your Referral Link</h3>
            <p className="text-gray-300 text-sm">Share this link to invite new users</p>
          </div>
          <Award className="w-10 h-10 text-luxe-gold" />
        </div>

        {referralCode ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 luxe-glass-strong/50 rounded-lg p-4">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/?ref=${referralCode.code}`}
                className="flex-1 bg-transparent text-luxe-gold font-mono text-sm outline-none"
              />
              <button
                onClick={handleCopyReferralLink}
                className="px-4 py-2 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg font-medium flex items-center space-x-2 transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-gray-300 text-sm">Share on:</span>
              <button
                onClick={() => shareOnSocial('twitter')}
                className="px-3 py-1 luxe-glass hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Twitter
              </button>
              <button
                onClick={() => shareOnSocial('facebook')}
                className="px-3 py-1 luxe-glass hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Facebook
              </button>
              <button
                onClick={() => shareOnSocial('linkedin')}
                className="px-3 py-1 luxe-glass hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                LinkedIn
              </button>
              <button
                onClick={() => shareOnSocial('reddit')}
                className="px-3 py-1 luxe-glass hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Reddit
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Loading referral code...</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white mb-1">{referredUsers.length}</p>
          <p className="text-gray-400 text-sm">Total Referrals</p>
        </div>

        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-3xl font-black text-white mb-1">{referralBalance?.balanceGhetto.toFixed(2) || '0.00'}</p>
          <p className="text-gray-400 text-sm">Total Earned (GHETTO)</p>
        </div>

        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Target className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white mb-1">{referralTransactions.length}</p>
          <p className="text-gray-400 text-sm">Total Rewards</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-black text-white mb-4">Referral Balance</h3>
          <div className="mb-6">
            <div className="flex items-baseline mb-2">
              <span className="text-4xl font-black text-luxe-gold">{referralBalance?.balanceGhetto.toFixed(2) || '0.00'}</span>
              <span className="text-gray-400 ml-2">GHETTO</span>
            </div>
            <p className="text-gray-400 text-sm">Available to redeem</p>
          </div>

          {referralBalance && parseFloat(platformSettings.referral_min_redeem_ghetto || '0') > 0 && referralBalance.balanceGhetto >= parseFloat(platformSettings.referral_min_redeem_ghetto) ? (
            <div className="space-y-3">
              <div>
                <label className="block text-white font-medium mb-2">Redeem Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min={parseFloat(platformSettings.referral_min_redeem_ghetto)}
                  max={referralBalance.balanceGhetto}
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                  placeholder={`Min ${platformSettings.referral_min_redeem_ghetto} GHETTO`}
                />
              </div>
              <button
                onClick={handleRedeemBalance}
                disabled={referralsLoading || !redeemAmount || parseFloat(redeemAmount) < parseFloat(platformSettings.referral_min_redeem_ghetto)}
                className="w-full py-3 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {referralsLoading ? 'Processing...' : 'Redeem GHETTO'}
              </button>
              <p className="text-gray-400 text-xs text-center">
                Redeemed GHETTO can be used for purchases on the platform
              </p>
            </div>
          ) : (
            <div className="luxe-glass rounded-lg p-4">
              <p className="text-gray-300 text-sm text-center">
                Earn more GHETTO to reach the minimum redemption of {platformSettings.referral_min_redeem_ghetto || 'N/A'} GHETTO
              </p>
            </div>
          )}
        </div>

        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-black text-white mb-4">Referred Users ({referredUsers.length})</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {referredUsers.length > 0 ? (
              referredUsers.map((refUser) => (
                <div key={refUser.id} className="flex items-center justify-between luxe-glass rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-luxe-gold rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">User {refUser.referredUserId.slice(0, 8)}...</p>
                      <p className="text-gray-400 text-xs">{formatDistanceToNow(refUser.createdAt, { addSuffix: true })}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    refUser.accountRewardClaimed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {refUser.accountRewardClaimed ? 'Reward Claimed' : 'Pending'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No referrals yet</p>
                <p className="text-gray-500 text-xs mt-1">Share your link to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="luxe-glass rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-black text-white mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-luxe-gold" />
          Reward History
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {referralTransactions.length > 0 ? (
            referralTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between luxe-glass rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'signup_reward' ? 'bg-blue-500/20' :
                    tx.type === 'first_purchase_reward' ? 'bg-green-500/20' :
                    tx.type === 'commission' ? 'bg-purple-500/20' :
                    'bg-yellow-500/20'
                  }`}>
                    {tx.type === 'redemption' ? (
                      <DollarSign className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <Share2 className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-gray-400 text-xs">{formatDistanceToNow(tx.createdAt, { addSuffix: true })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${tx.amountGhetto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amountGhetto >= 0 ? '+' : ''}{tx.amountGhetto.toFixed(2)} GHETTO
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">My Listings</h2>
          <p className="text-gray-400">Manage your products and inventory</p>
        </div>
        <button
          onClick={() => setShowSellerModal(true)}
          className="px-6 py-3 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-black uppercase"
        >
          Manage All Listings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Package className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-3xl font-black text-white mb-1">{productStats.active}</p>
          <p className="text-gray-400 text-sm">Active Listings</p>
        </div>

        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white mb-1">{productStats.total}</p>
          <p className="text-gray-400 text-sm">Total Products</p>
        </div>

        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-3xl font-black text-white mb-1">0</p>
          <p className="text-gray-400 text-sm">Sold Items</p>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-black text-white mb-4">Recent Listings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.slice(0, 6).map((product) => (
              <div key={product.id} className="luxe-glass rounded-lg p-4 flex items-start space-x-3">
                {product.images.length > 0 ? (
                  <img
                    src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h5 className="text-white font-medium text-sm line-clamp-1">{product.title}</h5>
                  <p className="text-gray-400 text-xs">{product.price} {product.currency}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    product.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    product.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {product.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="luxe-glass rounded-2xl p-12 border border-white/10 text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-black text-white mb-2">No listings yet</h3>
          <p className="text-gray-400 mb-6">Start selling by creating your first listing</p>
          <button
            onClick={() => setShowSellerModal(true)}
            className="px-6 py-3 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-black uppercase"
          >
            Create Listing
          </button>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white mb-2">Account Settings</h2>
        <p className="text-gray-400">Manage your preferences and account information</p>
      </div>

      <div className="luxe-glass rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-black text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-gray-400 text-sm">Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
              </div>
              <button
                onClick={() => setNotificationSettings({ ...notificationSettings, [key]: !value })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-luxe-gold' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="luxe-glass rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-black text-white mb-4">Account Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Username</label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-lg text-white opacity-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Email</label>
            <input
              type="email"
              value={user.email || 'Not set'}
              disabled
              className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-lg text-white opacity-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Member Since</label>
            <input
              type="text"
              value={new Date(user.createdAt).toLocaleDateString()}
              disabled
              className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-lg text-white opacity-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <CacheManagement />
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="luxe-glass-strong rounded-3xl border border-white/10 w-full max-w-7xl h-[90vh] overflow-hidden shadow-2xl flex">
          {/* Sidebar */}
          <div className="w-64 luxe-glass border-r border-white/10 flex flex-col">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-luxe-gold rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-black truncate">{user.name}</h3>
                  <p className="text-gray-400 text-sm truncate">@{user.username}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as DashboardSection)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-luxe-gold text-black'
                        : 'text-gray-300 hover:luxe-glass'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        activeSection === item.id ? 'bg-black/20 text-black' : 'bg-luxe-gold text-black'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 luxe-glass hover:bg-gray-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Close Dashboard</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {isOffline && (
              <OfflineBanner
                cacheAge="a few minutes"
                onRefresh={() => window.location.reload()}
              />
            )}
            {activeSection === 'overview' && renderOverview()}
            {activeSection === 'referrals' && renderReferrals()}
            {activeSection === 'listings' && renderListings()}
            {activeSection === 'settings' && renderSettings()}
            {activeSection === 'orders' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-white mb-2">My Orders</h2>
                  <p className="text-gray-400">Track and manage your purchases and sales</p>
                </div>
                <button
                  onClick={() => setShowOrdersModal(true)}
                  className="w-full py-4 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-black uppercase"
                >
                  Open Order Management
                </button>
              </div>
            )}
            {activeSection === 'wallet' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-white mb-2">My Wallet</h2>
                  <p className="text-gray-400">Manage your crypto balances and transactions</p>
                </div>
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="w-full py-4 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-black uppercase"
                >
                  Open Wallet Dashboard
                </button>
              </div>
            )}
            {activeSection === 'messages' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-white mb-2">Messages</h2>
                  <p className="text-gray-400">Communicate with buyers and sellers</p>
                </div>
                <button
                  onClick={() => setShowMessagesModal(true)}
                  className="w-full py-4 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-black uppercase"
                >
                  Open Messaging Center
                </button>
              </div>
            )}
            {activeSection === 'sponsorships' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">Sponsorships</h2>
                  <p className="text-gray-400">Invest in sellers or receive funding for your business</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-black text-white mb-4">My Investments</h3>
                    <p className="text-3xl font-black text-luxe-gold mb-2">{myInvestments.length}</p>
                    <p className="text-gray-400 text-sm">Active sponsorships</p>
                  </div>
                  <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-black text-white mb-4">My Requests</h3>
                    <p className="text-3xl font-black text-luxe-gold mb-2">{myRequests.length}</p>
                    <p className="text-gray-400 text-sm">Funding requests</p>
                  </div>
                </div>
              </div>
            )}
            {activeSection === 'disputes' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">Disputes</h2>
                  <p className="text-gray-400">Manage and track your dispute cases</p>
                </div>
                <div className="luxe-glass rounded-2xl p-12 border border-white/10 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">No active disputes</h3>
                  <p className="text-gray-400">You don't have any open dispute cases</p>
                </div>
              </div>
            )}
            {activeSection === 'activity' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">Activity Timeline</h2>
                  <p className="text-gray-400">Your recent actions and events on the platform</p>
                </div>
                <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Account created</p>
                        <p className="text-gray-400 text-sm">{formatDistanceToNow(user.createdAt, { addSuffix: true })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sitemaster Sections */}
            {activeSection === 'sitemaster-users' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-red-500 mb-2">
                    <Shield className="w-8 h-8 inline-block mr-2" />
                    User Management
                  </h2>
                  <p className="text-gray-400">Search and manage platform users</p>
                </div>

                <div className="luxe-glass rounded-2xl p-6 border border-red-500/20">
                  <div className="mb-6">
                    <input
                      type="text"
                      value={smSearchQuery}
                      onChange={(e) => setSmSearchQuery(e.target.value)}
                      placeholder="Search users by username or email..."
                      className="w-full luxe-glass-strong text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      onClick={async () => {
                        const results = await searchUsers(smSearchQuery);
                        setSmSearchResults(results);
                      }}
                      className="mt-3 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
                    >
                      Search Users
                    </button>
                  </div>

                  {smSearchResults.length > 0 && (
                    <div className="space-y-3">
                      {smSearchResults.map((searchUser: any) => (
                        <div key={searchUser.id} className="luxe-glass-strong p-4 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-white font-bold">{searchUser.username}</p>
                              <p className="text-gray-400 text-sm">{searchUser.email}</p>
                              <p className="text-gray-500 text-xs mt-1">ID: {searchUser.id}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => flagUser(searchUser.id, 'suspicious_activity', 'Flagged by sitemaster')}
                                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
                              >
                                Flag
                              </button>
                              <button
                                onClick={() => suspendUser(searchUser.id, 'Policy violation', 7)}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                              >
                                Suspend
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'sitemaster-content' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-red-500 mb-2">
                    <Package className="w-8 h-8 inline-block mr-2" />
                    Content Management
                  </h2>
                  <p className="text-gray-400">Monitor and moderate platform content</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                    <Package className="w-8 h-8 text-blue-400 mb-3" />
                    <p className="text-3xl font-black text-white mb-1">{platformStats?.totalProducts || 0}</p>
                    <p className="text-gray-400 text-sm">Total Products</p>
                  </div>
                  <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                    <MessageCircle className="w-8 h-8 text-green-400 mb-3" />
                    <p className="text-3xl font-black text-white mb-1">{platformStats?.totalMessages || 0}</p>
                    <p className="text-gray-400 text-sm">Total Messages</p>
                  </div>
                  <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                    <Users className="w-8 h-8 text-purple-400 mb-3" />
                    <p className="text-3xl font-black text-white mb-1">{platformStats?.totalUsers || 0}</p>
                    <p className="text-gray-400 text-sm">Total Users</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'sitemaster-flags' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-red-500 mb-2">
                    <AlertCircle className="w-8 h-8 inline-block mr-2" />
                    Flagged Content
                  </h2>
                  <p className="text-gray-400">Review and resolve reported content</p>
                </div>

                <div className="space-y-3">
                  {flags && flags.length > 0 ? (
                    flags.map((flag: any) => (
                      <div key={flag.id} className="luxe-glass rounded-2xl p-6 border border-yellow-500/20">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-bold">Flag Type: {flag.flag_type}</p>
                            <p className="text-gray-400 text-sm mt-1">{flag.reason}</p>
                            <p className="text-gray-500 text-xs mt-2">User ID: {flag.user_id}</p>
                          </div>
                          <button
                            onClick={() => resolveFlag(flag.id)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="luxe-glass rounded-2xl p-12 border border-white/10 text-center">
                      <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-black text-white mb-2">No flagged content</h3>
                      <p className="text-gray-400">All reports have been resolved</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'sitemaster-escrow' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-red-500 mb-2">
                    <Shield className="w-8 h-8 inline-block mr-2" />
                    Escrow Management
                  </h2>
                  <p className="text-gray-400">Monitor and manage escrow transactions</p>
                </div>

                <div className="space-y-3">
                  {smEscrowOrders && smEscrowOrders.length > 0 ? (
                    smEscrowOrders.map((order: any) => (
                      <div key={order.id} className="luxe-glass rounded-2xl p-6 border border-blue-500/20">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-bold">Order: {order.order_number || order.id}</p>
                            <p className="text-gray-400 text-sm">Status: {order.status}</p>
                            <p className="text-gray-400 text-sm">Amount: ${order.amount}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="luxe-glass rounded-2xl p-12 border border-white/10 text-center">
                      <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-black text-white mb-2">No escrow orders</h3>
                      <p className="text-gray-400">No active escrow transactions</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'sitemaster-analytics' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-red-500 mb-2">
                    <BarChart3 className="w-8 h-8 inline-block mr-2" />
                    Platform Analytics
                  </h2>
                  <p className="text-gray-400">View platform statistics and trends</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                    <Users className="w-8 h-8 text-blue-400 mb-3" />
                    <p className="text-3xl font-black text-white mb-1">{platformStats?.totalUsers || 0}</p>
                    <p className="text-gray-400 text-sm">Total Users</p>
                  </div>
                  <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                    <Package className="w-8 h-8 text-green-400 mb-3" />
                    <p className="text-3xl font-black text-white mb-1">{platformStats?.totalProducts || 0}</p>
                    <p className="text-gray-400 text-sm">Total Products</p>
                  </div>
                  <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                    <ShoppingBag className="w-8 h-8 text-yellow-400 mb-3" />
                    <p className="text-3xl font-black text-white mb-1">{platformStats?.totalOrders || 0}</p>
                    <p className="text-gray-400 text-sm">Total Orders</p>
                  </div>
                  <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                    <DollarSign className="w-8 h-8 text-purple-400 mb-3" />
                    <p className="text-3xl font-black text-white mb-1">${platformStats?.totalRevenue || 0}</p>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'sitemaster-settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-red-500 mb-2">
                    <Settings className="w-8 h-8 inline-block mr-2" />
                    Platform Settings
                  </h2>
                  <p className="text-gray-400">Configure platform-wide settings</p>
                </div>

                <div className="luxe-glass rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-black text-white mb-4">System Configuration</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 luxe-glass-strong rounded-xl">
                      <div>
                        <p className="text-white font-bold">Maintenance Mode</p>
                        <p className="text-gray-400 text-sm">Enable site-wide maintenance mode</p>
                      </div>
                      <button className="px-4 py-2 luxe-glass hover:bg-gray-600 text-white rounded-xl">
                        Toggle
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 luxe-glass-strong rounded-xl">
                      <div>
                        <p className="text-white font-bold">User Registration</p>
                        <p className="text-gray-400 text-sm">Allow new user signups</p>
                      </div>
                      <button className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl">
                        Enabled
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'sitemaster-wizardry' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-purple-500 mb-2">
                    <Wand2 className="w-8 h-8 inline-block mr-2" />
                    Wizardry
                  </h2>
                  <p className="text-gray-400">Advanced magical operations and powerful commands</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-purple-500/30">
                    <Wand2 className="w-12 h-12 text-purple-400 mb-4" />
                    <h3 className="text-xl font-black text-white mb-2">Database Spells</h3>
                    <p className="text-gray-300 text-sm mb-4">Execute powerful database operations</p>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors">
                        Purge Old Data
                      </button>
                      <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors">
                        Reindex Tables
                      </button>
                      <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors">
                        Optimize Storage
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-2xl p-6 border border-blue-500/30">
                    <Shield className="w-12 h-12 text-blue-400 mb-4" />
                    <h3 className="text-xl font-black text-white mb-2">Security Enchantments</h3>
                    <p className="text-gray-300 text-sm mb-4">Cast protective spells on the platform</p>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
                        Scan for Threats
                      </button>
                      <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
                        Audit Permissions
                      </button>
                      <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
                        Fortify Defenses
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-2xl p-6 border border-green-500/30">
                    <Activity className="w-12 h-12 text-green-400 mb-4" />
                    <h3 className="text-xl font-black text-white mb-2">Performance Rituals</h3>
                    <p className="text-gray-300 text-sm mb-4">Invoke speed and efficiency</p>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors">
                        Clear Cache
                      </button>
                      <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors">
                        Rebuild Indexes
                      </button>
                      <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors">
                        Optimize Routes
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-900/50 to-orange-900/50 rounded-2xl p-6 border border-red-500/30">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                    <h3 className="text-xl font-black text-white mb-2">Forbidden Incantations</h3>
                    <p className="text-gray-300 text-sm mb-4">Use with extreme caution</p>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors">
                        Nuclear Reset
                      </button>
                      <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors">
                        Force Migrations
                      </button>
                      <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors">
                        Override All
                      </button>
                    </div>
                  </div>
                </div>

                <div className="luxe-glass rounded-2xl p-6 border border-purple-500/30">
                  <h3 className="text-xl font-black text-purple-400 mb-4">Spell Console</h3>
                  <div className="luxe-glass-strong rounded-xl p-4 font-mono text-sm">
                    <p className="text-green-400">$ <span className="text-white">Ready to cast spells...</span></p>
                    <p className="text-gray-500 mt-2"># Execute custom commands with wizard privileges</p>
                    <p className="text-gray-500"># Type 'help' for available incantations</p>
                  </div>
                  <button className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors">
                    Open Spell Terminal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <OrderManagement isOpen={showOrdersModal} onClose={() => setShowOrdersModal(false)} />
      <WalletDashboard isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      <MessagingCenter
        isOpen={showMessagesModal}
        onClose={() => setShowMessagesModal(false)}
        onStartCall={handleStartCall}
        activeCallConversationId={activeCall?.conversationId}
      />
      <SellerDashboard isOpen={showSellerModal} onClose={() => setShowSellerModal(false)} />

      {/* Video Call */}
      {activeCall && (
        <VideoCallModal
          session={activeCall}
          participantName={callParticipantName || 'User'}
          onEnd={endCall}
        />
      )}

      {/* Incoming Call Notification */}
      {incomingCall && !activeCall && (
        <IncomingCallNotification
          incomingCall={incomingCall}
          onAccept={handleAcceptCall}
          onDecline={(session) => declineCall(session)}
        />
      )}
    </>
  );
}
