import { useState, useEffect } from 'react';
import { Users, Package, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface Stats {
  total_users: number;
  total_products: number;
  total_transactions: number;
  total_volume_ghetto: number;
}

export default function PlatformStats() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (stats) {
      const timer = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [stats]);

  async function loadStats() {
    const { data } = await supabase
      .from('platform_stats_cache')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (data) {
      setStats(data);
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  }

  if (!stats) return null;

  const items = [
    { icon: Users, label: t('stats.traders', 'Active Traders'), value: stats.total_users, color: 'from-amber-500 to-yellow-500' },
    { icon: Package, label: t('stats.listings', 'Live Listings'), value: stats.total_products, color: 'from-emerald-500 to-green-500' },
    { icon: ArrowRightLeft, label: t('stats.transactions', 'Transactions'), value: stats.total_transactions, color: 'from-cyan-500 to-blue-500' },
    { icon: TrendingUp, label: t('stats.volume', 'Volume (GHETTO)'), value: stats.total_volume_ghetto, color: 'from-rose-500 to-pink-500' },
  ];

  return (
    <section className="w-full py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto px-4">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-5 transition-all duration-700 ${
              animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${item.color}`} />
            <div className="relative z-10">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} mb-3`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {formatNumber(item.value)}
              </p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
