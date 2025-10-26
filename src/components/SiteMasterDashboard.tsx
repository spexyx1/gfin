import React, { useState } from 'react';
import { X, Shield, Gavel, Users, AlertTriangle, CheckCircle, DollarSign, Settings, TrendingUp, Package, MessageCircle, Clock, Ban, Eye, CreditCard, Zap, Lock, Unlock, Coins, Flame, Share2, Gift, Target, BarChart3, UserCheck, Award, RefreshCw } from 'lucide-react';
import { useSiteMaster } from '../hooks/useSiteMaster';
import { useWeb3 } from '../hooks/useWeb3';
import { formatDistanceToNow } from 'date-fns';

interface SiteMasterDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SiteMasterDashboard({ isOpen, onClose }: SiteMasterDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'disputes' | 'users' | 'transactions' | 'contracts' | 'referrals'>('overview');
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showContractSettings, setShowContractSettings] = useState(false);
  const [showReferralSettings, setShowReferralSettings] = useState(false);
  const [contractSettingsForm, setContractSettingsForm] = useState({
    platformFee: '',
    nonGhettoFeeAddition: '',
    sellerHoldPercent: '',
  });
  const [referralSettingsForm, setReferralSettingsForm] = useState({
    signupReward: '',
    firstPurchaseReward: '',
    commissionPercent: '',
    minRedeem: '',
    maxRedeem: '',
  });
  const [tokenManagementForm, setTokenManagementForm] = useState({
    mintAddress: '',
    mintAmount: '',
    burnAmount: '',
    blacklistAddress: '',
    blacklistReason: '',
    whitelistAddress: '',
    whitelistName: '',
  });
  const [balanceAdjustmentForm, setBalanceAdjustmentForm] = useState({
    userId: '',
    amount: '',
    reason: '',
  });

  const {
    isSiteMaster,
    disputes,
    transactions,
    userAccounts,
    escrowSettings,
    ghettoSettings,
    blacklistedAddresses,
    whitelistedContracts,
    isLoading,
    contractLoading,
    referralStats,
    referralSettings,
    allReferralCodes,
    allReferredUsers,
    allReferralTransactions,
    allReferralBalances,
    resolveDispute,
    suspendUser,
    contactUser,
    flagTransaction,
    getDisputeStats,
    getTransactionStats,
    getUserStats,
    updatePlatformFee,
    updateNonGhettoFeeAddition,
    updateSellerHoldPercent,
    setAddressBlacklisted,
    setMarketplaceContractWhitelisted,
    setExternalTransfersAllowed,
    mintGhettoTokens,
    burnGhettoTokens,
    pauseGhettoTransfers,
    unpauseGhettoTransfers,
    loadReferralSystemData,
    updateReferralSettings,
    forceClaimReward,
    adjustUserReferralBalance,
  } = useSiteMaster();

  const { account, isConnected } = useWeb3();

  const disputeStats = getDisputeStats();
  const transactionStats = getTransactionStats();
  const userStats = getUserStats();

  // Initialize form data when settings load
  React.useEffect(() => {
    if (escrowSettings) {
      setContractSettingsForm({
        platformFee: escrowSettings.platformFeePercent.toString(),
        nonGhettoFeeAddition: escrowSettings.nonGhettoFeeAddition.toString(),
        sellerHoldPercent: escrowSettings.sellerHoldPercent.toString(),
      });
    }
  }, [escrowSettings]);

  React.useEffect(() => {
    if (referralSettings) {
      setReferralSettingsForm({
        signupReward: referralSettings.signupRewardGhetto.toString(),
        firstPurchaseReward: referralSettings.firstPurchaseRewardGhetto.toString(),
        commissionPercent: referralSettings.commissionPercent.toString(),
        minRedeem: referralSettings.minRedeemGhetto.toString(),
        maxRedeem: referralSettings.maxRedeemGhetto.toString(),
      });
    }
  }, [referralSettings]);

  const handleResolveDispute = async (disputeId: string, decision: 'favor_buyer' | 'favor_seller' | 'partial_refund', reasoning: string, refundAmount?: number) => {
    try {
      await resolveDispute(disputeId, {
        decision,
        reasoning,
        refundAmount,
        resolvedBy: 'sitemaster',
        resolvedAt: new Date(),
      });
      alert('Dispute resolved successfully');
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      alert('Failed to resolve dispute');
    }
  };

  const handleSuspendUser = async (userId: string, reason: string, duration: number) => {
    try {
      await suspendUser(userId, reason, duration);
      alert('User suspended successfully');
    } catch (error) {
      console.error('Failed to suspend user:', error);
      alert('Failed to suspend user');
    }
  };

  const handleUpdateContractSettings = async () => {
    try {
      if (contractSettingsForm.platformFee) {
        await updatePlatformFee(parseFloat(contractSettingsForm.platformFee));
      }
      if (contractSettingsForm.nonGhettoFeeAddition) {
        await updateNonGhettoFeeAddition(parseFloat(contractSettingsForm.nonGhettoFeeAddition));
      }
      if (contractSettingsForm.sellerHoldPercent) {
        await updateSellerHoldPercent(parseFloat(contractSettingsForm.sellerHoldPercent));
      }
      
      setShowContractSettings(false);
      alert('Contract settings updated successfully');
    } catch (error) {
      console.error('Failed to update contract settings:', error);
      alert('Failed to update contract settings');
    }
  };

  const handleUpdateReferralSettings = async () => {
    try {
      const settings = {
        signupRewardGhetto: parseFloat(referralSettingsForm.signupReward),
        firstPurchaseRewardGhetto: parseFloat(referralSettingsForm.firstPurchaseReward),
        commissionPercent: parseFloat(referralSettingsForm.commissionPercent),
        minRedeemGhetto: parseFloat(referralSettingsForm.minRedeem),
        maxRedeemGhetto: parseFloat(referralSettingsForm.maxRedeem),
      };
      
      await updateReferralSettings(settings);
      setShowReferralSettings(false);
      alert('Referral settings updated successfully');
    } catch (error) {
      console.error('Failed to update referral settings:', error);
      alert('Failed to update referral settings');
    }
  };

  const handleMintTokens = async () => {
    try {
      await mintGhettoTokens(tokenManagementForm.mintAddress, parseFloat(tokenManagementForm.mintAmount));
      setTokenManagementForm({ ...tokenManagementForm, mintAddress: '', mintAmount: '' });
      alert('Tokens minted successfully');
    } catch (error) {
      console.error('Failed to mint tokens:', error);
      alert('Failed to mint tokens');
    }
  };

  const handleBurnTokens = async () => {
    try {
      await burnGhettoTokens(parseFloat(tokenManagementForm.burnAmount));
      setTokenManagementForm({ ...tokenManagementForm, burnAmount: '' });
      alert('Tokens burned successfully');
    } catch (error) {
      console.error('Failed to burn tokens:', error);
      alert('Failed to burn tokens');
    }
  };

  const handleBlacklistAddress = async () => {
    try {
      await setAddressBlacklisted(tokenManagementForm.blacklistAddress, true, tokenManagementForm.blacklistReason);
      setTokenManagementForm({ ...tokenManagementForm, blacklistAddress: '', blacklistReason: '' });
      alert('Address blacklisted successfully');
    } catch (error) {
      console.error('Failed to blacklist address:', error);
      alert('Failed to blacklist address');
    }
  };

  const handleWhitelistContract = async () => {
    try {
      await setMarketplaceContractWhitelisted(tokenManagementForm.whitelistAddress, true, tokenManagementForm.whitelistName);
      setTokenManagementForm({ ...tokenManagementForm, whitelistAddress: '', whitelistName: '' });
      alert('Contract whitelisted successfully');
    } catch (error) {
      console.error('Failed to whitelist contract:', error);
      alert('Failed to whitelist contract');
    }
  };

  const handleAdjustBalance = async () => {
    try {
      await adjustUserReferralBalance(
        balanceAdjustmentForm.userId,
        parseFloat(balanceAdjustmentForm.amount),
        balanceAdjustmentForm.reason
      );
      setBalanceAdjustmentForm({ userId: '', amount: '', reason: '' });
      alert('Balance adjusted successfully');
    } catch (error) {
      console.error('Failed to adjust balance:', error);
      alert('Failed to adjust balance');
    }
  };

  if (!isOpen || !isSiteMaster) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-7xl h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-red-400" />
            <h2 className="text-2xl font-black text-white uppercase">Site Master Dashboard</h2>
            {!isConnected && (
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">
                Wallet Required for Contract Operations
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'disputes', label: 'Disputes', icon: Gavel },
                  { id: 'users', label: 'Users', icon: Users },
                  { id: 'transactions', label: 'Transactions', icon: DollarSign },
                  { id: 'contracts', label: 'Contracts', icon: Settings },
                  { id: 'referrals', label: 'Referrals', icon: Share2 },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      activeTab === id
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <h3 className="text-2xl font-black text-white uppercase">Platform Overview</h3>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                      <Gavel className="w-8 h-8 text-red-400" />
                      <div>
                        <p className="text-2xl font-black text-white">{disputeStats.pending}</p>
                        <p className="text-gray-400 text-sm">Pending Disputes</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                      <Users className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-2xl font-black text-white">{userStats.active}</p>
                        <p className="text-gray-400 text-sm">Active Users</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                      <DollarSign className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-2xl font-black text-white">${transactionStats.totalValue.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">Total Volume</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-center space-x-3 mb-4">
                      <Share2 className="w-8 h-8 text-purple-400" />
                      <div>
                        <p className="text-2xl font-black text-white">{referralStats?.totalReferredUsers || 0}</p>
                        <p className="text-gray-400 text-sm">Referred Users</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contract Status */}
                {(escrowSettings || ghettoSettings) && (
                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <h4 className="text-lg font-black text-white mb-4 uppercase">Contract Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {escrowSettings && (
                        <div className="space-y-3">
                          <h5 className="text-white font-medium">Escrow Contract</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Platform Fee:</span>
                              <span className="text-white">{escrowSettings.platformFeePercent}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Non-GHETTO Fee:</span>
                              <span className="text-white">+{escrowSettings.nonGhettoFeeAddition}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Seller Hold:</span>
                              <span className="text-white">{escrowSettings.sellerHoldPercent}%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {ghettoSettings && (
                        <div className="space-y-3">
                          <h5 className="text-white font-medium">GHETTO Token</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total Supply:</span>
                              <span className="text-white">{ghettoSettings.totalSupply.toLocaleString()} GHETTO</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">External Transfers:</span>
                              <span className={ghettoSettings.externalTransfersAllowed ? 'text-green-400' : 'text-red-400'}>
                                {ghettoSettings.externalTransfersAllowed ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Status:</span>
                              <span className={ghettoSettings.paused ? 'text-red-400' : 'text-green-400'}>
                                {ghettoSettings.paused ? 'Paused' : 'Active'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white uppercase">Referral System Management</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => loadReferralSystemData()}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={() => setShowReferralSettings(true)}
                      className="px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-medium flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                  </div>
                </div>

                {/* Referral Stats */}
                {referralStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <Users className="w-8 h-8 text-blue-400" />
                        <div>
                          <p className="text-2xl font-black text-white">{referralStats.totalReferrers}</p>
                          <p className="text-gray-400 text-sm">Total Referrers</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <UserCheck className="w-8 h-8 text-green-400" />
                        <div>
                          <p className="text-2xl font-black text-white">{referralStats.totalReferredUsers}</p>
                          <p className="text-gray-400 text-sm">Referred Users</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <Coins className="w-8 h-8 text-yellow-400" />
                        <div>
                          <p className="text-2xl font-black text-white">{referralStats.totalGhettoEarned.toFixed(2)}</p>
                          <p className="text-gray-400 text-sm">GHETTO Earned</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <Target className="w-8 h-8 text-purple-400" />
                        <div>
                          <p className="text-2xl font-black text-white">{referralStats.conversionRate.toFixed(1)}%</p>
                          <p className="text-gray-400 text-sm">Conversion Rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Referral Codes */}
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Active Referral Codes ({allReferralCodes.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Code</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Referrals</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allReferralCodes.map((code) => {
                          const referralCount = allReferredUsers.filter(ru => ru.referrer_id === code.user_id).length;
                          return (
                            <tr key={code.id} className="border-b border-gray-700/50">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="text-white font-medium">@{code.user?.username || 'Unknown'}</p>
                                  <p className="text-gray-400 text-sm">{code.user?.email}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <code className="text-neon-blue font-mono bg-gray-700 px-2 py-1 rounded">
                                  {code.code}
                                </code>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-white font-medium">{referralCount}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-400 text-sm">
                                  {formatDistanceToNow(new Date(code.created_at), { addSuffix: true })}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Referred Users */}
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Referred Users ({allReferredUsers.length})</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Referred User</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Referrer</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Account Reward</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Purchase Reward</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allReferredUsers.map((refUser) => (
                          <tr key={refUser.id} className="border-b border-gray-700/50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-white font-medium">@{refUser.referred?.username || 'Unknown'}</p>
                                <p className="text-gray-400 text-sm">{refUser.referred?.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-white font-medium">@{refUser.referrer?.username || 'Unknown'}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                refUser.account_reward_claimed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {refUser.account_reward_claimed ? 'Claimed' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                refUser.first_purchase_reward_claimed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {refUser.first_purchase_reward_claimed ? 'Claimed' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                {!refUser.account_reward_claimed && (
                                  <button
                                    onClick={() => forceClaimReward(refUser.referred_user_id, 'signup')}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                                  >
                                    Force Claim Account
                                  </button>
                                )}
                                {!refUser.first_purchase_reward_claimed && (
                                  <button
                                    onClick={() => forceClaimReward(refUser.referred_user_id, 'first_purchase')}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                                  >
                                    Force Claim Purchase
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Referral Balances */}
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-black text-white uppercase">User Referral Balances</h4>
                    <button
                      onClick={() => setBalanceAdjustmentForm({ userId: '', amount: '', reason: '' })}
                      className="px-3 py-2 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg text-sm font-medium"
                    >
                      Adjust Balance
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Balance</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Last Updated</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allReferralBalances.map((balance) => (
                          <tr key={balance.user_id} className="border-b border-gray-700/50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-white font-medium">@{balance.user?.username || 'Unknown'}</p>
                                <p className="text-gray-400 text-sm">{balance.user?.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-neon-blue font-black">
                                {parseFloat(balance.balance_ghetto).toFixed(2)} GHETTO
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-400 text-sm">
                                {formatDistanceToNow(new Date(balance.updated_at), { addSuffix: true })}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => setBalanceAdjustmentForm({ 
                                  userId: balance.user_id, 
                                  amount: '', 
                                  reason: '' 
                                })}
                                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
                              >
                                Adjust
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Referral Transactions */}
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Recent Referral Transactions</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allReferralTransactions.slice(0, 20).map((transaction) => (
                          <tr key={transaction.id} className="border-b border-gray-700/50">
                            <td className="py-3 px-4">
                              <p className="text-white font-medium">@{transaction.user?.username || 'Unknown'}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.type === 'signup_reward' ? 'bg-blue-500/20 text-blue-400' :
                                transaction.type === 'first_purchase_reward' ? 'bg-green-500/20 text-green-400' :
                                transaction.type === 'commission' ? 'bg-purple-500/20 text-purple-400' :
                                transaction.type === 'redemption' ? 'bg-red-500/20 text-red-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {transaction.type.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-black ${
                                parseFloat(transaction.amount_ghetto) >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {parseFloat(transaction.amount_ghetto) >= 0 ? '+' : ''}{parseFloat(transaction.amount_ghetto).toFixed(2)} GHETTO
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-400 text-sm">
                                {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Disputes Tab */}
            {activeTab === 'disputes' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-white uppercase">Dispute Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-yellow-400">{disputeStats.pending}</p>
                    <p className="text-gray-400 text-sm">Pending</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-blue-400">{disputeStats.underReview}</p>
                    <p className="text-gray-400 text-sm">Under Review</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-green-400">{disputeStats.resolved}</p>
                    <p className="text-gray-400 text-sm">Resolved</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-red-400">{disputeStats.urgent}</p>
                    <p className="text-gray-400 text-sm">Urgent</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <div key={dispute.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-black text-white">{dispute.productTitle}</h4>
                          <p className="text-gray-400 text-sm">Order #{dispute.orderId}</p>
                          <p className="text-gray-300 mt-2">{dispute.disputeReason}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-white">${dispute.amount}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            dispute.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                            dispute.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            dispute.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {dispute.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          <p>Created: {formatDistanceToNow(dispute.createdAt, { addSuffix: true })}</p>
                          <p>Deadline: {formatDistanceToNow(dispute.deadline, { addSuffix: true })}</p>
                        </div>
                        
                        {dispute.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleResolveDispute(dispute.id, 'favor_buyer', 'Buyer claim validated')}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                            >
                              Favor Buyer
                            </button>
                            <button
                              onClick={() => handleResolveDispute(dispute.id, 'favor_seller', 'Seller claim validated')}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                            >
                              Favor Seller
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-white uppercase">User Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-green-400">{userStats.active}</p>
                    <p className="text-gray-400 text-sm">Active</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-red-400">{userStats.suspended}</p>
                    <p className="text-gray-400 text-sm">Suspended</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-yellow-400">{userStats.underReview}</p>
                    <p className="text-gray-400 text-sm">Under Review</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-orange-400">{userStats.highRisk}</p>
                    <p className="text-gray-400 text-sm">High Risk</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {userAccounts.map((user) => (
                    <div key={user.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-black text-white">@{user.username}</h4>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="text-gray-400">Transactions: {user.totalTransactions}</span>
                            <span className="text-gray-400">Disputes: {user.totalDisputes}</span>
                            <span className={`font-medium ${
                              user.riskScore >= 7 ? 'text-red-400' :
                              user.riskScore >= 4 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              Risk: {user.riskScore}/10
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            user.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                            user.status === 'under_review' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.status.toUpperCase()}
                          </span>
                          
                          {user.status === 'active' && (
                            <button
                              onClick={() => handleSuspendUser(user.id, 'Manual suspension', 7)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-white uppercase">Transaction Monitoring</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-blue-400">{transactionStats.total}</p>
                    <p className="text-gray-400 text-sm">Total</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-red-400">{transactionStats.flagged}</p>
                    <p className="text-gray-400 text-sm">Flagged</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-green-400">{transactionStats.completed}</p>
                    <p className="text-gray-400 text-sm">Completed</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-2xl font-black text-yellow-400">{transactionStats.disputed}</p>
                    <p className="text-gray-400 text-sm">Disputed</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-black text-white">Transaction #{transaction.id}</h4>
                          <p className="text-gray-400 text-sm">Order #{transaction.orderId}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="text-gray-400">Amount: ${transaction.amount}</span>
                            <span className="text-gray-400">Status: {transaction.status}</span>
                            {transaction.flagged && (
                              <span className="text-red-400">⚠ {transaction.flagReason}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {!transaction.flagged && (
                            <button
                              onClick={() => flagTransaction(transaction.id, 'Manual review required')}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs"
                            >
                              Flag
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contracts Tab */}
            {activeTab === 'contracts' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white uppercase">Contract Management</h3>
                  {!isConnected && (
                    <div className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg text-sm font-medium">
                      Connect wallet to manage contracts
                    </div>
                  )}
                </div>

                {/* Contract Status Cards */}
                {(escrowSettings || ghettoSettings) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {escrowSettings && (
                      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-black text-white uppercase">Escrow Contract</h4>
                          <button
                            onClick={() => setShowContractSettings(true)}
                            disabled={!isConnected}
                            className="px-3 py-2 bg-neon-blue hover:bg-neon-blue/80 disabled:bg-gray-600 text-black rounded-lg text-sm font-medium"
                          >
                            Update Settings
                          </button>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Platform Fee:</span>
                            <span className="text-white font-medium">{escrowSettings.platformFeePercent}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Non-GHETTO Fee Addition:</span>
                            <span className="text-white font-medium">+{escrowSettings.nonGhettoFeeAddition}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Seller Hold Percentage:</span>
                            <span className="text-white font-medium">{escrowSettings.sellerHoldPercent}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Owner:</span>
                            <span className="text-neon-blue font-mono text-xs">
                              {escrowSettings.owner.slice(0, 6)}...{escrowSettings.owner.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {ghettoSettings && (
                      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-black text-white uppercase">GHETTO Token</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => ghettoSettings.paused ? unpauseGhettoTransfers() : pauseGhettoTransfers()}
                              disabled={!isConnected || isLoading}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                ghettoSettings.paused
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              {ghettoSettings.paused ? (
                                <>
                                  <Unlock className="w-4 h-4 inline mr-1" />
                                  Unpause
                                </>
                              ) : (
                                <>
                                  <Lock className="w-4 h-4 inline mr-1" />
                                  Pause
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Supply:</span>
                            <span className="text-white font-medium">{ghettoSettings.totalSupply.toLocaleString()} GHETTO</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">External Transfers:</span>
                            <div className="flex items-center space-x-2">
                              <span className={ghettoSettings.externalTransfersAllowed ? 'text-green-400' : 'text-red-400'}>
                                {ghettoSettings.externalTransfersAllowed ? 'Enabled' : 'Disabled'}
                              </span>
                              <button
                                onClick={() => setExternalTransfersAllowed(!ghettoSettings.externalTransfersAllowed)}
                                disabled={!isConnected || isLoading}
                                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
                              >
                                Toggle
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className={ghettoSettings.paused ? 'text-red-400' : 'text-green-400'}>
                              {ghettoSettings.paused ? 'Paused' : 'Active'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Decimals:</span>
                            <span className="text-white font-medium">{ghettoSettings.decimals}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Token Management */}
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-black text-white mb-6 uppercase">Token Management</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mint Tokens */}
                    <div className="space-y-4">
                      <h5 className="text-white font-medium">Mint GHETTO Tokens</h5>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Recipient address"
                          value={tokenManagementForm.mintAddress}
                          onChange={(e) => setTokenManagementForm({ ...tokenManagementForm, mintAddress: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount to mint"
                          value={tokenManagementForm.mintAmount}
                          onChange={(e) => setTokenManagementForm({ ...tokenManagementForm, mintAmount: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        />
                        <button
                          onClick={handleMintTokens}
                          disabled={!isConnected || isLoading || !tokenManagementForm.mintAddress || !tokenManagementForm.mintAmount}
                          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        >
                          <Coins className="w-4 h-4 inline mr-2" />
                          Mint Tokens
                        </button>
                      </div>
                    </div>

                    {/* Burn Tokens */}
                    <div className="space-y-4">
                      <h5 className="text-white font-medium">Burn GHETTO Tokens</h5>
                      <div className="space-y-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount to burn"
                          value={tokenManagementForm.burnAmount}
                          onChange={(e) => setTokenManagementForm({ ...tokenManagementForm, burnAmount: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        />
                        <button
                          onClick={handleBurnTokens}
                          disabled={!isConnected || isLoading || !tokenManagementForm.burnAmount}
                          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        >
                          <Flame className="w-4 h-4 inline mr-2" />
                          Burn Tokens
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Blacklist Management */}
                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <h4 className="text-lg font-black text-white mb-4 uppercase">Address Blacklist</h4>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Address to blacklist"
                          value={tokenManagementForm.blacklistAddress}
                          onChange={(e) => setTokenManagementForm({ ...tokenManagementForm, blacklistAddress: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        />
                        <input
                          type="text"
                          placeholder="Reason for blacklisting"
                          value={tokenManagementForm.blacklistReason}
                          onChange={(e) => setTokenManagementForm({ ...tokenManagementForm, blacklistReason: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        />
                        <button
                          onClick={handleBlacklistAddress}
                          disabled={!isConnected || isLoading || !tokenManagementForm.blacklistAddress}
                          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        >
                          <Ban className="w-4 h-4 inline mr-2" />
                          Blacklist Address
                        </button>
                      </div>

                      {/* Current Blacklisted Addresses */}
                      <div className="space-y-2">
                        <h6 className="text-white font-medium text-sm">Blacklisted Addresses</h6>
                        {blacklistedAddresses.map((addr) => (
                          <div key={addr.address} className="bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-mono text-sm">
                                  {addr.address.slice(0, 6)}...{addr.address.slice(-4)}
                                </p>
                                <p className="text-gray-400 text-xs">{addr.reason}</p>
                              </div>
                              <button
                                onClick={() => setAddressBlacklisted(addr.address, false)}
                                disabled={!isConnected || isLoading}
                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                              >
                                Unblock
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Whitelist Management */}
                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <h4 className="text-lg font-black text-white mb-4 uppercase">Contract Whitelist</h4>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Contract address"
                          value={tokenManagementForm.whitelistAddress}
                          onChange={(e) => setTokenManagementForm({ ...tokenManagementForm, whitelistAddress: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        />
                        <input
                          type="text"
                          placeholder="Contract name"
                          value={tokenManagementForm.whitelistName}
                          onChange={(e) => setTokenManagementForm({ ...tokenManagementForm, whitelistName: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        />
                        <button
                          onClick={handleWhitelistContract}
                          disabled={!isConnected || isLoading || !tokenManagementForm.whitelistAddress}
                          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-2" />
                          Whitelist Contract
                        </button>
                      </div>

                      {/* Current Whitelisted Contracts */}
                      <div className="space-y-2">
                        <h6 className="text-white font-medium text-sm">Whitelisted Contracts</h6>
                        {whitelistedContracts.map((contract) => (
                          <div key={contract.address} className="bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium text-sm">{contract.name}</p>
                                <p className="text-gray-400 font-mono text-xs">
                                  {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                                </p>
                              </div>
                              <button
                                onClick={() => setMarketplaceContractWhitelisted(contract.address, false)}
                                disabled={!isConnected || isLoading}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contract Settings Modal */}
        {showContractSettings && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-xl font-black text-white uppercase">Update Contract Settings</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Platform Fee (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={contractSettingsForm.platformFee}
                    onChange={(e) => setContractSettingsForm({ ...contractSettingsForm, platformFee: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Non-GHETTO Fee Addition (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={contractSettingsForm.nonGhettoFeeAddition}
                    onChange={(e) => setContractSettingsForm({ ...contractSettingsForm, nonGhettoFeeAddition: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Seller Hold Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={contractSettingsForm.sellerHoldPercent}
                    onChange={(e) => setContractSettingsForm({ ...contractSettingsForm, sellerHoldPercent: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdateContractSettings}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-medium"
                  >
                    {isLoading ? 'Updating...' : 'Update Settings'}
                  </button>
                  <button
                    onClick={() => setShowContractSettings(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Referral Settings Modal */}
        {showReferralSettings && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-xl font-black text-white uppercase">Referral Settings</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Signup Reward (GHETTO)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={referralSettingsForm.signupReward}
                    onChange={(e) => setReferralSettingsForm({ ...referralSettingsForm, signupReward: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">First Purchase Reward (GHETTO)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={referralSettingsForm.firstPurchaseReward}
                    onChange={(e) => setReferralSettingsForm({ ...referralSettingsForm, firstPurchaseReward: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Commission Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={referralSettingsForm.commissionPercent}
                    onChange={(e) => setReferralSettingsForm({ ...referralSettingsForm, commissionPercent: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white font-medium mb-2">Min Redeem</label>
                    <input
                      type="number"
                      step="0.01"
                      value={referralSettingsForm.minRedeem}
                      onChange={(e) => setReferralSettingsForm({ ...referralSettingsForm, minRedeem: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Max Redeem</label>
                    <input
                      type="number"
                      step="0.01"
                      value={referralSettingsForm.maxRedeem}
                      onChange={(e) => setReferralSettingsForm({ ...referralSettingsForm, maxRedeem: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdateReferralSettings}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-medium"
                  >
                    {isLoading ? 'Updating...' : 'Update Settings'}
                  </button>
                  <button
                    onClick={() => setShowReferralSettings(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Adjustment Modal */}
        {balanceAdjustmentForm.userId && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-xl font-black text-white uppercase">Adjust Referral Balance</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">User ID</label>
                  <input
                    type="text"
                    value={balanceAdjustmentForm.userId}
                    onChange={(e) => setBalanceAdjustmentForm({ ...balanceAdjustmentForm, userId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                    placeholder="User ID"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Amount (GHETTO)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={balanceAdjustmentForm.amount}
                    onChange={(e) => setBalanceAdjustmentForm({ ...balanceAdjustmentForm, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                    placeholder="Positive to credit, negative to debit"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Reason</label>
                  <input
                    type="text"
                    value={balanceAdjustmentForm.reason}
                    onChange={(e) => setBalanceAdjustmentForm({ ...balanceAdjustmentForm, reason: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                    placeholder="Reason for adjustment"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAdjustBalance}
                    disabled={isLoading || !balanceAdjustmentForm.amount || !balanceAdjustmentForm.reason}
                    className="flex-1 py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-medium"
                  >
                    {isLoading ? 'Adjusting...' : 'Adjust Balance'}
                  </button>
                  <button
                    onClick={() => setBalanceAdjustmentForm({ userId: '', amount: '', reason: '' })}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}