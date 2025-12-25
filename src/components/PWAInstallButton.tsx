import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Apple, Chrome, Zap } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showMobileBanner, setShowMobileBanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                                (window.navigator as any).standalone === true;

    setIsIOS(isIOSDevice);
    setIsMobile(isMobileDevice);
    setIsInstalled(isInStandaloneMode);

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setInstallDismissed(true);
      } else {
        localStorage.removeItem('pwa-install-dismissed');
      }
    }

    if (isInStandaloneMode) {
      return;
    }

    if (isIOSDevice || isMobileDevice) {
      setTimeout(() => {
        if (!installDismissed) {
          setShowMobileBanner(true);
        }
        setShowInstallButton(true);
      }, 3000);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);

      if (isMobileDevice && !installDismissed) {
        setTimeout(() => setShowMobileBanner(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [installDismissed]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      setShowMobileBanner(false);
      return;
    }

    if (!deferredPrompt) {
      setShowIOSInstructions(true);
      setShowMobileBanner(false);
      return;
    }

    setShowMobileBanner(false);
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstallButton(false);
      setShowMobileBanner(false);
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
  };

  const handleDismissBanner = () => {
    setShowMobileBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setInstallDismissed(true);
  };

  if (isInstalled) {
    return null;
  }

  if (!showInstallButton) {
    return null;
  }

  return (
    <>
      {showMobileBanner && isMobile && !isInstalled && !installDismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
          <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-t-2 border-neon-yellow p-4 shadow-2xl">
            <div className="max-w-md mx-auto flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-neon-yellow via-neon-orange to-neon-yellow rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-black text-sm mb-1">Install GHETTO FINANCE</h4>
                <p className="text-gray-400 text-xs">Access faster. Work offline. One tap away.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2 bg-neon-yellow hover:bg-neon-orange text-black rounded-lg font-bold text-sm transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={handleDismissBanner}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInstallButton && !showMobileBanner && (
        <button
          onClick={handleInstallClick}
          className="group relative w-full px-6 py-4 bg-gradient-to-r from-neon-yellow via-neon-orange to-neon-yellow bg-[length:200%_100%] hover:bg-[position:100%_0] text-black font-black rounded-lg transition-all duration-500 flex items-center justify-center space-x-3 shadow-lg hover:shadow-neon-blue transform hover:scale-105"
        >
          <div className="relative">
            <Smartphone className="w-5 h-5 animate-pulse" />
            <Download className="w-3 h-3 absolute -bottom-1 -right-1 animate-bounce" />
          </div>
          <span className="text-sm uppercase tracking-wider">
            {isIOS ? 'Install App on iPhone' : 'Install App'}
          </span>
        </button>
      )}

      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                {isIOS ? <Apple className="h-6 w-6 text-neon-yellow" /> : <Chrome className="h-6 w-6 text-neon-yellow" />}
                <h2 className="text-xl font-black text-white uppercase">
                  {isIOS ? 'Install on iPhone' : 'Install App'}
                </h2>
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                {isIOS ? (
                  <>
                    <p className="text-neon-orange font-medium mb-4 text-sm">
                      Follow these steps to install GHETTO FINANCE on your iPhone:
                    </p>
                    <ol className="space-y-4 text-sm text-gray-300">
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-neon-yellow text-black rounded-full flex items-center justify-center font-black text-xs">
                          1
                        </span>
                        <span>
                          Tap the <strong className="text-neon-blue">Share button</strong> at the bottom of Safari (square with arrow pointing up)
                        </span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-neon-yellow text-black rounded-full flex items-center justify-center font-black text-xs">
                          2
                        </span>
                        <span>
                          Scroll down and tap <strong className="text-neon-blue">"Add to Home Screen"</strong>
                        </span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-neon-yellow text-black rounded-full flex items-center justify-center font-black text-xs">
                          3
                        </span>
                        <span>
                          Tap <strong className="text-neon-blue">"Add"</strong> in the top right corner
                        </span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-neon-yellow text-black rounded-full flex items-center justify-center font-black text-xs">
                          4
                        </span>
                        <span>
                          The GHETTO FINANCE icon will appear on your home screen!
                        </span>
                      </li>
                    </ol>
                  </>
                ) : (
                  <>
                    <p className="text-neon-orange font-medium mb-4 text-sm">
                      To install GHETTO FINANCE as an app on Chrome/Android:
                    </p>
                    <ol className="space-y-4 text-sm text-gray-300">
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-neon-yellow text-black rounded-full flex items-center justify-center font-black text-xs">
                          1
                        </span>
                        <span>
                          Open this site in <strong className="text-neon-blue">Chrome browser</strong> on Android
                        </span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-neon-yellow text-black rounded-full flex items-center justify-center font-black text-xs">
                          2
                        </span>
                        <span>
                          Look for an <strong className="text-neon-blue">"Install"</strong> banner at the top or bottom of the screen
                        </span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-neon-yellow text-black rounded-full flex items-center justify-center font-black text-xs">
                          3
                        </span>
                        <span>
                          Or tap the <strong className="text-neon-blue">3-dot menu</strong> and select "Install app" or "Add to Home screen"
                        </span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-neon-yellow text-black rounded-full flex items-center justify-center font-black text-xs">
                          4
                        </span>
                        <span>
                          The app icon will appear on your home screen!
                        </span>
                      </li>
                    </ol>
                  </>
                )}
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-xs text-yellow-400">
                  <strong className="font-black">NOTE:</strong> {isIOS
                    ? 'This feature only works in Safari browser on iOS. If you\'re using Chrome or another browser, please open this site in Safari first.'
                    : 'For best results, use Chrome browser on Android. Desktop browsers may require HTTPS and meeting PWA installation criteria.'}
                </p>
              </div>

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full px-6 py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-xl transition-colors font-black uppercase"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
