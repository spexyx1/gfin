import React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';

interface EscrowNetworkWarningProps {
  feature?: string;
}

export function EscrowNetworkWarning({ feature = 'escrow transactions' }: EscrowNetworkWarningProps) {
  const { isConnected, isCorrectNetwork, switchToPolygon, targetNetwork } = useWeb3();

  if (!isConnected) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-300">
              <strong className="text-blue-400">Connect your wallet</strong> to use {feature} with blockchain escrow protection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-300 mb-2">
              <strong className="text-yellow-400">Wrong Network:</strong> {feature.charAt(0).toUpperCase() + feature.slice(1)} requires {targetNetwork.name}.
            </p>
            <button
              onClick={switchToPolygon}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg transition text-sm font-medium"
            >
              Switch to {targetNetwork.name}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
      <div className="flex items-start space-x-3">
        <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-green-300">
            <strong className="text-green-400">Escrow Protected:</strong> Your transaction will be secured by smart contract on {targetNetwork.name}.
          </p>
        </div>
      </div>
    </div>
  );
}
