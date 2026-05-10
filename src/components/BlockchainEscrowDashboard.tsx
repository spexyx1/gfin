import React, { useState } from 'react';
import {
  Shield, DollarSign, TrendingUp, AlertTriangle, CheckCircle,
  XCircle, Clock, Users, Package, RefreshCw, ExternalLink,
  Settings, Gavel, Lock, Unlock
} from 'lucide-react';
import { useEscrowManager } from '../hooks/useEscrowManager';
import { useSitemasterRole } from '../hooks/useSitemasterRole';

export function BlockchainEscrowDashboard() {
  const { issitemaster } = useSitemasterRole();
  const {
    escrowSettings,
    deals,
    stats,
    isLoading,
    updatePlatformFee,
    updateNonGhettoFeeAddition,
    updateSellerHoldPercent,
    resolveDispute,
    forceReleaseFunds,
    forceCancelOrder,
    refreshData
  } = useEscrowManager();

  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'settings'>('overview');
  const [newPlatformFee, setNewPlatformFee] = useState('');
  const [newNonGhettoFee, setNewNonGhettoFee] = useState('');
  const [newSellerHold, setNewSellerHold] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);

  if (!issitemaster) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900">Access Denied</h3>
        <p className="text-gray-600">Only sitemasters can access this dashboard</p>
      </div>
    );
  }

  const handleUpdatePlatformFee = async () => {
    if (!newPlatformFee) return;

    try {
      await updatePlatformFee(parseFloat(newPlatformFee));
      setNewPlatformFee('');
      alert('Platform fee updated successfully!');
    } catch (error: any) {
      alert(`Failed to update platform fee: ${error.message}`);
    }
  };

  const handleUpdateNonGhettoFee = async () => {
    if (!newNonGhettoFee) return;

    try {
      await updateNonGhettoFeeAddition(parseFloat(newNonGhettoFee));
      setNewNonGhettoFee('');
      alert('Non-GHETTO fee updated successfully!');
    } catch (error: any) {
      alert(`Failed to update fee: ${error.message}`);
    }
  };

  const handleUpdateSellerHold = async () => {
    if (!newSellerHold) return;

    try {
      await updateSellerHoldPercent(parseFloat(newSellerHold));
      setNewSellerHold('');
      alert('Seller hold percent updated successfully!');
    } catch (error: any) {
      alert(`Failed to update seller hold: ${error.message}`);
    }
  };

  const handleResolveDispute = async (orderId: string, favorBuyer: boolean) => {
    const confirmed = window.confirm(
      `Are you sure you want to resolve this dispute in favor of the ${favorBuyer ? 'BUYER' : 'SELLER'}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await resolveDispute(orderId, favorBuyer);
      alert('Dispute resolved successfully!');
    } catch (error: any) {
      alert(`Failed to resolve dispute: ${error.message}`);
    }
  };

  const handleForceRelease = async (orderId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to force release funds for this order?\n\nThis will immediately transfer funds to the seller.'
    );

    if (!confirmed) return;

    try {
      await forceReleaseFunds(orderId);
      alert('Funds released successfully!');
    } catch (error: any) {
      alert(`Failed to release funds: ${error.message}`);
    }
  };

  const handleForceCancel = async (orderId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to force cancel this order?\n\nThis will refund the buyer and release seller collateral.'
    );

    if (!confirmed) return;

    try {
      await forceCancelOrder(orderId);
      alert('Order cancelled successfully!');
    } catch (error: any) {
      alert(`Failed to cancel order: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created': return 'bg-blue-900 text-blue-200';
      case 'funded': return 'bg-green-900 text-green-200';
      case 'shipped': return 'bg-purple-900 text-purple-200';
      case 'delivered': return 'bg-teal-900 text-teal-200';
      case 'completed': return 'bg-green-900 text-green-200';
      case 'disputed': return 'bg-red-900 text-red-200';
      case 'cancelled': return 'luxe-glass text-gray-300';
      default: return 'luxe-glass text-gray-300';
    }
  };

  return (
    <div className="min-h-screen luxe-glass-strong text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-500" />
              Escrow Contract Management
            </h1>
            <p className="text-gray-400 mt-1">Manage escrow deals, fees, and disputes</p>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-4 py-2 luxe-glass hover:luxe-glass rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="luxe-glass rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Deals</span>
                <Package className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stats.totalDeals.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>

            <div className="luxe-glass rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Active Deals</span>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{stats.activeDeals.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">In progress</p>
            </div>

            <div className="luxe-glass rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Volume</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">${stats.totalVolume.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">USD equivalent</p>
            </div>

            <div className="luxe-glass rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Fees Collected</span>
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">${stats.totalFeesCollected.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Platform revenue</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="luxe-glass rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex flex-col items-center gap-2 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm">Update Fees</span>
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg flex flex-col items-center gap-2 transition-colors"
            >
              <Package className="h-5 w-5" />
              <span className="text-sm">View Deals</span>
            </button>
            <button
              onClick={refreshData}
              className="px-4 py-3 luxe-glass hover:bg-gray-600 rounded-lg flex flex-col items-center gap-2 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="text-sm">Sync State</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="luxe-glass rounded-lg mb-8">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'overview'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'deals'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Deals
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'settings'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Contract Settings
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && escrowSettings && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="luxe-glass rounded-lg p-4">
                    <h3 className="font-bold mb-3">Fee Structure</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform Fee (GHETTO)</span>
                        <span className="font-bold">{escrowSettings.platformFeePercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Non-GHETTO Addition</span>
                        <span className="font-bold">+{escrowSettings.nonGhettoFeeAddition}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Seller Hold Percent</span>
                        <span className="font-bold">{escrowSettings.sellerHoldPercent}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="luxe-glass rounded-lg p-4">
                    <h3 className="font-bold mb-3">Contract Info</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400 block">Required Collateral</span>
                        <span className="font-bold">{escrowSettings.requiredGhettoCollateral} GHETTO</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Contract Owner</span>
                        <span className="font-mono text-xs break-all">{escrowSettings.owner}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="luxe-glass rounded-lg p-4">
                  <h3 className="font-bold mb-3">Deal Statistics</h3>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-500">{stats?.totalDeals || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-500">{stats?.activeDeals || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Active</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">{stats?.completedDeals || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-500">{stats?.disputedDeals || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Disputed</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-yellow-500 mb-1">Escrow Management</h4>
                      <p className="text-sm text-gray-300">
                        You have full control over escrow deals. Use force release and dispute resolution carefully.
                        All actions are permanent and recorded on the blockchain.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Order ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Buyer</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Seller</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Amount</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Token</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Status</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => (
                      <tr key={deal.orderId} className="border-b border-white/10 hover:bg-gray-750">
                        <td className="px-4 py-3 text-sm font-mono">{deal.orderId.slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-sm font-mono">{deal.buyerAddress.slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-sm font-mono">{deal.sellerAddress.slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-sm text-right font-bold">${deal.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-sm">{deal.paymentTokenSymbol}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(deal.status)}`}>
                            {deal.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {deal.status.toLowerCase() === 'disputed' && (
                              <>
                                <button
                                  onClick={() => handleResolveDispute(deal.orderId, true)}
                                  disabled={isLoading}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs disabled:opacity-50"
                                  title="Favor Buyer"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleResolveDispute(deal.orderId, false)}
                                  disabled={isLoading}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs disabled:opacity-50"
                                  title="Favor Seller"
                                >
                                  <Gavel className="h-3 w-3" />
                                </button>
                              </>
                            )}
                            {['funded', 'shipped', 'delivered'].includes(deal.status.toLowerCase()) && (
                              <button
                                onClick={() => handleForceRelease(deal.orderId)}
                                disabled={isLoading}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs disabled:opacity-50"
                                title="Force Release Funds"
                              >
                                <Unlock className="h-3 w-3" />
                              </button>
                            )}
                            {deal.status.toLowerCase() === 'created' && (
                              <button
                                onClick={() => handleForceCancel(deal.orderId)}
                                disabled={isLoading}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs disabled:opacity-50"
                                title="Force Cancel Order"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {deals.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No deals found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && escrowSettings && (
              <div className="space-y-6">
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-yellow-500 mb-1">Warning</h4>
                      <p className="text-sm text-gray-300">
                        Changing contract settings will affect all future deals. Existing deals will not be affected.
                        Changes require blockchain transaction confirmation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="luxe-glass rounded-lg p-4">
                  <h4 className="font-bold mb-2">Contract Address</h4>
                  <p className="text-sm text-gray-400 font-mono break-all mb-3">{escrowSettings.contractAddress}</p>
                  <a
                    href={`https://polygonscan.com/address/${escrowSettings.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-400 text-sm flex items-center gap-2"
                  >
                    View on Polygon Scan <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="grid gap-4">
                  <div className="luxe-glass rounded-lg p-4">
                    <h4 className="font-bold mb-2">Current Platform Fee (GHETTO)</h4>
                    <p className="text-2xl font-bold text-orange-500 mb-2">{escrowSettings.platformFeePercent}%</p>
                    <p className="text-sm text-gray-400">Fee charged on deals paid with GHETTO token</p>
                  </div>

                  <div className="luxe-glass rounded-lg p-4">
                    <h4 className="font-bold mb-2">Non-GHETTO Fee Addition</h4>
                    <p className="text-2xl font-bold text-orange-500 mb-2">+{escrowSettings.nonGhettoFeeAddition}%</p>
                    <p className="text-sm text-gray-400">Additional fee for non-GHETTO payments (USDC, etc.)</p>
                  </div>

                  <div className="luxe-glass rounded-lg p-4">
                    <h4 className="font-bold mb-2">Seller Hold Percent</h4>
                    <p className="text-2xl font-bold text-orange-500 mb-2">{escrowSettings.sellerHoldPercent}%</p>
                    <p className="text-sm text-gray-400">Percentage of GHETTO collateral held during deal</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="luxe-glass rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Update Contract Settings
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Platform Fee (%) - Current: {escrowSettings?.platformFeePercent}%
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPlatformFee}
                    onChange={(e) => setNewPlatformFee(e.target.value)}
                    placeholder="2.5"
                    className="w-full px-3 py-2 luxe-glass border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 mb-2"
                  />
                  <button
                    onClick={handleUpdatePlatformFee}
                    disabled={isLoading || !newPlatformFee}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Updating...' : 'Update Platform Fee'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Non-GHETTO Fee Addition (%) - Current: {escrowSettings?.nonGhettoFeeAddition}%
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newNonGhettoFee}
                    onChange={(e) => setNewNonGhettoFee(e.target.value)}
                    placeholder="1.25"
                    className="w-full px-3 py-2 luxe-glass border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 mb-2"
                  />
                  <button
                    onClick={handleUpdateNonGhettoFee}
                    disabled={isLoading || !newNonGhettoFee}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Updating...' : 'Update Non-GHETTO Fee'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Seller Hold (%) - Current: {escrowSettings?.sellerHoldPercent}%
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSellerHold}
                    onChange={(e) => setNewSellerHold(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 luxe-glass border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 mb-2"
                  />
                  <button
                    onClick={handleUpdateSellerHold}
                    disabled={isLoading || !newSellerHold}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Updating...' : 'Update Seller Hold'}
                  </button>
                </div>

                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full px-4 py-2 luxe-glass hover:bg-gray-600 rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
