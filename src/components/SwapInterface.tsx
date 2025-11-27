import React, { useState, useEffect } from 'react';
import { ArrowDownUp, Info, Loader, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAtomicSwap } from '../hooks/useAtomicSwap';

interface SwapInterfaceProps {
  userAddress: string;
}

export function SwapInterface({ userAddress }: SwapInterfaceProps) {
  const {
    supportedTokens,
    userSwaps,
    loading,
    createSwap,
    depositTokens,
    cancelSwap,
    loadSupportedTokens,
    loadUserSwaps
  } = useAtomicSwap();

  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showCreateSwap, setShowCreateSwap] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<any>(null);

  useEffect(() => {
    loadSupportedTokens();
    if (userAddress) {
      loadUserSwaps(userAddress);
    }
  }, [userAddress]);

  const handleCreateSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !toAmount || !recipientAddress) {
      alert('Please fill all fields');
      return;
    }

    const success = await createSwap({
      recipientAddress,
      initiatorTokenId: fromToken.id,
      recipientTokenId: toToken.id,
      initiatorAmount: fromAmount,
      recipientAmount: toAmount,
      duration: 24 * 60 * 60
    });

    if (success) {
      setShowCreateSwap(false);
      setFromToken(null);
      setToToken(null);
      setFromAmount('');
      setToAmount('');
      setRecipientAddress('');
      loadUserSwaps(userAddress);
    }
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'cancelled': return 'text-red-400';
      case 'expired': return 'text-gray-400';
      default: return 'text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending': return <Loader className="w-5 h-5 text-yellow-400 animate-spin" />;
      case 'cancelled': return <X className="w-5 h-5 text-red-400" />;
      case 'expired': return <AlertTriangle className="w-5 h-5 text-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Swap Section */}
      <div className="glass-morphism rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-neon-yellow uppercase">Token Swap</h3>
          <button
            onClick={() => setShowCreateSwap(!showCreateSwap)}
            className="px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-bold"
          >
            {showCreateSwap ? 'Cancel' : 'New Swap'}
          </button>
        </div>

        {showCreateSwap && (
          <div className="space-y-4">
            {/* From Token */}
            <div className="bg-black/40 rounded-xl p-4 border border-white/10">
              <label className="text-xs text-gray-400 mb-2 block uppercase font-bold">You Send</label>
              <div className="flex items-center space-x-4">
                <select
                  value={fromToken?.id || ''}
                  onChange={(e) => {
                    const token = supportedTokens.find(t => t.id === e.target.value);
                    setFromToken(token);
                  }}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Select Token</option>
                  {supportedTokens.map(token => (
                    <option key={token.id} value={token.id}>
                      {token.token_symbol} on {token.chain_name}
                      {token.is_gasless_enabled && ' (Gasless)'}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-right"
                />
              </div>
              {fromToken?.is_gasless_enabled && (
                <div className="mt-2 flex items-center space-x-2 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>Gas covered by platform</span>
                </div>
              )}
            </div>

            {/* Flip Button */}
            <div className="flex justify-center">
              <button
                onClick={handleFlipTokens}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors border border-white/10"
              >
                <ArrowDownUp className="w-5 h-5 text-neon-yellow" />
              </button>
            </div>

            {/* To Token */}
            <div className="bg-black/40 rounded-xl p-4 border border-white/10">
              <label className="text-xs text-gray-400 mb-2 block uppercase font-bold">You Receive</label>
              <div className="flex items-center space-x-4">
                <select
                  value={toToken?.id || ''}
                  onChange={(e) => {
                    const token = supportedTokens.find(t => t.id === e.target.value);
                    setToToken(token);
                  }}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Select Token</option>
                  {supportedTokens.map(token => (
                    <option key={token.id} value={token.id}>
                      {token.token_symbol} on {token.chain_name}
                      {token.is_gasless_enabled && ' (Gasless)'}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-right"
                />
              </div>
              {toToken?.is_gasless_enabled && (
                <div className="mt-2 flex items-center space-x-2 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>Gas covered by platform</span>
                </div>
              )}
            </div>

            {/* Recipient Address */}
            <div className="bg-black/40 rounded-xl p-4 border border-white/10">
              <label className="text-xs text-gray-400 mb-2 block uppercase font-bold">Recipient Wallet</label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-300 space-y-1">
                  <p>Atomic swaps are peer-to-peer token exchanges that execute simultaneously or not at all.</p>
                  <p>Both parties must deposit tokens within 24 hours for the swap to complete.</p>
                  <p>If either party fails to deposit, all funds are returned automatically.</p>
                </div>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateSwap}
              disabled={loading || !fromToken || !toToken || !fromAmount || !toAmount || !recipientAddress}
              className="w-full px-6 py-4 bg-gradient-to-r from-neon-yellow via-neon-orange to-neon-yellow bg-[length:200%_100%] hover:bg-[position:100%_0] text-black font-black rounded-xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
            >
              {loading ? 'Creating Swap...' : 'Create Swap'}
            </button>
          </div>
        )}
      </div>

      {/* User Swaps */}
      <div className="glass-morphism rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-black text-white uppercase mb-4">Your Swaps</h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-neon-yellow animate-spin" />
          </div>
        ) : userSwaps.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ArrowDownUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No swaps yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userSwaps.map((swap) => (
              <div
                key={swap.id}
                className="bg-black/40 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(swap.status)}
                    <span className={`text-sm font-bold uppercase ${getStatusColor(swap.status)}`}>
                      {swap.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(swap.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">You Send</p>
                    <p className="text-white font-bold">
                      {swap.initiator_amount} {swap.initiator_token?.token_symbol}
                    </p>
                    <p className="text-gray-500 text-xs">{swap.initiator_token?.chain_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">You Receive</p>
                    <p className="text-white font-bold">
                      {swap.recipient_amount} {swap.recipient_token?.token_symbol}
                    </p>
                    <p className="text-gray-500 text-xs">{swap.recipient_token?.chain_name}</p>
                  </div>
                </div>

                {swap.gas_covered_by_platform && (
                  <div className="mt-2 text-xs text-green-400 flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Gasless transaction</span>
                  </div>
                )}

                {swap.status === 'pending' && (
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => depositTokens(swap.id, swap.initiator_id === userAddress)}
                      className="flex-1 px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-bold text-sm"
                    >
                      Deposit Tokens
                    </button>
                    <button
                      onClick={() => cancelSwap(swap.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-bold text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
