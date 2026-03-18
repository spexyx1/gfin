import { WifiOff, RefreshCw, Clock } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface OfflineBannerProps {
  cacheAge?: string | null;
  onRefresh?: () => void;
}

export function OfflineBanner({ cacheAge, onRefresh }: OfflineBannerProps) {
  const { isOffline, offlineDuration } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <div className="offline-indicator rounded-xl p-4 mb-6 border border-red-500/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <WifiOff className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">You're Offline</h4>
            <p className="text-gray-300 text-xs">
              {cacheAge ? `Viewing cached data from ${cacheAge}` : 'Some features may be limited'}
            </p>
            {offlineDuration && (
              <p className="text-gray-400 text-xs mt-1">
                <Clock className="w-3 h-3 inline mr-1" />
                Last online: {offlineDuration}
              </p>
            )}
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled
            className="px-3 py-2 luxe-glass text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
}
