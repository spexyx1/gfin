import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { CallSession } from '../hooks/useVideoCall';
import { useAuth } from '../hooks/useAuth';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface VideoCallModalProps {
  session: CallSession;
  onEnd: () => void;
  participantName: string;
}

export function VideoCallModal({ session, onEnd, participantName }: VideoCallModalProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadJitsiScript().then(() => {
      if (jitsiContainerRef.current && window.JitsiMeetExternalAPI) {
        initJitsi();
      }
    });

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [session.roomName]);

  const loadJitsiScript = (): Promise<void> => {
    return new Promise((resolve) => {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }
      const existing = document.getElementById('jitsi-api-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'jitsi-api-script';
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  const initJitsi = () => {
    if (!jitsiContainerRef.current) return;

    const userDisplayName = (user as any)?.profile?.display_name
      || (user as any)?.profile?.username
      || (user as any)?.email?.split('@')[0]
      || 'User';

    apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName: session.roomName,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        toolbarButtons: [],
        hideConferenceSubject: true,
        hideConferenceTimer: false,
        disablePolls: true,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        DEFAULT_BACKGROUND: '#111827',
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        MOBILE_APP_PROMO: false,
        HIDE_INVITE_MORE_HEADER: true,
      },
      userInfo: {
        displayName: userDisplayName,
      },
    });

    apiRef.current.addEventListener('videoConferenceJoined', () => {
      setIsLoading(false);
    });

    apiRef.current.addEventListener('videoConferenceLeft', () => {
      onEnd();
    });

    apiRef.current.addEventListener('audioMuteStatusChanged', (event: any) => {
      setIsMuted(event.muted);
    });

    apiRef.current.addEventListener('videoMuteStatusChanged', (event: any) => {
      setIsVideoOff(event.muted);
    });
  };

  const handleToggleMute = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleAudio');
    }
  };

  const handleToggleVideo = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleVideo');
    }
  };

  const handleEndCall = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup');
    }
    onEnd();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white font-medium">Call with {participantName}</span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <p className="text-gray-300 text-lg font-medium">Connecting to {participantName}...</p>
            <p className="text-gray-500 text-sm mt-2">Please allow camera and microphone access</p>
          </div>
        )}
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </div>

      <div className="flex items-center justify-center gap-4 px-6 py-5 bg-gray-900 border-t border-gray-800">
        <button
          onClick={handleToggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={handleToggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoOff
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={handleEndCall}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors text-white"
          title="End call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
