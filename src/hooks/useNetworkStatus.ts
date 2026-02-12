import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
  });

  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      const status: NetworkStatus = {
        isOnline: navigator.onLine,
        isOffline: !navigator.onLine,
      };

      if (connection) {
        status.effectiveType = connection.effectiveType;
        status.downlink = connection.downlink;
        status.rtt = connection.rtt;
        status.saveData = connection.saveData;
      }

      setNetworkStatus(status);

      if (navigator.onLine) {
        setLastOnlineTime(new Date());
      }
    };

    const handleOnline = () => {
      logger.debug('[NetworkStatus] Connection restored', 'useNetworkStatus');
      updateNetworkStatus();

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_NOW',
        });
      }
    };

    const handleOffline = () => {
      logger.debug('[NetworkStatus] Connection lost', 'useNetworkStatus');
      updateNetworkStatus();
    };

    updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  const getOfflineDuration = (): string | null => {
    if (networkStatus.isOnline || !lastOnlineTime) return null;

    const now = new Date();
    const diff = now.getTime() - lastOnlineTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  };

  return {
    ...networkStatus,
    lastOnlineTime,
    offlineDuration: getOfflineDuration(),
  };
}
