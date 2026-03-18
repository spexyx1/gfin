import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { IncomingCall } from '../hooks/useVideoCall';

interface IncomingCallNotificationProps {
  incomingCall: IncomingCall;
  onAccept: (session: IncomingCall['session']) => void;
  onDecline: (session: IncomingCall['session']) => void;
}

export function IncomingCallNotification({ incomingCall, onAccept, onDecline }: IncomingCallNotificationProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (elapsed >= 30) {
      onDecline(incomingCall.session);
    }
  }, [elapsed]);

  return (
    <div className="fixed top-6 right-6 z-[200] w-80 animate-in slide-in-from-top-4">
      <div className="luxe-glass-strong border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-green-500 to-blue-500" />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {incomingCall.callerAvatar ? (
                <img
                  src={incomingCall.callerAvatar}
                  alt={incomingCall.callerName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-green-500"
                />
              ) : (
                <div className="w-14 h-14 rounded-full luxe-glass border-2 border-green-500 flex items-center justify-center">
                  <User className="w-7 h-7 text-gray-400" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-gray-900 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-400 font-medium uppercase tracking-wide mb-0.5 flex items-center gap-1.5">
                <Video className="w-3 h-3" />
                Incoming Video Call
              </p>
              <p className="text-white font-semibold text-base truncate">{incomingCall.callerName}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Ringing... {elapsed}s
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => onDecline(incomingCall.session)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              Decline
            </button>
            <button
              onClick={() => onAccept(incomingCall.session)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
