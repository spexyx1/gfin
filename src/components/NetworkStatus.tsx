import React from 'react';
import { useWeb3 } from '../hooks/useWeb3';
import { AlertCircle, CheckCircle, Wifi } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const { isConnected, chainId, networkName, isCorrectNetwork, switchToPolygon, targetNetwork } = useWeb3();

  if (!isConnected) {
    return null;
  }

  if (isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-sm text-green-400">
          Connected to {networkName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-yellow-400 font-medium">Wrong Network</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Please switch to {targetNetwork.name} (Chain ID: {targetNetwork.chainId})
        </p>
      </div>
      <button
        onClick={switchToPolygon}
        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 rounded-lg transition text-sm font-medium whitespace-nowrap"
      >
        Switch Network
      </button>
    </div>
  );
};
