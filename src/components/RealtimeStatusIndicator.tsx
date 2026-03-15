import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface RealtimeStatusIndicatorProps {
  showLabel?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function RealtimeStatusIndicator({
  showLabel = false,
  position = 'bottom-right',
}: RealtimeStatusIndicatorProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const testChannel = supabase.channel('connection-test');

    testChannel
      .on('system', {}, (payload) => {
        console.log('Realtime system event:', payload);
      })
      .subscribe((status) => {
        console.log('Realtime status:', status);

        switch (status) {
          case 'SUBSCRIBED':
            setStatus('connected');
            setLastConnected(new Date());
            break;
          case 'CHANNEL_ERROR':
            setStatus('error');
            break;
          case 'TIMED_OUT':
            setStatus('disconnected');
            break;
          case 'CLOSED':
            setStatus('disconnected');
            break;
          default:
            setStatus('connecting');
        }
      });

    const pingInterval = setInterval(async () => {
      try {
        const { error } = await supabase.from('products').select('count').limit(1);
        if (error && status === 'connected') {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    }, 30000);

    return () => {
      testChannel.unsubscribe();
      clearInterval(pingInterval);
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'connecting':
        return <Wifi className="w-4 h-4 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all ${
          status === 'connected'
            ? 'bg-white text-green-600 hover:bg-green-50'
            : status === 'error'
            ? 'bg-white text-red-600 hover:bg-red-50'
            : status === 'disconnected'
            ? 'bg-white text-gray-600 hover:bg-gray-50'
            : 'bg-white text-yellow-600 hover:bg-yellow-50'
        }`}
      >
        <div className="relative">
          {getIcon()}
          <span
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${getStatusColor()} ${
              status === 'connecting' ? 'animate-pulse' : ''
            }`}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium">{getStatusText()}</span>
        )}
      </motion.button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border p-4"
          >
            <h3 className="font-semibold text-gray-900 mb-3">
              Real-Time Connection
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  status === 'connected' ? 'text-green-600' :
                  status === 'error' ? 'text-red-600' :
                  status === 'disconnected' ? 'text-gray-600' :
                  'text-yellow-600'
                }`}>
                  {getStatusText()}
                </span>
              </div>

              {lastConnected && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Connected:</span>
                  <span className="text-gray-900 font-medium">
                    {lastConnected.toLocaleTimeString()}
                  </span>
                </div>
              )}

              <div className="pt-2 mt-2 border-t">
                <p className="text-xs text-gray-500">
                  {status === 'connected' && (
                    <>Real-time updates are active. Changes sync instantly across all devices.</>
                  )}
                  {status === 'connecting' && (
                    <>Establishing connection to real-time server...</>
                  )}
                  {status === 'disconnected' && (
                    <>Connection lost. Trying to reconnect...</>
                  )}
                  {status === 'error' && (
                    <>Connection error. Check your internet and try refreshing.</>
                  )}
                </p>
              </div>

              {(status === 'error' || status === 'disconnected') && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full mt-3 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reconnect
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
