import React, { useState } from 'react';
import {
  Coins, Users, TrendingUp, AlertCircle, Ban, CheckCircle,
  Pause, Play, Send, Flame, Plus, Shield, Info, ExternalLink,
  RefreshCw, Clock, Activity
} from 'lucide-react';
import { useTokenManager } from '../hooks/useTokenManager';
import { useSiteMaster } from '../hooks/useSiteMaster';

export function BlockchainTokenDashboard() {
  const { issitemaster } = useSiteMaster();
  const {
    tokenInfo,
    holders,
    transfers,
    isLoading,
    mintTokens,
    burnTokens,
    setAddressBlacklisted,
    setContractWhitelisted,
    toggleExternalTransfers,
    pauseToken,
    unpauseToken,
    refreshData
  } = useTokenManager();

  const [activeTab, setActiveTab] = useState<'overview' | 'holders' | 'transfers' | 'controls'>('overview');
  const [mintAmount, setMintAmount] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [whitelistContract, setWhitelistContract] = useState('');
  const [showMintModal, setShowMintModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [showWhitelistModal, setShowWhitelistModal] = useState(false);

  if (!issitemaster) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900">Access Denied</h3>
        <p className="text-gray-600">Only sitemasters can access this dashboard</p>
      </div>
    );
  }

  const handleMint = async () => {
    if (!mintAmount || !mintAddress) return;

    try {
      await mintTokens(mintAddress, parseFloat(mintAmount));
      setMintAmount('');
      setMintAddress('');
      setShowMintModal(false);
      alert('Tokens minted successfully!');
    } catch (error: any) {
      alert(`Failed to mint tokens: ${error.message}`);
    }
  };

  const handleBurn = async () => {
    if (!burnAmount) return;

    try {
      await burnTokens(parseFloat(burnAmount));
      setBurnAmount('');
      setShowBurnModal(false);
      alert('Tokens burned successfully!');
    } catch (error: any) {
      alert(`Failed to burn tokens: ${error.message}`);
    }
  };

  const handleBlacklist = async (address: string, blacklist: boolean) => {
    try {
      await setAddressBlacklisted(address, blacklist, 'Sitemaster action');
      setBlacklistAddress('');
      setShowBlacklistModal(false);
      alert(`Address ${blacklist ? 'blacklisted' : 'unblacklisted'} successfully!`);
    } catch (error: any) {
      alert(`Failed to update blacklist: ${error.message}`);
    }
  };

  const handleWhitelist = async (address: string, whitelist: boolean) => {
    try {
      await setContractWhitelisted(address, whitelist, 'Marketplace Contract');
      setWhitelistContract('');
      setShowWhitelistModal(false);
      alert(`Contract ${whitelist ? 'whitelisted' : 'removed'} successfully!`);
    } catch (error: any) {
      alert(`Failed to update whitelist: ${error.message}`);
    }
  };

  const handleToggleTransfers = async () => {
    if (!tokenInfo) return;

    const newState = !tokenInfo.externalTransfersAllowed;
    const confirmed = window.confirm(
      `Are you sure you want to ${newState ? 'ENABLE' : 'DISABLE'} external transfers?\n\nThis will ${newState ? 'allow' : 'prevent'} token transfers outside whitelisted contracts.`
    );

    if (!confirmed) return;

    try {
      await toggleExternalTransfers(newState);
      alert(`External transfers ${newState ? 'enabled' : 'disabled'}!`);
    } catch (error: any) {
      alert(`Failed to toggle transfers: ${error.message}`);
    }
  };

  const handleTogglePause = async () => {
    if (!tokenInfo) return;

    const newState = !tokenInfo.paused;
    const confirmed = window.confirm(
      `Are you sure you want to ${newState ? 'PAUSE' : 'UNPAUSE'} the token contract?\n\nThis ${newState ? 'will stop all transfers' : 'will resume normal operations'}.`
    );

    if (!confirmed) return;

    try {
      if (newState) {
        await pauseToken();
      } else {
        await unpauseToken();
      }
      alert(`Token ${newState ? 'paused' : 'unpaused'}!`);
    } catch (error: any) {
      alert(`Failed to toggle pause: ${error.message}`);
    }
  };

  const topHolders = holders.slice(0, 10);
  const recentTransfers = transfers.slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Coins className="h-8 w-8 text-orange-500" />
              GHETTO Token Management
            </h1>
            <p className="text-gray-400 mt-1">Manage token supply, holders, and transfers</p>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {tokenInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Supply</span>
                <Coins className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{tokenInfo.totalSupply.toLocaleString()} {tokenInfo.symbol}</p>
              <p className="text-xs text-gray-500 mt-1">{tokenInfo.decimals} decimals</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Token Holders</span>
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{holders.length.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Active wallets</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Transfers</span>
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{transfers.length.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Contract Status</span>
                {tokenInfo.paused ? (
                  <Pause className="h-5 w-5 text-red-500" />
                ) : (
                  <Play className="h-5 w-5 text-green-500" />
                )}
              </div>
              <p className="text-2xl font-bold">{tokenInfo.paused ? 'Paused' : 'Active'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {tokenInfo.externalTransfersAllowed ? 'External transfers enabled' : 'Restricted mode'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={() => setShowMintModal(true)}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg flex flex-col items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm">Mint</span>
            </button>
            <button
              onClick={() => setShowBurnModal(true)}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg flex flex-col items-center gap-2 transition-colors"
            >
              <Flame className="h-5 w-5" />
              <span className="text-sm">Burn</span>
            </button>
            <button
              onClick={() => setShowBlacklistModal(true)}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex flex-col items-center gap-2 transition-colors"
            >
              <Ban className="h-5 w-5" />
              <span className="text-sm">Blacklist</span>
            </button>
            <button
              onClick={() => setShowWhitelistModal(true)}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex flex-col items-center gap-2 transition-colors"
            >
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">Whitelist</span>
            </button>
            <button
              onClick={handleToggleTransfers}
              className={`px-4 py-3 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                tokenInfo?.externalTransfersAllowed
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Send className="h-5 w-5" />
              <span className="text-sm">
                {tokenInfo?.externalTransfersAllowed ? 'Lock' : 'Unlock'}
              </span>
            </button>
            <button
              onClick={handleTogglePause}
              className={`px-4 py-3 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                tokenInfo?.paused
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {tokenInfo?.paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              <span className="text-sm">
                {tokenInfo?.paused ? 'Unpause' : 'Pause'}
              </span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg mb-8">
          <div className="flex border-b border-gray-700">
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
              onClick={() => setActiveTab('holders')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'holders'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Top Holders
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'transfers'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Recent Transfers
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'controls'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Contract Info
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && tokenInfo && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Token Name</p>
                    <p className="text-lg font-bold">{tokenInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Token Symbol</p>
                    <p className="text-lg font-bold">{tokenInfo.symbol}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Contract Address</p>
                    <p className="text-sm font-mono break-all">{tokenInfo.contractAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Owner Address</p>
                    <p className="text-sm font-mono break-all">{tokenInfo.owner}</p>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mt-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Security Status
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">External Transfers</span>
                      <span className={tokenInfo.externalTransfersAllowed ? 'text-green-500' : 'text-red-500'}>
                        {tokenInfo.externalTransfersAllowed ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Contract Paused</span>
                      <span className={tokenInfo.paused ? 'text-red-500' : 'text-green-500'}>
                        {tokenInfo.paused ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Decimals</span>
                      <span className="text-white">{tokenInfo.decimals}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'holders' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Address</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Balance</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">% of Supply</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topHolders.map((holder, index) => (
                      <tr key={holder.address} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-mono">{holder.address.slice(0, 10)}...{holder.address.slice(-8)}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold">{holder.balance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right">{holder.percentageOfSupply.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-center">
                          {holder.isBlacklisted && (
                            <span className="px-2 py-1 bg-red-900 text-red-200 rounded text-xs">Blacklisted</span>
                          )}
                          {holder.isWhitelisted && (
                            <span className="px-2 py-1 bg-green-900 text-green-200 rounded text-xs">Whitelisted</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'transfers' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">From</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">To</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Amount</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Type</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransfers.map((transfer) => (
                      <tr key={`${transfer.txHash}-${transfer.blockNumber}`} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="px-4 py-3 text-sm">{new Date(transfer.timestamp).toLocaleTimeString()}</td>
                        <td className="px-4 py-3 text-sm font-mono">{transfer.from.slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-sm font-mono">{transfer.to.slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-sm text-right font-bold">{transfer.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            transfer.transferType === 'mint' ? 'bg-green-900 text-green-200' :
                            transfer.transferType === 'burn' ? 'bg-red-900 text-red-200' :
                            'bg-blue-900 text-blue-200'
                          }`}>
                            {transfer.transferType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <a
                            href={`https://polygonscan.com/tx/${transfer.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-500 hover:text-orange-400"
                          >
                            <ExternalLink className="h-4 w-4 inline" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'controls' && tokenInfo && (
              <div className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-yellow-500 mb-1">Warning</h4>
                      <p className="text-sm text-gray-300">
                        These controls directly interact with the token smart contract. All actions are permanent and cannot be undone.
                        Use with extreme caution.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-bold mb-2">Contract Owner</h4>
                    <p className="text-sm text-gray-400 font-mono break-all">{tokenInfo.owner}</p>
                    <p className="text-xs text-gray-500 mt-1">Only the owner can execute privileged functions</p>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="font-bold mb-2">View on Polygon Scan</h4>
                    <a
                      href={`https://polygonscan.com/token/${tokenInfo.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:text-orange-400 text-sm flex items-center gap-2"
                    >
                      View Contract <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mint Modal */}
        {showMintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-500" />
                Mint Tokens
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Recipient Address</label>
                  <input
                    type="text"
                    value={mintAddress}
                    onChange={(e) => setMintAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                  <input
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleMint}
                    disabled={isLoading || !mintAmount || !mintAddress}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Minting...' : 'Mint Tokens'}
                  </button>
                  <button
                    onClick={() => setShowMintModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Burn Modal */}
        {showBurnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                Burn Tokens
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Amount to Burn</label>
                  <input
                    type="number"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tokens will be burned from your wallet</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleBurn}
                    disabled={isLoading || !burnAmount}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Burning...' : 'Burn Tokens'}
                  </button>
                  <button
                    onClick={() => setShowBurnModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blacklist Modal */}
        {showBlacklistModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                Manage Blacklist
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Wallet Address</label>
                  <input
                    type="text"
                    value={blacklistAddress}
                    onChange={(e) => setBlacklistAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBlacklist(blacklistAddress, true)}
                    disabled={isLoading || !blacklistAddress}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Blacklist
                  </button>
                  <button
                    onClick={() => handleBlacklist(blacklistAddress, false)}
                    disabled={isLoading || !blacklistAddress}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setShowBlacklistModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Whitelist Modal */}
        {showWhitelistModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Manage Contract Whitelist
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Contract Address</label>
                  <input
                    type="text"
                    value={whitelistContract}
                    onChange={(e) => setWhitelistContract(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleWhitelist(whitelistContract, true)}
                    disabled={isLoading || !whitelistContract}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Whitelist
                  </button>
                  <button
                    onClick={() => handleWhitelist(whitelistContract, false)}
                    disabled={isLoading || !whitelistContract}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setShowWhitelistModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
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
