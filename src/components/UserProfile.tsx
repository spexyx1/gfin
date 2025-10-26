import React, { useState, useEffect } from 'react';
import { X, User, Settings, Shield, Store, MessageCircle, Star, MapPin, Globe, Calendar, CreditCard as Edit, Camera, Save, AtSign, Share2, DollarSign } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocialSystem } from '../hooks/useSocialSystem';
import { useSellerProducts } from '../hooks/useSellerProducts';
import { useMessaging } from '../hooks/useMessaging';
import { useReferrals } from '../hooks/useReferrals';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'store'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    handle: '',
    displayName: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
    coverImage: '',
    storeEnabled: false,
    storeName: '',
    storeDescription: '',
    storeTheme: 'cyberpunk' as const,
  });

  const { user } = useAuth();
  const { getUserProfile, updateUserProfile, createUserProfile } = useSocialSystem();
  const { products, getProductStats } = useSellerProducts();
  const { createConversation } = useMessaging();
  const { referralCode, referredUsers, referralBalance, referralTransactions, platformSettings, isLoading: referralsLoading, redeemBalance } = useReferrals();
  const [redeemAmount, setRedeemAmount] = useState('');

  const userProfile = user ? getUserProfile(user.id) : null;
  const productStats = getProductStats();

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        handle: userProfile.handle,
        displayName: userProfile.displayName,
        bio: userProfile.bio,
        location: userProfile.location || '',
        website: userProfile.website || '',
        avatar: userProfile.avatar || '',
        coverImage: userProfile.coverImage || '',
        storeEnabled: userProfile.storeSettings.isEnabled,
        storeName: userProfile.storeSettings.storeName,
        storeDescription: userProfile.storeSettings.storeDescription,
        storeTheme: userProfile.storeSettings.storeTheme,
      });
    } else if (user) {
      setProfileData({
        handle: user.username,
        displayName: user.name,
        bio: '',
        location: '',
        website: '',
        avatar: '',
        coverImage: '',
        storeEnabled: false,
        storeName: '',
        storeDescription: '',
        storeTheme: 'cyberpunk',
      });
    }
  }, [userProfile, user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      if (userProfile) {
        await updateUserProfile({
          ...profileData,
          storeSettings: {
            ...userProfile.storeSettings,
            isEnabled: profileData.storeEnabled,
            storeName: profileData.storeName,
            storeDescription: profileData.storeDescription,
            storeTheme: profileData.storeTheme,
          }
        });
      } else {
        await createUserProfile({
          ...profileData,
          storeSettings: {
            isEnabled: profileData.storeEnabled,
            storeName: profileData.storeName,
            storeDescription: profileData.storeDescription,
            storeTheme: profileData.storeTheme,
            featuredProducts: [],
            storeCategories: [],
          }
        });
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
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

    await redeemBalance(amount);
    setRedeemAmount('');
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-4xl h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-neon-blue" />
            <h2 className="text-2xl font-black text-white uppercase">User Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-neon-blue to-neon-red relative overflow-hidden">
            {profileData.coverImage && (
              <img
                src={profileData.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/30"></div>
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex items-end space-x-6 -mt-16">
              <div className="relative">
                <div className="w-24 h-24 bg-neon-blue rounded-full border-4 border-gray-900 flex items-center justify-center">
                  {profileData.avatar ? (
                    <img
                      src={profileData.avatar}
                      alt={profileData.displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-black" />
                  )}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-900">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

              <div className="flex-1 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.displayName}
                          onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white"
                        />
                      ) : (
                        profileData.displayName
                      )}
                    </h3>
                    <p className="text-neon-blue font-medium">
                      @{isEditing ? (
                        <input
                          type="text"
                          value={profileData.handle}
                          onChange={(e) => setProfileData({ ...profileData, handle: e.target.value })}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-neon-blue w-32"
                        />
                      ) : (
                        profileData.handle
                      )}
                    </p>
                    {user.verified && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Shield className="w-4 h-4 text-neon-blue" />
                        <span className="text-neon-blue text-sm font-medium">Verified</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSaveProfile();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className="px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-medium flex items-center space-x-2"
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Bio */}
                <div className="mt-3">
                  {isEditing ? (
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={2}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white resize-none"
                      placeholder="Tell others about yourself..."
                    />
                  ) : (
                    <p className="text-gray-300">{profileData.bio || 'No bio yet'}</p>
                  )}
                </div>

                {/* Profile Stats */}
                <div className="flex items-center space-x-6 mt-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">
                      Joined {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  {profileData.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">{profileData.location}</span>
                    </div>
                  )}
                  {profileData.website && (
                    <div className="flex items-center space-x-1">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a
                        href={profileData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neon-blue hover:text-neon-blue/80 transition-colors"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'referrals', label: 'Referrals', icon: Share2 },
            { id: 'referrals', label: 'Referrals', icon: Share2 },
            { id: 'store', label: 'Store', icon: Store },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === id
                  ? 'text-neon-blue border-b-2 border-neon-blue bg-gray-800/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-center">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                  <p className="text-2xl font-black text-white">{user.rating || 0}</p>
                  <p className="text-gray-400 text-sm">Rating</p>
                </div>

                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-center">
                  <Package className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <p className="text-2xl font-black text-white">{productStats.total}</p>
                  <p className="text-gray-400 text-sm">Products Listed</p>
                </div>

                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 text-center">
                  <MessageCircle className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <p className="text-2xl font-black text-white">{userProfile?.stats.completedTrades || 0}</p>
                  <p className="text-gray-400 text-sm">Completed Trades</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-4 uppercase">Recent Products</h4>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No products listed yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.slice(0, 4).map((product) => (
                      <div key={product.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          {product.images.length > 0 ? (
                            <img
                              src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h5 className="text-white font-medium text-sm line-clamp-1">{product.title}</h5>
                            <p className="text-gray-400 text-xs">{product.price} GHETTO</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              product.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              product.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {product.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-4 uppercase">Profile Settings</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Display Name</label>
                      <input
                        type="text"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">@Handle</label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                          type="text"
                          value={profileData.handle}
                          onChange={(e) => setProfileData({ ...profileData, handle: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white resize-none"
                      placeholder="Tell others about yourself..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Location</label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        placeholder="City, Country"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Website</label>
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        placeholder="https://your-website.com"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    className="w-full py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-black uppercase"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-4 uppercase">Your Referral Link</h4>
                {referralCode ? (
                  <>
                    <p className="text-gray-400 mb-3">Share this link to invite new users and earn rewards!</p>
                    <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-3">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/?ref=${referralCode.code}`}
                        className="flex-1 bg-transparent text-neon-blue font-mono text-sm outline-none"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?ref=${referralCode.code}`)}
                        className="px-3 py-1 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg text-sm font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400">Loading referral code...</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Referral Balance</h4>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-4xl font-black text-neon-blue">
                      {referralBalance?.balanceGhetto.toFixed(2) || '0.00'} GHETTO
                    </p>
                    <DollarSign className="w-10 h-10 text-neon-blue" />
                  </div>
                  {referralBalance && parseFloat(platformSettings.referral_min_redeem_ghetto) && referralBalance.balanceGhetto >= parseFloat(platformSettings.referral_min_redeem_ghetto) ? (
                    <div className="space-y-3">
                      <input
                        type="number"
                        step="0.01"
                        min={parseFloat(platformSettings.referral_min_redeem_ghetto)}
                        max={referralBalance.balanceGhetto}
                        value={redeemAmount}
                        onChange={(e) => setRedeemAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        placeholder={`Min ${platformSettings.referral_min_redeem_ghetto} GHETTO`}
                      />
                      <button
                        onClick={handleRedeemBalance}
                        disabled={referralsLoading || !redeemAmount || parseFloat(redeemAmount) < parseFloat(platformSettings.referral_min_redeem_ghetto)}
                        className="w-full py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-black uppercase"
                      >
                        {referralsLoading ? 'Redeeming...' : 'Redeem GHETTO'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      Earn more GHETTO to reach the minimum redemption of {platformSettings.referral_min_redeem_ghetto || 'N/A'} GHETTO.
                    </p>
                  )}
                </div>

                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Referred Users ({referredUsers.length})</h4>
                  {referredUsers.length > 0 ? (
                    <div className="space-y-3">
                      {referredUsers.map((refUser) => (
                        <div key={refUser.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                          <p className="text-white font-medium">User ID: {refUser.referredUserId.slice(0, 8)}...</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            refUser.accountRewardClaimed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {refUser.accountRewardClaimed ? 'Account Reward Claimed' : 'Account Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No users referred yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-4 uppercase">Referral Transactions</h4>
                {referralTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {referralTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                        <p className="text-white font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                        <p className={`font-black ${tx.amountGhetto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amountGhetto >= 0 ? '+' : ''}{tx.amountGhetto.toFixed(2)} GHETTO
                        </p>
                        <p className="text-gray-400 text-xs">{formatDistanceToNow(tx.createdAt, { addSuffix: true })}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No referral transactions yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-4 uppercase">Your Referral Link</h4>
                {referralCode ? (
                  <>
                    <p className="text-gray-400 mb-3">Share this link to invite new users and earn rewards!</p>
                    <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-3">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/?ref=${referralCode.code}`}
                        className="flex-1 bg-transparent text-neon-blue font-mono text-sm outline-none"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?ref=${referralCode.code}`)}
                        className="px-3 py-1 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg text-sm font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400">Loading referral code...</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Referral Balance</h4>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-4xl font-black text-neon-blue">
                      {referralBalance?.balanceGhetto.toFixed(2) || '0.00'} GHETTO
                    </p>
                    <DollarSign className="w-10 h-10 text-neon-blue" />
                  </div>
                  {referralBalance && parseFloat(platformSettings.referral_min_redeem_ghetto) && referralBalance.balanceGhetto >= parseFloat(platformSettings.referral_min_redeem_ghetto) ? (
                    <div className="space-y-3">
                      <input
                        type="number"
                        step="0.01"
                        min={parseFloat(platformSettings.referral_min_redeem_ghetto)}
                        max={referralBalance.balanceGhetto}
                        value={redeemAmount}
                        onChange={(e) => setRedeemAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        placeholder={`Min ${platformSettings.referral_min_redeem_ghetto} GHETTO`}
                      />
                      <button
                        onClick={handleRedeemBalance}
                        disabled={referralsLoading || !redeemAmount || parseFloat(redeemAmount) < parseFloat(platformSettings.referral_min_redeem_ghetto)}
                        className="w-full py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-black uppercase"
                      >
                        {referralsLoading ? 'Redeeming...' : 'Redeem GHETTO'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      Earn more GHETTO to reach the minimum redemption of {platformSettings.referral_min_redeem_ghetto || 'N/A'} GHETTO.
                    </p>
                  )}
                </div>

                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Referred Users ({referredUsers.length})</h4>
                  {referredUsers.length > 0 ? (
                    <div className="space-y-3">
                      {referredUsers.map((refUser) => (
                        <div key={refUser.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                          <p className="text-white font-medium">User ID: {refUser.referredUserId.slice(0, 8)}...</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            refUser.accountRewardClaimed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {refUser.accountRewardClaimed ? 'Account Reward Claimed' : 'Account Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No users referred yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-4 uppercase">Referral Transactions</h4>
                {referralTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {referralTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                        <p className="text-white font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                        <p className={`font-black ${tx.amountGhetto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amountGhetto >= 0 ? '+' : ''}{tx.amountGhetto.toFixed(2)} GHETTO
                        </p>
                        <p className="text-gray-400 text-xs">{formatDistanceToNow(tx.createdAt, { addSuffix: true })}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No referral transactions yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Store Tab */}
          {activeTab === 'store' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-white uppercase">Store Settings</h4>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="storeEnabled"
                      checked={profileData.storeEnabled}
                      onChange={(e) => setProfileData({ ...profileData, storeEnabled: e.target.checked })}
                      className="w-4 h-4 text-neon-blue bg-gray-700 border-gray-600 rounded focus:ring-neon-blue"
                    />
                    <label htmlFor="storeEnabled" className="text-white font-medium">
                      Enable Store Page
                    </label>
                  </div>
                </div>

                {profileData.storeEnabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Store Name</label>
                      <input
                        type="text"
                        value={profileData.storeName}
                        onChange={(e) => setProfileData({ ...profileData, storeName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        placeholder="Your store name"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Store Description</label>
                      <textarea
                        value={profileData.storeDescription}
                        onChange={(e) => setProfileData({ ...profileData, storeDescription: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white resize-none"
                        placeholder="Describe what you sell..."
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Store Theme</label>
                      <select
                        value={profileData.storeTheme}
                        onChange={(e) => setProfileData({ ...profileData, storeTheme: e.target.value as any })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                      >
                        <option value="cyberpunk">Cyberpunk</option>
                        <option value="dark">Dark</option>
                        <option value="neon">Neon</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      className="w-full py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-black uppercase"
                    >
                      Save Store Settings
                    </button>
                  </div>
                )}
              </div>

              {/* Store Preview */}
              {profileData.storeEnabled && (
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Store Preview</h4>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h5 className="text-neon-blue font-black text-lg">{profileData.storeName || 'Your Store'}</h5>
                    <p className="text-gray-300 text-sm mt-2">{profileData.storeDescription || 'Store description will appear here'}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {products.slice(0, 4).map((product) => (
                        <div key={product.id} className="bg-gray-600 rounded-lg p-3">
                          <h6 className="text-white font-medium text-xs line-clamp-1">{product.title}</h6>
                          <p className="text-gray-300 text-xs">{product.price} GHETTO</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}