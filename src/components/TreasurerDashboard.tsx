import { useState, useEffect } from 'react';
import { useTreasurer } from '../hooks/useTreasurer';
import { Shield, Ban, AlertTriangle, DollarSign, Activity, Search, Plus, X, CreditCard, TrendingUp, Users, Fuel, Calendar } from 'lucide-react';
import { requireSupabase } from '../lib/supabase';

export function TreasurerDashboard() {
  const {
    operations,
    blacklistedWallets,
    blacklistedTokens,
    loading,
    error,
    isTreasurer,
    logOperation,
    blacklistWallet,
    unblacklistWallet,
    blacklistToken,
    unblacklistToken,
    refresh
  } = useTreasurer();

  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'operations' | 'wallets' | 'tokens' | 'actions' | 'card_program'>('operations');

  const [cardStats, setCardStats] = useState({
    totalVolumeMtd: 0,
    totalVolumeYtd: 0,
    grossInterchangeMtd: 0,
    platformFeesMtd: 0,
    chargebackLossesMtd: 0,
    activeCardholders: 0,
    activeMerchants: 0,
    gasStationMerchants: 0,
    avgTransactionSize: 0,
    topMerchants: [] as { merchant_name: string; total: number }[],
  });
  const [cardDateRange, setCardDateRange] = useState<'mtd' | 'last30' | 'last90' | 'ytd'>('mtd');
  const [cardStatsLoading, setCardStatsLoading] = useState(false);
  const [showBlacklistWalletModal, setShowBlacklistWalletModal] = useState(false);
  const [showBlacklistTokenModal, setShowBlacklistTokenModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);

  const [walletAddress, setWalletAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    isTreasurer().then(setHasAccess);
  }, []);

  const getDateRangeStart = (range: string) => {
    const now = new Date();
    if (range === 'mtd') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    if (range === 'last30') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    if (range === 'last90') return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    if (range === 'ytd') return new Date(now.getFullYear(), 0, 1).toISOString();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  };

  const fetchCardStats = async () => {
    setCardStatsLoading(true);
    const db = requireSupabase();
    const rangeStart = getDateRangeStart(cardDateRange);
    const ytdStart = getDateRangeStart('ytd');

    const { data: txData } = await db
      .from('card_transactions')
      .select('authorization_amount, settled_amount, interchange_fee_collected, platform_fee_collected, merchant_name, transaction_status, settled_at')
      .eq('transaction_status', 'settled')
      .gte('settled_at', rangeStart);

    const { data: txYtd } = await db
      .from('card_transactions')
      .select('settled_amount')
      .eq('transaction_status', 'settled')
      .gte('settled_at', ytdStart);

    const { data: disputeData } = await db
      .from('card_disputes')
      .select('resolution_amount')
      .eq('status', 'resolved_approved')
      .gte('resolved_at', rangeStart);

    const { count: cardholderCount } = await db
      .from('issued_cards')
      .select('*', { count: 'exact', head: true })
      .eq('card_status', 'active');

    const { count: merchantCount } = await db
      .from('merchant_card_enrollment')
      .select('*', { count: 'exact', head: true })
      .eq('acceptance_status', 'active');

    const { count: gasCount } = await db
      .from('merchant_card_enrollment')
      .select('*', { count: 'exact', head: true })
      .eq('acceptance_status', 'active')
      .eq('is_gas_station', true);

    const txList = txData ?? [];
    const totalVol = txList.reduce((s, t) => s + Number(t.settled_amount ?? t.authorization_amount), 0);
    const totalYtd = (txYtd ?? []).reduce((s, t) => s + Number(t.settled_amount ?? 0), 0);
    const grossInt = txList.reduce((s, t) => s + Number(t.interchange_fee_collected ?? 0), 0);
    const platFees = txList.reduce((s, t) => s + Number(t.platform_fee_collected ?? 0), 0);
    const cbLosses = (disputeData ?? []).reduce((s, d) => s + Number(d.resolution_amount ?? 0), 0);
    const avgTx = txList.length > 0 ? totalVol / txList.length : 0;

    const merchantTotals: Record<string, number> = {};
    txList.forEach(t => {
      const name = t.merchant_name || 'Unknown';
      merchantTotals[name] = (merchantTotals[name] ?? 0) + Number(t.settled_amount ?? t.authorization_amount);
    });
    const topMerchants = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([merchant_name, total]) => ({ merchant_name, total }));

    setCardStats({
      totalVolumeMtd: totalVol,
      totalVolumeYtd: totalYtd,
      grossInterchangeMtd: grossInt,
      platformFeesMtd: platFees,
      chargebackLossesMtd: cbLosses,
      activeCardholders: cardholderCount ?? 0,
      activeMerchants: merchantCount ?? 0,
      gasStationMerchants: gasCount ?? 0,
      avgTransactionSize: avgTx,
      topMerchants,
    });
    setCardStatsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'card_program') fetchCardStats();
  }, [activeTab, cardDateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Treasurer Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have Treasurer permissions.</p>
        </div>
      </div>
    );
  }

  const handleMintTokens = async () => {
    try {
      await logOperation('mint', {
        wallet_address: walletAddress,
        amount: parseFloat(amount),
        reason
      });
      setShowMintModal(false);
      setWalletAddress('');
      setAmount('');
      setReason('');
      refresh();
      alert('Tokens minted successfully');
    } catch (err: any) {
      alert('Error minting tokens: ' + err.message);
    }
  };

  const handleBurnTokens = async () => {
    try {
      await logOperation('burn', {
        token_id: tokenId,
        amount: parseFloat(amount),
        reason
      });
      setShowBurnModal(false);
      setTokenId('');
      setAmount('');
      setReason('');
      refresh();
      alert('Tokens burned successfully');
    } catch (err: any) {
      alert('Error burning tokens: ' + err.message);
    }
  };

  const handleBlacklistWallet = async () => {
    try {
      await blacklistWallet(walletAddress, reason);
      setShowBlacklistWalletModal(false);
      setWalletAddress('');
      setReason('');
      alert('Wallet blacklisted successfully');
    } catch (err: any) {
      alert('Error blacklisting wallet: ' + err.message);
    }
  };

  const handleBlacklistToken = async () => {
    try {
      await blacklistToken(tokenId, reason);
      setShowBlacklistTokenModal(false);
      setTokenId('');
      setReason('');
      alert('Token blacklisted successfully');
    } catch (err: any) {
      alert('Error blacklisting token: ' + err.message);
    }
  };

  const filteredOperations = operations.filter(op =>
    op.operation_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (op.wallet_address && op.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            Treasurer Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Manage GHETTO tokens and financial controls</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('operations')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'operations'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Operations
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'wallets'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Blacklisted Wallets ({blacklistedWallets.length})
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'tokens'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Blacklisted Tokens ({blacklistedTokens.length})
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'actions'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Actions
          </button>
          <button
            onClick={() => setActiveTab('card_program')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === 'card_program'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCard className="h-4 w-4" /> Card Program
          </button>
        </div>

        {activeTab === 'operations' && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search operations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wallet/Token
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TX Hash
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOperations.map((op) => (
                      <tr key={op.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            op.operation_type === 'mint' ? 'bg-green-100 text-green-800' :
                            op.operation_type === 'burn' ? 'bg-red-100 text-red-800' :
                            op.operation_type === 'blacklist' ? 'luxe-glass text-white' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {op.operation_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-mono text-xs">
                            {op.wallet_address ? op.wallet_address.substring(0, 16) + '...' :
                             op.token_id ? `Token: ${op.token_id}` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {op.amount ? op.amount.toLocaleString() + ' GHETTO' : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {op.reason || 'No reason provided'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(op.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {op.transaction_hash ? (
                            <a
                              href={`https://polygonscan.com/tx/${op.transaction_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                            >
                              {op.transaction_hash.substring(0, 10)}...
                            </a>
                          ) : (
                            'Pending'
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredOperations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No operations found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallets' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Blacklisted Wallets</h2>
              <button
                onClick={() => setShowBlacklistWalletModal(true)}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                <Ban className="h-4 w-4" />
                Blacklist Wallet
              </button>
            </div>

            <div className="grid gap-4">
              {blacklistedWallets.map((wallet) => (
                <div key={wallet.id} className="bg-white shadow-md rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Ban className="h-5 w-5 text-red-600" />
                        <h3 className="font-mono text-sm font-semibold text-gray-900">
                          {wallet.wallet_address}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{wallet.reason}</p>
                      <p className="text-xs text-gray-500">
                        Blacklisted on {new Date(wallet.blacklisted_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => unblacklistWallet(wallet.id)}
                      className="text-green-600 hover:text-green-800 font-medium text-sm"
                    >
                      Unblacklist
                    </button>
                  </div>
                </div>
              ))}
              {blacklistedWallets.length === 0 && (
                <div className="bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
                  No blacklisted wallets
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tokens' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Blacklisted Tokens</h2>
              <button
                onClick={() => setShowBlacklistTokenModal(true)}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                <Ban className="h-4 w-4" />
                Blacklist Token
              </button>
            </div>

            <div className="grid gap-4">
              {blacklistedTokens.map((token) => (
                <div key={token.id} className="bg-white shadow-md rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <h3 className="font-mono text-sm font-semibold text-gray-900">
                          Token ID: {token.token_id}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{token.reason}</p>
                      {token.order_id && (
                        <p className="text-xs text-gray-500 mb-1">Order ID: {token.order_id}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Blacklisted on {new Date(token.blacklisted_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => unblacklistToken(token.id)}
                      className="text-green-600 hover:text-green-800 font-medium text-sm"
                    >
                      Unblacklist
                    </button>
                  </div>
                </div>
              ))}
              {blacklistedTokens.length === 0 && (
                <div className="bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
                  No blacklisted tokens
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Mint GHETTO Tokens
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Issue new GHETTO tokens to a wallet address
              </p>
              <button
                onClick={() => setShowMintModal(true)}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Mint Tokens
              </button>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-600" />
                Burn GHETTO Tokens
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Permanently remove tokens from circulation
              </p>
              <button
                onClick={() => setShowBurnModal(true)}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Burn Tokens
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'card_program' && (
        <div>
          {/* Date range selector */}
          <div className="mb-6 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Period:</span>
            {[
              { key: 'mtd', label: 'Month to Date' },
              { key: 'last30', label: 'Last 30 Days' },
              { key: 'last90', label: 'Last 90 Days' },
              { key: 'ytd', label: 'Year to Date' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCardDateRange(key as 'mtd' | 'last30' | 'last90' | 'ytd')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  cardDateRange === key
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {cardStatsLoading ? (
            <div className="text-center py-12 text-gray-400">Loading card program data...</div>
          ) : (
            <>
              {/* Summary stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Card Volume', value: `$${cardStats.totalVolumeMtd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `YTD: $${cardStats.totalVolumeYtd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-green-600' },
                  { label: 'Platform Fees', value: `$${cardStats.platformFeesMtd.toFixed(2)}`, sub: `Interchange: $${cardStats.grossInterchangeMtd.toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
                  { label: 'Net Revenue', value: `$${(cardStats.platformFeesMtd - cardStats.chargebackLossesMtd).toFixed(2)}`, sub: `Chargebacks: -$${cardStats.chargebackLossesMtd.toFixed(2)}`, icon: Activity, color: cardStats.chargebackLossesMtd > 0 ? 'text-orange-600' : 'text-green-600' },
                  { label: 'Avg Transaction', value: `$${cardStats.avgTransactionSize.toFixed(2)}`, sub: '', icon: CreditCard, color: 'text-gray-700' },
                ].map(({ label, value, sub, icon: Icon, color }) => (
                  <div key={label} className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-xs font-medium text-gray-500">{label}</span>
                    </div>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                  </div>
                ))}
              </div>

              {/* Network stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 flex items-center gap-4">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{cardStats.activeCardholders}</p>
                    <p className="text-xs text-gray-500">Active Cardholders</p>
                  </div>
                </div>
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 flex items-center gap-4">
                  <CreditCard className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{cardStats.activeMerchants}</p>
                    <p className="text-xs text-gray-500">Active Enrolled Merchants</p>
                  </div>
                </div>
                <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 flex items-center gap-4">
                  <Fuel className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{cardStats.gasStationMerchants}</p>
                    <p className="text-xs text-gray-500">Gas Station Locations</p>
                  </div>
                </div>
              </div>

              {/* Top merchants */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">Top 10 Merchants by Volume</h3>
                </div>
                {cardStats.topMerchants.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No settled transactions in this period</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500">#</th>
                        <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500">Merchant</th>
                        <th className="text-right px-5 py-2 text-xs font-semibold text-gray-500">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cardStats.topMerchants.map((m, i) => (
                        <tr key={m.merchant_name} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                          <td className="px-5 py-2.5 text-gray-800 font-medium">{m.merchant_name}</td>
                          <td className="px-5 py-2.5 text-right text-gray-700">${m.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {showMintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Mint GHETTO Tokens</h3>
              <button onClick={() => setShowMintModal(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (GHETTO)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Enter reason for minting..."
                />
              </div>
              <button
                onClick={handleMintTokens}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Mint Tokens
              </button>
            </div>
          </div>
        </div>
      )}

      {showBurnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Burn GHETTO Tokens</h3>
              <button onClick={() => setShowBurnModal(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token ID
                </label>
                <input
                  type="text"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter token ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (GHETTO)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Enter reason for burning..."
                />
              </div>
              <button
                onClick={handleBurnTokens}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Burn Tokens
              </button>
            </div>
          </div>
        </div>
      )}

      {showBlacklistWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Blacklist Wallet</h3>
              <button onClick={() => setShowBlacklistWalletModal(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Enter reason for blacklisting..."
                />
              </div>
              <button
                onClick={handleBlacklistWallet}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Blacklist Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {showBlacklistTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Blacklist Token</h3>
              <button onClick={() => setShowBlacklistTokenModal(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token ID
                </label>
                <input
                  type="text"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter token ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Enter reason for blacklisting..."
                />
              </div>
              <button
                onClick={handleBlacklistToken}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Blacklist Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
