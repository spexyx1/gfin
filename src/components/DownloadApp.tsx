import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Apple, Shield, Zap, RefreshCw, ArrowLeft, Share } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AppRelease {
  id: string;
  platform: 'android' | 'ios';
  version: string;
  download_url: string;
  changelog: string;
  file_size_mb: number;
  min_os_version: string;
  release_date: string;
  is_latest: boolean;
}

export function DownloadApp() {
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectedPlatform, setDetectedPlatform] = useState<'android' | 'ios' | 'desktop'>('desktop');

  useEffect(() => {
    detectPlatform();
    fetchReleases();
  }, []);

  const detectPlatform = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDetectedPlatform('ios');
    } else if (/android/.test(ua)) {
      setDetectedPlatform('android');
    } else {
      setDetectedPlatform('desktop');
    }
  };

  const fetchReleases = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('app_releases')
      .select('*')
      .eq('is_latest', true)
      .order('release_date', { ascending: false });

    if (data) {
      setReleases(data as AppRelease[]);
    }
    setLoading(false);
  };

  const androidRelease = releases.find(r => r.platform === 'android');
  const iosRelease = releases.find(r => r.platform === 'ios');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Marketplace</span>
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 mb-6">
            <Smartphone className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Get the App
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Download GHETTO FINANCE on your phone. Full marketplace access, real-time notifications, and secure transactions -- all in your pocket.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className={`relative p-6 rounded-2xl border transition-all ${
            detectedPlatform === 'android'
              ? 'border-green-500/50 bg-green-500/5 ring-1 ring-green-500/20'
              : 'border-gray-800 bg-gray-900/50'
          }`}>
            {detectedPlatform === 'android' && (
              <div className="absolute -top-3 left-4 px-2 py-0.5 bg-green-500 text-black text-xs font-bold rounded-full">
                Your device
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Android</h3>
                <p className="text-gray-500 text-sm">Direct APK Download</p>
              </div>
            </div>

            {androidRelease ? (
              <>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Version</span>
                    <span className="text-white font-medium">{androidRelease.version}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Size</span>
                    <span className="text-white font-medium">{androidRelease.file_size_mb} MB</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Requires</span>
                    <span className="text-white font-medium">Android {androidRelease.min_os_version}+</span>
                  </div>
                </div>
                <a
                  href={androidRelease.download_url}
                  className="block w-full py-3 px-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl text-center transition-colors"
                >
                  Download APK
                </a>
              </>
            ) : (
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Version</span>
                  <span className="text-white font-medium">1.0.0-beta</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Requires</span>
                  <span className="text-white font-medium">Android 8.0+</span>
                </div>
                <div className="mt-4 py-3 px-4 bg-gray-800 text-gray-400 font-medium rounded-xl text-center text-sm">
                  Coming Soon
                </div>
              </div>
            )}
          </div>

          <div className={`relative p-6 rounded-2xl border transition-all ${
            detectedPlatform === 'ios'
              ? 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20'
              : 'border-gray-800 bg-gray-900/50'
          }`}>
            {detectedPlatform === 'ios' && (
              <div className="absolute -top-3 left-4 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                Your device
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Apple className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">iOS</h3>
                <p className="text-gray-500 text-sm">Install via Safari</p>
              </div>
            </div>

            {iosRelease ? (
              <>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Version</span>
                    <span className="text-white font-medium">{iosRelease.version}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Size</span>
                    <span className="text-white font-medium">{iosRelease.file_size_mb} MB</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Requires</span>
                    <span className="text-white font-medium">iOS {iosRelease.min_os_version}+</span>
                  </div>
                </div>
                <a
                  href={iosRelease.download_url}
                  className="block w-full py-3 px-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-center transition-colors"
                >
                  Join TestFlight Beta
                </a>
              </>
            ) : (
              <>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Version</span>
                    <span className="text-white font-medium">PWA</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Requires</span>
                    <span className="text-white font-medium">iOS 15.0+</span>
                  </div>
                </div>
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 mb-4">
                  <p className="text-sm text-gray-300 mb-3 font-medium">Install as a Progressive Web App:</p>
                  <ol className="space-y-2 text-sm text-gray-400">
                    <li className="flex gap-2">
                      <span className="text-blue-400 font-bold flex-shrink-0">1.</span>
                      <span>Open this page in <strong className="text-white">Safari</strong> on your iPhone</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400 font-bold flex-shrink-0">2.</span>
                      <span>Tap the <Share className="inline w-4 h-4 text-blue-400 align-middle" /> <strong className="text-white">Share</strong> button at the bottom</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400 font-bold flex-shrink-0">3.</span>
                      <span>Scroll down and tap <strong className="text-white">Add to Home Screen</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-400 font-bold flex-shrink-0">4.</span>
                      <span>Tap <strong className="text-white">Add</strong> -- the app appears on your home screen</span>
                    </li>
                  </ol>
                </div>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'GHETTO FINANCE', url: window.location.href });
                    }
                  }}
                  className="block w-full py-3 px-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-center transition-colors"
                >
                  Add to Home Screen
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-center">How to Install (Android)</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-400 font-bold">1</span>
              </div>
              <p className="text-sm text-gray-300">Tap "Download APK" above on your Android phone</p>
            </div>
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-400 font-bold">2</span>
              </div>
              <p className="text-sm text-gray-300">Open the downloaded file. Allow "Install from this source" if prompted</p>
            </div>
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-400 font-bold">3</span>
              </div>
              <p className="text-sm text-gray-300">App installs on your home screen. Sign in with your account</p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-center">How to Install (iOS)</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <p className="text-sm text-gray-300">Open this site in Safari on your iPhone or iPad</p>
            </div>
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <p className="text-sm text-gray-300">Tap the Share button at the bottom of Safari</p>
            </div>
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">3</span>
              </div>
              <p className="text-sm text-gray-300">Scroll down and select "Add to Home Screen"</p>
            </div>
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 font-bold">4</span>
              </div>
              <p className="text-sm text-gray-300">Tap Add. The app launches full-screen from your home screen</p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-center">Why Use the Native App?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">No Browser Needed</h4>
                <p className="text-sm text-gray-400">Access the full platform directly from your home screen without opening a browser</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <RefreshCw className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Real-Time Sync</h4>
                <p className="text-sm text-gray-400">All transactions, messages, and activity sync instantly between web and app</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Secure by Default</h4>
                <p className="text-sm text-gray-400">Same blockchain-powered escrow protection as the website</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <Smartphone className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Native Experience</h4>
                <p className="text-sm text-gray-400">Built for mobile with optimized navigation, gestures, and performance</p>
              </div>
            </div>
          </div>
        </div>

        {(androidRelease?.changelog || iosRelease?.changelog) && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4 text-center">What's New</h2>
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <p className="text-sm text-gray-300 whitespace-pre-line">
                {androidRelease?.changelog || iosRelease?.changelog}
              </p>
            </div>
          </div>
        )}

        <div className="text-center text-gray-600 text-xs">
          <p>GHETTO FINANCE Mobile App - Beta Version</p>
          <p className="mt-1">Your account works across all platforms. One login, everywhere.</p>
        </div>
      </div>
    </div>
  );
}
