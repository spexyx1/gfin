import React, { useState } from 'react';
import { X, Wallet, Send, CreditCard, ArrowUpDown, TrendingUp, Plus, Minus, Link, Shield, Eye, Repeat } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useWeb3 } from '../hooks/useWeb3';
import { useExchange } from '../hooks/useExchange';
import { useHoudiniSwap } from '../hooks/useHoudiniSwap';
import { SwapInterface } from './SwapInterface';
import { CardProgramTab } from './CardProgramTab';
import { formatDistanceToNow } from 'date-fns';
import { useAppKit } from '@reown/appkit/react';
import { logger } from '../utils/logger';

interface WalletDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'connect' | 'overview' | 'send' | 'buy' | 'swap' | 'trade' | 'atomic-swap' | 'cards';
}

export function WalletDashboard({ isOpen, onClose, initialTab }: WalletDashboardProps) {
  const { balances, transactions, isLoading, sendCrypto, buyCrypto, swapCrypto, getTotalBalance } = useWallet();
  const { account, isConnected, chainId, isCorrectNetwork, networkName } = useWeb3();
  const { placeBuyOrder, placeSellOrder, orders } = useExchange();
  const { getQuote, executeSwap, quote } = useHoudiniSwap();
  const { open } = useAppKit();

  // Determine native token based on chain
  const isPolygon = chainId === 137 || chainId === 80002;
  const nativeSymbol = isPolygon ? 'POL' : 'ETH';
  const defaultPair = isPolygon ? 'POL/USDC' : 'ETH/USDC';

  const [activeTab, setActiveTab] = useState<'connect' | 'overview' | 'send' | 'buy' | 'swap' | 'trade' | 'atomic-swap' | 'cards'>(initialTab || 'connect');
  const [sendForm, setSendForm] = useState({ to: '', amount: '', asset: nativeSymbol });
  const [buyForm, setBuyForm] = useState({ asset: nativeSymbol, amount: '', paymentMethod: 'card' as 'card' | 'bank' });
  const [swapForm, setSwapForm] = useState({ fromAsset: nativeSymbol, toAsset: 'USDC', fromAmount: '' });
  const [tradeForm, setTradeForm] = useState({ pair: defaultPair, amount: '', orderType: 'market' as 'market' | 'limit', price: '' });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendCrypto(sendForm.to, parseFloat(sendForm.amount), sendForm.asset);
      setSendForm({ to: '', amount: '', asset: nativeSymbol });
      alert('Transaction sent successfully!');
    } catch (error) {
      logger.error('Send failed', 'WalletDashboard', error);
      alert('Transaction failed. Please try again.');
    }
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await buyCrypto(buyForm.asset, parseFloat(buyForm.amount), buyForm.paymentMethod);
      setBuyForm({ asset: nativeSymbol, amount: '', paymentMethod: 'card' });
      alert('Purchase completed successfully!');
    } catch (error) {
      logger.error('Buy failed', 'WalletDashboard', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!quote) {
        await getQuote(swapForm.fromAsset, swapForm.toAsset, swapForm.fromAmount);
      } else {
        await executeSwap(quote);
        setSwapForm({ fromAsset: 'ETH', toAsset: 'USDC', fromAmount: '' });
        alert('Swap completed successfully!');
      }
    } catch (error) {
      logger.error('Swap failed', 'WalletDashboard', error);
      alert('Swap failed. Please try again.');
    }
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await placeBuyOrder(
        tradeForm.pair,
        parseFloat(tradeForm.amount),
        tradeForm.orderType,
        tradeForm.orderType === 'limit' ? parseFloat(tradeForm.price) : undefined
      );
      setTradeForm({ pair: 'ETH/USDC', amount: '', orderType: 'market', price: '' });
      alert('Order placed successfully!');
    } catch (error) {
      logger.error('Trade failed', 'WalletDashboard', error);
      alert('Trade failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-6xl h-[90vh] overflow-hidden flex shadow-2xl">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="h-6 w-6 text-neon-blue" />
                <h2 className="text-lg font-black text-white uppercase">Wallet</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {[
                { id: 'connect', label: 'CONNECT', icon: Link },
                { id: 'overview', label: 'OVERVIEW', icon: Eye },
                { id: 'send', label: 'SEND', icon: Send },
                { id: 'buy', label: 'BUY', icon: CreditCard },
                { id: 'swap', label: 'SWAP', icon: ArrowUpDown },
                { id: 'atomic-swap', label: 'ATOMIC SWAP', icon: Repeat },
                { id: 'trade', label: 'TRADE', icon: TrendingUp },
                { id: 'cards', label: 'CARDS', icon: CreditCard },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-black ${
                    activeTab === id
                      ? 'bg-neon-blue text-black'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Total Balance */}
          <div className="p-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-gray-400 text-sm font-medium mb-1">Total Balance</p>
              <p className="text-2xl font-black text-white">
                ${getTotalBalance().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Connect Tab */}
          {activeTab === 'connect' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h3 className="text-2xl font-black text-white mb-8 uppercase">Connect DeFi Wallets</h3>
              
              {/* Wallet Connection */}
              {isConnected && account ? (
                <div className="mb-8">
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Connected Wallet</h4>
                  <div className="bg-gray-800 rounded-2xl p-6 border-2 border-neon-blue/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <Wallet className="text-neon-blue w-8 h-8" />
                        <div>
                          <h5 className="text-white font-medium">Connected Wallet</h5>
                          <p className="text-gray-400 text-sm font-mono">
                            {account.slice(0, 6)}...{account.slice(-4)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => open()}
                        className="px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg font-medium transition-colors"
                      >
                        Manage Wallet
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 mb-8">
                  <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h4 className="text-xl font-black text-white mb-2 uppercase">Connect Your Wallet</h4>
                  <p className="text-gray-400 mb-6">Connect with 300+ wallets including MetaMask, Coinbase, Trust, Ledger and more</p>
                  <button
                    onClick={() => open()}
                    className="px-8 py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg font-black uppercase transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}

              {/* Security Notice */}
              <div className="mt-8 bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-neon-blue" />
                  <h4 className="text-lg font-black text-white uppercase">Security & Privacy</h4>
                </div>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li>• Your private keys never leave your wallet</li>
                  <li>• All connections are encrypted end-to-end</li>
                  <li>• We don't store any personal wallet information</li>
                  <li>• You can disconnect wallets at any time</li>
                  <li>• Multiple wallets can be connected simultaneously</li>
                </ul>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white uppercase">Wallet Overview</h3>
                <div className="bg-neon-blue/10 border border-neon-blue/20 rounded-xl px-4 py-2">
                  <p className="text-neon-blue font-black text-sm uppercase">💡 Use GHETTO for lower fees!</p>
                </div>
              </div>
              
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {balances.map((balance) => (
                  <div key={balance.symbol} className={`bg-gray-800 rounded-2xl p-6 border ${
                    balance.symbol === 'GHETTO' ? 'border-neon-blue/30 bg-neon-blue/5' : 'border-gray-700'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-black text-white">{balance.symbol}</h4>
                        {balance.symbol === 'GHETTO' && (
                          <span className="bg-neon-blue/20 text-neon-blue px-2 py-1 rounded-full text-xs font-medium">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        balance.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {balance.change24h >= 0 ? '+' : ''}{balance.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-2xl font-black text-white mb-2">{balance.balance.toFixed(4)}</p>
                    <p className="text-gray-400 text-sm">${balance.usdValue.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="text-lg font-black text-white mb-4 uppercase">Recent Transactions</h4>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'send' ? 'bg-red-500/20' :
                            tx.type === 'receive' ? 'bg-green-500/20' :
                            tx.type === 'buy' ? 'bg-blue-500/20' :
                            tx.type === 'sell' ? 'bg-orange-500/20' :
                            'bg-purple-500/20'
                          }`}>
                            {tx.type === 'send' && <Send className="w-5 h-5 text-red-400" />}
                            {tx.type === 'receive' && <Plus className="w-5 h-5 text-green-400" />}
                            {tx.type === 'buy' && <CreditCard className="w-5 h-5 text-blue-400" />}
                            {tx.type === 'sell' && <Minus className="w-5 h-5 text-orange-400" />}
                            {tx.type === 'swap' && <ArrowUpDown className="w-5 h-5 text-purple-400" />}
                          </div>
                          <div>
                            <p className="text-white font-medium capitalize">{tx.type}</p>
                            <p className="text-gray-400 text-sm">
                              {tx.fromAsset && tx.toAsset ? `${tx.fromAsset} → ${tx.toAsset}` : 
                               tx.fromAsset || tx.toAsset || 'Transaction'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">
                            {tx.type === 'send' || tx.type === 'sell' ? '-' : '+'}
                            {tx.amount} {tx.fromAsset || tx.toAsset}
                          </p>
                          <p className="text-gray-400 text-sm">
                            ${tx.usdValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Send Tab */}
          {activeTab === 'send' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h3 className="text-2xl font-black text-white mb-4 uppercase">Send Crypto</h3>

              {/* Network Indicator */}
              <div className={`mb-6 p-4 rounded-xl border ${
                isCorrectNetwork
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <p className={`text-sm font-medium ${
                  isCorrectNetwork ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  Connected to {networkName} - Native token: {nativeSymbol}
                </p>
              </div>

              <form onSubmit={handleSend} className="max-w-md mx-auto space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">To Address</label>
                  <input
                    type="text"
                    value={sendForm.to}
                    onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                    placeholder="0x... or ENS name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Asset</label>
                  <select
                    value={sendForm.asset}
                    onChange={(e) => setSendForm({ ...sendForm, asset: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  >
                    {balances.map(balance => (
                      <option key={balance.symbol} value={balance.symbol}>
                        {balance.symbol} - {balance.balance.toFixed(4)} available
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={sendForm.amount}
                    onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                    placeholder="0.00"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-neon-blue hover:bg-neon-blue/80 disabled:bg-gray-700 text-black font-black rounded-xl transition-colors uppercase"
                >
                  {isLoading ? 'Sending...' : 'Send Transaction'}
                </button>
              </form>
            </div>
          )}

          {/* Buy Tab */}
          {activeTab === 'buy' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h3 className="text-2xl font-black text-white mb-4 uppercase">Buy Crypto</h3>

              {/* Network Indicator */}
              <div className={`mb-6 p-4 rounded-xl border ${
                isCorrectNetwork
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <p className={`text-sm font-medium ${
                  isCorrectNetwork ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  Connected to {networkName}
                </p>
              </div>

              <form onSubmit={handleBuy} className="max-w-md mx-auto space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Asset</label>
                  <select
                    value={buyForm.asset}
                    onChange={(e) => setBuyForm({ ...buyForm, asset: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  >
                    {isPolygon ? (
                      <>
                        <option value="POL">Polygon (POL)</option>
                        <option value="USDC">USD Coin (USDC)</option>
                        <option value="WETH">Wrapped Ethereum (WETH)</option>
                        <option value="WBTC">Wrapped Bitcoin (WBTC)</option>
                      </>
                    ) : (
                      <>
                        <option value="ETH">Ethereum (ETH)</option>
                        <option value="BTC">Bitcoin (BTC)</option>
                        <option value="USDC">USD Coin (USDC)</option>
                        <option value="SOL">Solana (SOL)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={buyForm.amount}
                    onChange={(e) => setBuyForm({ ...buyForm, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Payment Method</label>
                  <select
                    value={buyForm.paymentMethod}
                    onChange={(e) => setBuyForm({ ...buyForm, paymentMethod: e.target.value as 'card' | 'bank' })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  >
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-neon-blue hover:bg-neon-blue/80 disabled:bg-gray-700 text-black font-black rounded-xl transition-colors uppercase"
                >
                  {isLoading ? 'Processing...' : 'Buy Crypto'}
                </button>
              </form>
            </div>
          )}

          {/* Swap Tab */}
          {activeTab === 'swap' && (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-white mb-4 uppercase">Token Swap</h3>
                <div className="bg-neon-blue/10 border border-neon-blue/20 rounded-2xl p-4 max-w-md mx-auto">
                  <p className="text-neon-blue font-black text-sm uppercase">
                    💰 Swap to GHETTO for 1.25% lower fees on all purchases!
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleSwap} className="max-w-md mx-auto space-y-6">
                {/* Recommended Swap to GHETTO */}
                {swapForm.toAsset !== 'GHETTO' && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-400 font-black text-sm">💡 RECOMMENDED:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSwapForm({ ...swapForm, toAsset: 'GHETTO' })}
                      className="text-green-400 hover:text-green-300 text-sm font-medium underline"
                    >
                      Swap to GHETTO for lower marketplace fees
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-white font-medium mb-2">From</label>
                  <select
                    value={swapForm.fromAsset}
                    onChange={(e) => setSwapForm({ ...swapForm, fromAsset: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  >
                    {balances.map(balance => (
                      <option key={balance.symbol} value={balance.symbol}>
                        {balance.symbol} - {balance.balance.toFixed(4)} available
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={swapForm.fromAmount}
                    onChange={(e) => setSwapForm({ ...swapForm, fromAmount: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">To</label>
                  <select
                    value={swapForm.toAsset}
                    onChange={(e) => setSwapForm({ ...swapForm, toAsset: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  >
                    {balances.map(balance => (
                      <option key={balance.symbol} value={balance.symbol}>
                        {balance.symbol}
                      </option>
                    ))}
                  </select>
                </div>

                {quote && (
                  <>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                      <h5 className="text-white font-medium mb-2">Swap Quote</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">You'll receive:</span>
                          <span className="text-white">{parseFloat(quote.outputAmount).toFixed(6)} {quote.outputToken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price impact:</span>
                          <span className="text-white">{quote.priceImpact.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fee:</span>
                          <span className="text-white">{quote.fee} ETH</span>
                        </div>
                        {quote.outputToken === 'GHETTO' && (
                          <div className="mt-2 p-2 bg-green-500/10 rounded-lg">
                            <p className="text-green-400 text-xs font-medium">
                              ✨ You'll save 1.25% on all future marketplace purchases!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-neon-blue hover:bg-neon-blue/80 disabled:bg-gray-700 text-black font-black rounded-xl transition-colors uppercase"
                >
                  {isLoading ? 'Processing...' : quote ? 'Execute Swap' : 'Get Quote'}
                </button>
              </form>
            </div>
          )}

          {/* Trade Tab */}
          {/* Atomic Swap Tab */}
          {activeTab === 'atomic-swap' && (
            <div className="flex-1 overflow-y-auto p-8">
              {!isConnected || !account ? (
                <div className="text-center py-16">
                  <Repeat className="w-16 h-16 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-white mb-4 uppercase">Connect Wallet for Atomic Swaps</h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Atomic Swaps require a connected wallet to create peer-to-peer token exchanges across different blockchains.
                  </p>
                  <button
                    onClick={() => setActiveTab('connect')}
                    className="px-8 py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-xl font-black uppercase transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-white mb-4 uppercase">Peer-to-Peer Atomic Swaps</h3>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                      <p className="text-blue-300 text-sm">
                        <strong className="text-blue-400">Trustless peer-to-peer trading:</strong> Create swap proposals with other users, both deposit tokens into escrow, and execute simultaneously. Perfect for negotiated trades and cross-chain swaps without intermediaries.
                      </p>
                    </div>
                  </div>
                  <SwapInterface userAddress={account} />
                </>
              )}
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h3 className="text-2xl font-black text-white mb-8 uppercase">GHETTO Finance Card</h3>
              <CardProgramTab />
            </div>
          )}

          {activeTab === 'trade' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h3 className="text-2xl font-black text-white mb-8 uppercase">Exchange Trading</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trade Form */}
                <div>
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Place Order</h4>
                  <form onSubmit={handleTrade} className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Trading Pair</label>
                      <select
                        value={tradeForm.pair}
                        onChange={(e) => setTradeForm({ ...tradeForm, pair: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                      >
                        <option value="ETH/USDC">ETH/USDC</option>
                        <option value="BTC/USDC">BTC/USDC</option>
                        <option value="SOL/USDC">SOL/USDC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Order Type</label>
                      <select
                        value={tradeForm.orderType}
                        onChange={(e) => setTradeForm({ ...tradeForm, orderType: e.target.value as 'market' | 'limit' })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                      >
                        <option value="market">Market Order</option>
                        <option value="limit">Limit Order</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Amount</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={tradeForm.amount}
                        onChange={(e) => setTradeForm({ ...tradeForm, amount: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    {tradeForm.orderType === 'limit' && (
                      <div>
                        <label className="block text-white font-medium mb-2">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={tradeForm.price}
                          onChange={(e) => setTradeForm({ ...tradeForm, price: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-neon-blue hover:bg-neon-blue/80 disabled:bg-gray-700 text-black font-black rounded-xl transition-colors uppercase"
                    >
                      {isLoading ? 'Placing Order...' : 'Place Buy Order'}
                    </button>
                  </form>
                </div>

                {/* Open Orders */}
                <div>
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Open Orders</h4>
                  <div className="space-y-3">
                    {orders.filter(order => order.status === 'open').map((order) => (
                      <div key={order.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{order.pair}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {order.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Amount:</span>
                            <span className="text-white ml-2">{order.amount}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Price:</span>
                            <span className="text-white ml-2">{order.price || 'Market'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {orders.filter(order => order.status === 'open').length === 0 && (
                      <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No open orders</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}