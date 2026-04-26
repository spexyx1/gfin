import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Database, HardDrive } from 'lucide-react';
import {
  clearAllCaches,
  getCacheStats,
  estimateStorageUsage,
  formatBytes,
  type CacheStats
} from '../utils/cacheManager';

export function CacheManagement() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [storageInfo, setStorageInfo] = useState({
    usage: 0,
    quota: 0,
    percentUsed: 0,
    available: 0
  });
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);

  const loadCacheStats = async () => {
    setIsRefreshing(true);
    try {
      const [stats, storage] = await Promise.all([
        getCacheStats(),
        estimateStorageUsage()
      ]);
      setCacheStats(stats);
      setStorageInfo(storage);
    } catch (error) {
      console.error('Error loading cache stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCacheStats();
  }, []);

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cached data? This will free up storage but may temporarily slow down the app until data is re-cached.')) {
      return;
    }

    setIsClearing(true);
    try {
      const success = await clearAllCaches();
      if (success) {
        setLastCleared(new Date());
        await loadCacheStats();
        alert('Cache cleared successfully! The app may reload some data.');
      } else {
        alert('Failed to clear cache. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error clearing cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Management
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage cached data to optimize storage and performance
          </p>
        </div>
        <button
          onClick={loadCacheStats}
          disabled={isRefreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh stats"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-5 h-5 text-gray-700" />
            <h4 className="font-medium text-gray-900">Storage Usage</h4>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">
                  {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    storageInfo.percentUsed > 80
                      ? 'bg-red-500'
                      : storageInfo.percentUsed > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(storageInfo.percentUsed, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{storageInfo.percentUsed.toFixed(1)}% used</span>
                <span>{formatBytes(storageInfo.available)} available</span>
              </div>
            </div>

            {storageInfo.percentUsed > 80 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Storage Warning:</strong> Your browser storage is running low. Consider clearing the cache to free up space.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Cache Statistics</h4>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total cached items</span>
              <span className="font-medium text-gray-900">
                {cacheStats?.totalItems || 0}
              </span>
            </div>

            {cacheStats && cacheStats.caches.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">Cache Breakdown:</p>
                {cacheStats.caches.map((cache) => (
                  <div key={cache.name} className="flex justify-between text-xs py-1">
                    <span className="text-gray-600 truncate mr-2">{cache.name}</span>
                    <span className="text-gray-900 font-medium">{cache.itemCount} items</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {lastCleared ? (
              <span>Last cleared: {lastCleared.toLocaleString()}</span>
            ) : (
              <span>Cache has not been cleared recently</span>
            )}
          </div>
          <button
            onClick={handleClearCache}
            disabled={isClearing || !cacheStats || cacheStats.totalItems === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Clear Cache
              </>
            )}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-2">About Cache</h5>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>Cache stores data temporarily for faster loading times</li>
            <li>Old cached data expires automatically after 24 hours</li>
            <li>Cache is limited to prevent storage issues</li>
            <li>Clearing cache is safe and won't delete your account data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
