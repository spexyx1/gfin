import { useState, useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface CachedData<T> {
  data: T;
  cachedAt: string;
  cached: boolean;
}

export function useOfflineStorage<T>(key: string, fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOnline) {
        const freshData = await fetchFn();
        setData(freshData);
        setIsCached(false);
        setCachedAt(null);

        cacheData(key, freshData);
      } else {
        const cached = await getCachedData<T>(key);
        if (cached) {
          setData(cached.data);
          setIsCached(true);
          setCachedAt(new Date(cached.cachedAt));
        } else {
          throw new Error('No cached data available offline');
        }
      }
    } catch (err) {
      console.error('[OfflineStorage] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');

      const cached = await getCachedData<T>(key);
      if (cached) {
        setData(cached.data);
        setIsCached(true);
        setCachedAt(new Date(cached.cachedAt));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [key, isOnline]);

  const refresh = () => {
    loadData();
  };

  const getCacheAge = (): string | null => {
    if (!cachedAt) return null;

    const now = new Date();
    const diff = now.getTime() - cachedAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return {
    data,
    isLoading,
    error,
    isCached,
    cachedAt,
    cacheAge: getCacheAge(),
    refresh,
  };
}

async function cacheData<T>(key: string, data: T): Promise<void> {
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PROFILE_DATA',
        payload: {
          key,
          data,
        },
      });
    }

    localStorage.setItem(
      `offline_${key}`,
      JSON.stringify({
        data,
        cachedAt: new Date().toISOString(),
        cached: true,
      })
    );
  } catch (err) {
    console.error('[OfflineStorage] Failed to cache data:', err);
  }
}

async function getCachedData<T>(key: string): Promise<CachedData<T> | null> {
  try {
    const cached = localStorage.getItem(`offline_${key}`);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (err) {
    console.error('[OfflineStorage] Failed to get cached data:', err);
    return null;
  }
}
