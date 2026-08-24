import { useState } from 'react';
import { 
  Shield, ArrowRight, UserPlus, Store, ShoppingCart, Lock, 
  CheckCircle2, Coins, Globe, Zap, Users, ArrowLeft,
  Smartphone, Wallet, MessageSquare, Star
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  const buyerSteps = [
    {
      icon: UserPlus,
      title: t('howItWorks.buyer.step1.title', 'Create Your Account'),
      desc: t('howItWorks.buyer.step1.desc', 'Sign up in seconds. Complete your profile to earn 50 GHETTO tokens as a welcome bonus.'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: ShoppingCart,
      title: t('howItWorks.buyer.step2.title', 'Browse & Purchase'),
      desc: t('howItWorks.buyer.step2.desc', 'Find what you need from verified sellers. Pay with GHETTO tokens or supported crypto.'),
      color: 'from-emerald-500 to-green-500',
    },
    {
      icon: Lock,
      title: t('howItWorks.buyer.step3.title', 'Escrow Protection'),
      desc: t('howItWorks.buyer.step3.desc', 'Your payment is held securely in escrow until you confirm delivery. Zero risk.'),
      color: 'from-amber-500 to-yellow-500',
    },
    {
      icon: CheckCircle2,
      title: t('howItWorks.buyer.step4.title', 'Confirm & Rate'),
      desc: t('howItWorks.buyer.step4.desc', 'Receive your item, confirm delivery, and rate the seller. Funds release automatically.'),
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const sellerSteps = [
    {
      icon: Store,
      title: t('howItWorks.seller.step1.title', 'Set Up Your Store'),
      desc: t('howItWorks.seller.step1.desc', 'Create listings with photos, descriptions, and pricing. Earn 75 GHETTO for your first listing.'),
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: MessageSquare,
      title: t('howItWorks.seller.step2.title', 'Receive Orders'),
      desc: t('howItWorks.seller.step2.desc', 'Get notified when buyers purchase or make offers. Chat directly with buyers.'),
      color: 'from-blue-500 to-indigo-500',
    },
    {
      icon: Wallet,
      title: t('howItWorks.seller.step3.title', 'Ship & Track'),
      desc: t('howItWorks.seller.step3.desc', 'Ship the item and add tracking info. The buyer is notified every step of the way.'),
      color: 'from-teal-500 to-cyan-500',
    },
    {
      icon: Coins,
      title: t('howItWorks.seller.step4.title', 'Get Paid'),
      desc: t('howItWorks.seller.step4.desc', 'Funds release from escrow once the buyer confirms. Withdraw anytime to your wallet.'),
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const features = [
    { icon: Shield, label: t('howItWorks.feature.escrow', 'Smart Escrow'), desc: t('howItWorks.feature.escrowDesc', 'Blockchain-backed protection on every trade') },
    { icon: Globe, label: t('howItWorks.feature.global', 'Global Access'), desc: t('howItWorks.feature.globalDesc', 'Trade with anyone, anywhere in the world') },
    { icon: Zap, label: t('howItWorks.feature.fast', 'Instant Settlements'), desc: t('howItWorks.feature.fastDesc', 'Polygon network for near-zero fees') },
    { icon: Users, label: t('howItWorks.feature.community', 'Community Driven'), desc: t('howItWorks.feature.communityDesc', 'Earn rewards for growing the platform') },
    { icon: Smartphone, label: t('howItWorks.feature.mobile', 'Mobile Ready'), desc: t('howItWorks.feature.mobileDesc', 'Full app available for Android devices') },
    { icon: Star, label: t('howItWorks.feature.reputation', 'Trust System'), desc: t('howItWorks.feature.reputationDesc', 'Verified profiles and seller ratings') },
  ];

  const steps = activeTab === 'buy' ? buyerSteps : sellerSteps;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('howItWorks.backHome', 'Back to Marketplace')}</span>
          </Link>
          <Link
            to="/"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-lg text-sm hover:from-amber-400 hover:to-yellow-400 transition-all"
          >
            {t('howItWorks.startTrading', 'Start Trading')}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            {t('howItWorks.badge', 'Escrow-Protected P2P Trading')}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {t('howItWorks.heroTitle', 'How GHETTO FINANCE Works')}
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {t('howItWorks.heroDesc', 'A decentralized marketplace where every transaction is protected by smart escrow. Buy and sell anything with confidence.')}
          </p>
        </div>
      </section>

      {/* Buyer/Seller Toggle */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'buy'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('howItWorks.buyerTab', 'I Want to Buy')}
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'sell'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t('howItWorks.sellerTab', 'I Want to Sell')}
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-start gap-5 group">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                {index < steps.length - 1 && (
                  <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent mt-2" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t('howItWorks.step', 'Step')} {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
          {t('howItWorks.whyTitle', 'Why Traders Choose Us')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feat) => (
            <div
              key={feat.label}
              className="rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-200 group"
            >
              <feat.icon className="w-8 h-8 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-white font-semibold mb-1">{feat.label}</h4>
              <p className="text-gray-400 text-sm">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/50 via-black to-amber-950/50 p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('howItWorks.ctaTitle', 'Ready to Start Trading?')}
          </h2>
          <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            {t('howItWorks.ctaDesc', 'Join thousands of traders already using GHETTO FINANCE. Earn up to 250 GHETTO tokens just for getting started.')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 inline-flex items-center gap-2"
            >
              {t('howItWorks.ctaButton', 'Enter Marketplace')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/download"
              className="px-8 py-3 border border-white/20 text-white font-medium rounded-xl hover:bg-white/5 transition-all inline-flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              {t('howItWorks.downloadApp', 'Download App')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
