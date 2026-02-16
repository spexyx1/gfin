import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Shield, Zap } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';

export function NetworkSwitchModal() {
  const { isConnected, chainId, isCorrectNetwork, switchToPolygon, targetNetwork } = useWeb3();
  const [showModal, setShowModal] = useState(false);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);

  useEffect(() => {
    // Show modal when user connects to wrong network
    if (isConnected && !isCorrectNetwork && !hasShownThisSession) {
      setShowModal(true);
      setHasShownThisSession(true);
    }

    // Reset when user disconnects
    if (!isConnected) {
      setHasShownThisSession(false);
      setShowModal(false);
    }
  }, [isConnected, isCorrectNetwork, hasShownThisSession]);

  const handleSwitch = async () => {
    await switchToPolygon();
    setShowModal(false);
  };

  const handleDismiss = () => {
    setShowModal(false);
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border-2 border-yellow-500/50 max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-xl font-black text-white uppercase">Wrong Network</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-300 text-sm">
            You're currently connected to the wrong network. This marketplace requires{' '}
            <span className="text-neon-blue font-bold">{targetNetwork.name}</span> for full functionality.
          </p>

          {/* Features requiring Polygon */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-white uppercase">Features requiring Polygon:</p>
            <div className="space-y-2">
              <div className="flex items-start space-x-3 text-sm">
                <Shield className="w-4 h-4 text-neon-blue mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Escrow Protection</p>
                  <p className="text-gray-400 text-xs">Secure buyer-seller transactions with blockchain escrow</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <Zap className="w-4 h-4 text-neon-yellow mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">GHETTO Token Transactions</p>
                  <p className="text-gray-400 text-xs">Buy, sell, and trade using GHETTO tokens</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <Zap className="w-4 h-4 text-neon-orange mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Marketplace Features</p>
                  <p className="text-gray-400 text-xs">Create listings, place bids, and complete purchases</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-xs text-blue-300">
              <strong className="text-blue-400">Note:</strong> You can browse the marketplace on any network,
              but transactions require Polygon. Token swaps may work across chains for supported tokens.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleSwitch}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-blue/80 hover:from-neon-blue/90 hover:to-neon-blue/70 text-black font-black rounded-xl transition-all uppercase"
            >
              Switch to Polygon
            </button>
            <button
              onClick={handleDismiss}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors font-medium"
            >
              Browse Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
