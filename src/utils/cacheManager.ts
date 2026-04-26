export interface CacheStats {
  totalItems: number;
  caches: {
    name: string;
    itemCount: number;
  }[];
}

export async function clearAllCaches(): Promise<boolean> {
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();

      const promise = new Promise<boolean>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        setTimeout(() => resolve(false), 5000);
      });

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );

      return await promise;
    }

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    return true;
  } catch (error) {
    console.error('Error clearing caches:', error);
    return false;
  }
}

export async function getCacheStats(): Promise<CacheStats> {
  try {
    const cacheNames = await caches.keys();
    const stats: CacheStats = {
      totalItems: 0,
      caches: []
    };

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      const itemCount = keys.length;

      stats.caches.push({
        name: cacheName,
        itemCount
      });
      stats.totalItems += itemCount;
    }

    return stats;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalItems: 0,
      caches: []
    };
  }
}

export async function getCacheSize(): Promise<number> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const messageChannel = new MessageChannel();

    const promise = new Promise<number>((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.size || 0);
      };

      setTimeout(() => resolve(0), 5000);
    });

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_SIZE' },
      [messageChannel.port2]
    );

    return await promise;
  }

  const stats = await getCacheStats();
  return stats.totalItems;
}

export async function estimateStorageUsage(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
  available: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
      const available = quota - usage;

      return {
        usage,
        quota,
        percentUsed,
        available
      };
    } catch (error) {
      console.error('Error estimating storage:', error);
    }
  }

  return {
    usage: 0,
    quota: 0,
    percentUsed: 0,
    available: 0
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
