import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Check } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function MobileNetworkIndicator() {
  const { isOnline, isOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
    }

    if (isOnline && wasOffline) {
      setShowReconnected(true);
      setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
    }
  }, [isOnline, isOffline, wasOffline]);

  if (showReconnected) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2">
          <Check className="w-5 h-5" />
          <span className="font-bold text-sm">Back Online</span>
        </div>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2">
          <WifiOff className="w-5 h-5 animate-pulse" />
          <span className="font-bold text-sm">Offline Mode</span>
        </div>
      </div>
    );
  }

  return null;
}
