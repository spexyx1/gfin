import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Search, ShoppingCart, User, Wallet, TrendingUp, Package, MessageCircle, Store, CreditCard, Users, AtSign, Filter, Globe, Mail, DollarSign, ShoppingBag, Briefcase, CircleUser as UserCircle, Smartphone } from 'lucide-react';
import { SearchFilters } from './components/AdvancedSearch';
import { GraffitiLogo } from './components/GraffitiLogo';
import { AuthModal } from './components/AuthModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { MobileNetworkIndicator } from './components/MobileNetworkIndicator';
import { NetworkSwitchModal } from './components/NetworkSwitchModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RealtimeNotificationSystem } from './components/RealtimeNotificationSystem';
import { RealtimeStatusIndicator } from './components/RealtimeStatusIndicator';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FooterLanguageSelector } from './components/FooterLanguageSelector';
import { getCopyrightNotice } from './config/legalConstants';
const SecurityAuditModal = lazy(() => import('./components/SecurityAuditModal').then(m => ({ default: m.SecurityAuditModal })));
const DocumentationModal = lazy(() => import('./components/DocumentationModal').then(m => ({ default: m.DocumentationModal })));

const AdvancedSearch = lazy(() => import('./components/AdvancedSearch').then(m => ({ default: m.AdvancedSearch })));
const UserDashboard = lazy(() => import('./components/UserDashboard').then(m => ({ default: m.UserDashboard })));
const Cart = lazy(() => import('./components/Cart').then(m => ({ default: m.Cart })));
const BuyNowModal = lazy(() => import('./components/BuyNowModal').then(m => ({ default: m.BuyNowModal })));
const MakeOfferModal = lazy(() => import('./components/MakeOfferModal').then(m => ({ default: m.MakeOfferModal })));
const ReportListingModal = lazy(() => import('./components/ReportListingModal').then(m => ({ default: m.ReportListingModal })));
const MessagingCenter = lazy(() => import('./components/MessagingCenter').then(m => ({ default: m.MessagingCenter })));
const OrderManagement = lazy(() => import('./components/OrderManagement').then(m => ({ default: m.OrderManagement })));
const SellerDashboard = lazy(() => import('./components/SellerDashboard').then(m => ({ default: m.SellerDashboard })));
const WalletDashboard = lazy(() => import('./components/WalletDashboard').then(m => ({ default: m.WalletDashboard })));
const EnhancedSitemasterDashboard = lazy(() => import('./components/EnhancedSitemasterDashboard').then(m => ({ default: m.EnhancedSitemasterDashboard })));
const TreasurerDashboard = lazy(() => import('./components/TreasurerDashboard').then(m => ({ default: m.TreasurerDashboard })));
const MediatorDashboard = lazy(() => import('./components/MediatorDashboard').then(m => ({ default: m.MediatorDashboard })));
const ProfileSetup = lazy(() => import('./components/ProfileSetup').then(m => ({ default: m.ProfileSetup })));
const SocialHub = lazy(() => import('./components/SocialHub').then(m => ({ default: m.SocialHub })));
const SocialPlatform = lazy(() => import('./components/SocialPlatform').then(m => ({ default: m.SocialPlatform })));
const SecurityDashboard = lazy(() => import('./components/SecurityDashboard').then(m => ({ default: m.SecurityDashboard })));
const FAQ = lazy(() => import('./components/FAQ').then(m => ({ default: m.FAQ })));
const LegalPage = lazy(() => import('./components/LegalPage').then(m => ({ default: m.LegalPage })));
const ProhibitedItemsPage = lazy(() => import('./components/ProhibitedItemsPage').then(m => ({ default: m.ProhibitedItemsPage })));
const ContactForm = lazy(() => import('./components/ContactForm').then(m => ({ default: m.ContactForm })));
const BlockchainManagement = lazy(() => import('./components/BlockchainManagement').then(m => ({ default: m.BlockchainManagement })));
import { useTranslation } from 'react-i18next';
import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useMessaging } from './hooks/useMessaging';
import { useSocialSystem } from './hooks/useSocialSystem';
import { useProducts } from './hooks/useProducts';
import { useSitemasterRole } from './hooks/useSitemasterRole';
import { useModalManager } from './hooks/useModalManager';
import { useProductFilter } from './hooks/useProductFilter';
import { logger } from './utils/logger';


function App() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    priceMin: 0,
    priceMax: 10000,
    location: '',
    seller: '',
    verifiedOnly: false,
    inStockOnly: true,
    sortBy: 'relevance',
    tags: [],
  });

  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { addToCart, getItemCount } = useCart();
  const { getUnreadCount, createConversation } = useMessaging();
  const { getUserProfile } = useSocialSystem();
  const { products: allProducts, isLoading: productsLoading, loadProducts } = useProducts();
  const { issitemaster } = useSitemasterRole();
  const { openModal, closeModal, isOpen, getData } = useModalManager();


  // State for unread message count
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Load unread message count
  React.useEffect(() => {
    const loadUnreadCount = async () => {
      if (user) {
        try {
          const count = await getUnreadCount();
          setUnreadMessageCount(count);
        } catch (error) {
          logger.error('Failed to load unread count', 'App', error);
          setUnreadMessageCount(0);
        }
      } else {
        setUnreadMessageCount(0);
      }
    };

    loadUnreadCount();
  }, [user, getUnreadCount]);

  // Capture referral code from URL parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      localStorage.setItem('referralCode', refCode);
      logger.info(`Referral code captured: ${refCode}`, 'App');

      // Clean URL without reloading the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // Listen for showLegal event from AuthModal
  React.useEffect(() => {
    const handleShowLegal = () => {
      openModal('legal');
    };

    window.addEventListener('showLegal', handleShowLegal);

    return () => {
      window.removeEventListener('showLegal', handleShowLegal);
    };
  }, [openModal]);

  // Check if we're on the social platform page
  const isSocialPage = location.pathname === '/social';

  // Use product filter hook
  const filteredProducts = useProductFilter(allProducts, searchTerm, searchFilters);

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setSearchTerm(filters.query);
  };

  const handleAddToCart = (product: any) => {
    if (!user) {
      setAuthMode('login');
      openModal('auth');
      return;
    }
    addToCart(product);
  };

  const handleBuyNow = (product: any) => {
    if (!user) {
      setAuthMode('login');
      openModal('auth');
      return;
    }
    openModal('buyNow', product);
  };

  const handleMakeOffer = (product: any) => {
    if (!user) {
      setAuthMode('login');
      openModal('auth');
      return;
    }
    openModal('makeOffer', product);
  };

  const handleContactSeller = async (sellerId: string) => {
    if (!user) {
      setAuthMode('login');
      openModal('auth');
      return;
    }

    try {
      await createConversation(sellerId);
      openModal('messages');
    } catch (error) {
      logger.error('Failed to create conversation', 'App', error);
    }
  };

  const handleReportListing = (product: any) => {
    openModal('reportListing', product);
  };


  // Marketplace component
  const MarketplaceContent = () => (
    <>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 transition-all duration-500 ease-in-out ${
        isSearchFocused ? 'pt-4 pb-16' : 'py-8 sm:py-12 lg:py-16'
      }`}>
        {/* Hero Section */}
        <div className={`transition-all duration-500 ease-in-out ${
          isSearchFocused ? 'h-0 mb-0 opacity-0 overflow-hidden pointer-events-none' : 'mb-8 sm:mb-12 opacity-100'
        }`}>
          {/* Headline */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl luxe-title mb-3 sm:mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-[#FFEA00] via-[#FFD700] to-[#FF8C00] bg-clip-text text-transparent luxe-text-glow">
                {t('marketplace.heroTitle1')}
              </span>
              <br />
              <span className="text-white inline-block relative">
                {t('marketplace.heroTitle2')}<span className="relative inline-block">{t('marketplace.heroTitle3')}<sup className="absolute top-1 -right-2 text-white text-base sm:text-lg">*</sup></span> {t('marketplace.heroTitle4')}
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed px-2">
              {t('marketplace.heroSubtitle')}
            </p>
          </div>

          {/* Why Trade Here */}
          <div className="mb-6 sm:mb-10">
            <div className="text-center mb-4 sm:mb-6">
              <p className="luxe-subtitle text-gray-500 tracking-widest text-xs mb-2">{t('marketplace.whyTradeHere')}</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
              <div className="luxe-card p-5 sm:p-8 group">
                <div className="w-14 h-14 bg-gradient-to-br from-[#22c55e]/20 to-[#16a34a]/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-[#22c55e]/30 group-hover:to-[#16a34a]/30 transition-all">
                  <Shield className="w-7 h-7 text-[#22c55e]" />
                </div>
                <h3 className="text-xl luxe-title text-white mb-3">{t('marketplace.escrowProtection')}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  {t('marketplace.escrowProtectionDesc')}
                </p>
              </div>

              <div className="luxe-card p-8 group">
                <div className="w-14 h-14 bg-gradient-to-br from-[#FFD700]/20 to-[#FF8C00]/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-[#FFD700]/30 group-hover:to-[#FF8C00]/30 transition-all">
                  <Wallet className="w-7 h-7 text-[#FFD700]" />
                </div>
                <h3 className="text-xl luxe-title text-white mb-3">{t('marketplace.payWithAnyCrypto')}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  {t('marketplace.payWithAnyCryptoDesc')}
                </p>
              </div>

              <div className="luxe-card p-8 group">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-600/20 to-gray-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-gray-600/30 group-hover:to-gray-500/30 transition-all">
                  <AtSign className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-xl luxe-title text-white mb-3">{t('marketplace.privateByDefault')}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  {t('marketplace.privateByDefaultDesc')}
                </p>
              </div>

              <div className="luxe-card p-8 group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all">
                  <Users className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-xl luxe-title text-white mb-3">{t('marketplace.moderatedDisputes')}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">
                  {t('marketplace.moderatedDisputesDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="luxe-glass rounded-xl p-6 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-sm font-normal text-gray-400 uppercase tracking-wider mb-2">{t('marketplace.howItWorks')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-yellow-500/50">
                  <span className="text-lg luxe-title text-yellow-400">1</span>
                </div>
                <h4 className="text-sm luxe-title text-neon-yellow mb-1">{t('marketplace.step1Title')}</h4>
                <p className="text-xs text-gray-400 font-normal leading-relaxed">
                  {t('marketplace.step1Desc')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-green-500/50">
                  <span className="text-lg luxe-title text-green-400">2</span>
                </div>
                <h4 className="text-sm luxe-title text-neon-yellow mb-1">{t('marketplace.step2Title')}</h4>
                <p className="text-xs text-gray-400 font-normal leading-relaxed">
                  {t('marketplace.step2Desc')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-blue-500/50">
                  <span className="text-lg luxe-title text-blue-400">3</span>
                </div>
                <h4 className="text-sm luxe-title text-neon-yellow mb-1">{t('marketplace.step3Title')}</h4>
                <p className="text-xs text-gray-400 font-normal leading-relaxed">
                  {t('marketplace.step3Desc')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-orange-500/50">
                  <span className="text-lg luxe-title text-orange-400">4</span>
                </div>
                <h4 className="text-sm luxe-title text-neon-yellow mb-1">{t('marketplace.step4Title')}</h4>
                <p className="text-xs text-gray-400 font-normal leading-relaxed">
                  {t('marketplace.step4Desc')}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-gray-400 font-normal">
                {t('marketplace.allTransactionsSecured')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Products Grid */}
        <div className={`flex justify-center mb-12 transition-all duration-500 ease-in-out ${
          isSearchFocused ? 'mt-0' : 'mt-0'
        }`}>
          {productsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-neon-yellow font-normal">{t('marketplace.loadingProducts')}</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl luxe-title text-neon-yellow mb-2">{t('marketplace.noProducts')}</h3>
              <p className="text-gray-400 font-normal max-w-md mx-auto">
                {searchTerm || searchFilters.query
                  ? t('marketplace.tryAdjustSearch')
                  : t('marketplace.noProductsAvailable')
                }
              </p>
              {(searchTerm || searchFilters.query) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSearchFilters({
                      query: '',
                      category: 'all',
                      priceMin: 0,
                      priceMax: 10000,
                      location: '',
                      seller: '',
                      verifiedOnly: false,
                      inStockOnly: true,
                      sortBy: 'relevance',
                      tags: [],
                    });
                  }}
                  className="mt-4 luxe-btn-primary px-6 py-3"
                >
                  {t('marketplace.clearFilters')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-6xl">
              {filteredProducts.map((product) => (
                <div key={product.id} className="luxe-glass rounded-xl overflow-hidden luxe-card group">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-44 sm:h-56 object-cover transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="luxe-glass px-3 py-1 rounded-full text-xs font-medium text-luxe-gold">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <h3 className="text-base sm:text-lg font-normal text-neon-yellow transition-colors line-clamp-2 text-center w-full font-medium">
                        {product.title}
                      </h3>
                    </div>

                    <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed font-normal text-center">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-center mb-3 sm:mb-4">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-xl sm:text-2xl luxe-title text-neon-yellow text-center font-semibold">
                          {product.price} GHETTO
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm text-gray-500 font-normal text-center">by</span>
                        <span className="text-sm font-normal text-gray-400 text-center font-medium">
                          {product.seller.name}
                        </span>
                        {product.seller.verified && (
                          <Shield className="w-4 h-4 text-neon-yellow" />
                        )}
                        <span className="text-sm font-normal text-yellow-400 text-center">★{product.seller.rating}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="luxe-btn-primary w-full py-2.5 sm:py-3 flex items-center justify-center space-x-2 font-normal text-center text-sm sm:text-base touch-friendly"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{t('product.addToCart')}</span>
                      </button>

                      <button
                        onClick={() => handleContactSeller(product.seller.id)}
                        className="luxe-btn-secondary w-full py-2 sm:py-2 flex items-center justify-center space-x-2 text-xs sm:text-sm font-normal text-center touch-friendly"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{t('product.contactSeller')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredProducts.length > 0 && (
          <div className="mt-16 text-center flex justify-center">
            <p className="text-gray-600 text-sm font-normal">
              {t('marketplace.showing')} {filteredProducts.length} {t('marketplace.of')} {allProducts.length} {t('marketplace.products')}
            </p>
          </div>
        )}
      </main>

    </>
  );
  return (
    <div className="min-h-screen bg-black">
      <MobileNetworkIndicator />
      <NetworkSwitchModal />

      {/* Header */}
      <header className={`luxe-glass-strong border-b border-white/10 sticky top-0 z-50 ios-safe-area-top ${
        isSocialPage ? 'bg-black/95' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between py-2 sm:py-3 lg:py-0 lg:h-16 gap-2 sm:gap-3 lg:gap-0">
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
                <GraffitiLogo size="xs" className="lg:hidden" />
                <GraffitiLogo size="header" className="hidden lg:block" />
              </Link>
            </div>

            {/* Search Bar - Compact on mobile, centered on desktop */}
            <div className="flex-1 lg:max-w-xl lg:mx-8">
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <input
                  type="text"
                  placeholder={isSocialPage ? t('marketplace.searchSocial') : t('marketplace.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-8 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-2.5 luxe-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-white placeholder-gray-500 text-xs sm:text-sm transition-all"
                />
                {!isSocialPage && (
                  <button
                  onClick={() => openModal('advancedSearch')}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-2 text-gray-500 hover:text-[#FFD700] transition-colors touch-friendly"
                  title={t('nav.advancedSearch')}
                >
                  <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                )}
              </div>
            </div>

            {/* Mobile User Menu - Only visible on mobile */}
            <div className="flex lg:hidden items-center flex-shrink-0">
              {user ? (
                <button
                  onClick={() => openModal('userProfile')}
                  className="p-1.5 luxe-glass rounded-lg hover:bg-white/10 transition-all touch-friendly"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-[#FFD700] to-[#FF8C00] rounded-full flex items-center justify-center">
                    <UserCircle className="w-4 h-4 text-black" />
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    openModal('auth');
                  }}
                  className="luxe-btn-primary px-3 py-1.5 text-xs touch-friendly"
                >
                  {t('auth.login')}
                </button>
              )}
            </div>

            {/* Navigation Icons - Hidden on mobile (shown in bottom nav), visible on desktop */}
            <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
              {issitemaster && (
                <Link
                  to="/sitemaster"
                  className="relative p-2 text-red-500 hover:text-red-400 transition-colors"
                  title={t('nav.sitemasterDashboard')}
                >
                  <Shield className="w-5 h-5" />
                </Link>
              )}
              <RealtimeNotificationSystem />
              <button
                onClick={() => openModal('messages')}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                title={t('nav.messages')}
              >
                <Mail className="w-5 h-5" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#22c55e] text-black text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {unreadMessageCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => openModal('wallet')}
                className="relative p-2 text-gray-400 hover:text-[#FFD700] transition-colors"
                title={t('nav.wallet')}
              >
                <Wallet className="w-5 h-5" />
              </button>
              <button
                onClick={() => openModal('orders')}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                title={t('nav.myOrders')}
              >
                <ShoppingBag className="w-5 h-5" />
              </button>
              <button
                onClick={() => openModal('sellerDashboard')}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                title={t('nav.sellerDashboard')}
              >
                <Briefcase className="w-5 h-5" />
              </button>

              <Link
                to="/social"
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                title={t('nav.social')}
              >
                <Globe className="w-5 h-5" />
              </Link>

              <button
                onClick={() => openModal('cart')}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                title={t('nav.shoppingCart')}
              >
                <ShoppingCart className="w-5 h-5" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FFD700] text-black text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {getItemCount()}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                  <button
                    onClick={() => openModal('userProfile')}
                    className="flex items-center space-x-2 p-2 luxe-glass rounded-lg hover:bg-white/10 transition-all"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-[#FFD700] to-[#FF8C00] rounded-full flex items-center justify-center">
                      <UserCircle className="w-4 h-4 text-black" />
                    </div>
                    <span className="hidden sm:inline text-white font-medium">{user.username}</span>
                  </button>
                  <button
                    onClick={logout}
                    className="luxe-btn-secondary px-3 sm:px-4 py-2 text-xs sm:text-sm"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    openModal('auth');
                  }}
                  className="luxe-btn-primary px-4 sm:px-6 py-2 text-sm flex-shrink-0"
                >
                  {t('auth.login')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      
      {/* Main Content with Routing */}
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<MarketplaceContent />} />
            <Route path="/social" element={<SocialPlatform searchTerm={searchTerm} setSearchTerm={setSearchTerm} />} />
            <Route path="/sitemaster" element={<EnhancedSitemasterDashboard />} />
            <Route path="/blockchain" element={<BlockchainManagement />} />
            <Route path="/treasurer" element={<TreasurerDashboard />} />
            <Route path="/mediator" element={<MediatorDashboard />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      {/* Mobile Bottom Navigation Spacer */}
      <div className="mobile-bottom-nav-spacer" />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={location.pathname === '/social' ? 'home' : 'home'}
        onNavigate={(view) => {
          switch (view) {
            case 'home':
              window.location.href = '/';
              break;
            case 'cart':
              openModal('cart');
              break;
            case 'wallet':
              openModal('wallet');
              break;
            case 'messages':
              openModal('messages');
              break;
            case 'profile':
              if (user) {
                openModal('userProfile');
              } else {
                setAuthMode('login');
                openModal('auth');
              }
              break;
          }
        }}
        cartItemCount={getItemCount()}
        unreadMessages={unreadMessageCount}
      />

      {/* Legal Items Notice - Above Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 sm:mb-12">
        <div className="max-w-4xl mx-auto">
          <div className="luxe-card border-[#FFD700]/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#FFEA00] to-[#FF8C00] rounded-lg flex items-center justify-center flex-shrink-0 luxe-glow-neon">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base luxe-subtitle luxe-text-neon mb-1">
                    <sup className="text-[#FFD700] mr-1">*</sup>{t('marketplace.legalItemsOnly')}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 font-light leading-relaxed">
                    {t('marketplace.legalItemsDesc')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => openModal('prohibitedItems')}
                className="luxe-btn-neon px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm w-full sm:w-auto"
              >
                {t('marketplace.viewPolicy')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="luxe-glass mt-8 sm:mt-12 lg:mt-16 border-t border-white/10 bg-gradient-to-b from-transparent to-gray-900/50 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* About Section */}
            <div className="text-center md:text-left md:col-span-1">
              <div className="flex items-center justify-center md:justify-start mb-3">
                <GraffitiLogo size="sm" />
              </div>
              <p className="text-xs font-bold leading-relaxed mb-3 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 bg-clip-text text-transparent" style={{textShadow: '0 0 20px rgba(255,255,255,0.3)'}}>
                {t('nav.footerAbout')}
              </p>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-xs">
                <Shield className="w-3 h-3 text-green-400" style={{filter: 'drop-shadow(0 0 10px rgba(74,222,128,0.5))'}} />
                <span className="font-bold bg-gradient-to-r from-green-300 to-green-400 bg-clip-text text-transparent">{t('nav.endToEndEncrypted')}</span>
              </div>
            </div>

            {/* Platform Section */}
            <div className="text-center md:text-left">
              <h4 className="font-black mb-3 text-xs uppercase tracking-wider bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255,255,255,0.5)'}}>{t('nav.platform')}</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.marketplace')}
                  </Link>
                </li>
                <li>
                  <Link to="/social" className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.socialNetwork')}
                  </Link>
                </li>
                <li>
                  <button onClick={() => openModal('sellerDashboard')} className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.sellerDashboard')}
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('wallet')} className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.wallet')}
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('orders')} className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.myOrders')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Support Section */}
            <div className="text-center md:text-left">
              <h4 className="font-black mb-3 text-xs uppercase tracking-wider bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255,255,255,0.5)'}}>{t('nav.support')}</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => openModal('faq')} className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.faq')}
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('contact')} className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.contactUs')}
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('legal')} className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.privacyPolicy')}
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('legal')} className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.terms')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources Section */}
            <div className="text-center md:text-left">
              <h4 className="font-black mb-3 text-xs uppercase tracking-wider bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255,255,255,0.5)'}}>{t('nav.resources')}</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => openModal('securityAudit')} className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.securityAudits')}
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('documentation')} className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.documentation')}
                  </button>
                </li>
                <li>
                  <a href="mailto:info@ghetto.finance" className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    {t('nav.businessInquiries')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Security & Trust Section */}
            <div className="text-center md:text-left">
              <h4 className="font-black mb-3 text-xs uppercase tracking-wider bg-gradient-to-br from-green-200 via-green-300 to-green-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(74,222,128,0.5)'}}>{t('nav.securityTrust')}</h4>
              <div className="space-y-2">
                <div className="flex items-start justify-center md:justify-start space-x-2">
                  <Shield className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" style={{filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.5))'}} />
                  <span className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent leading-tight">
                    {t('nav.aes256Encryption')}
                  </span>
                </div>
                <div className="flex items-start justify-center md:justify-start space-x-2">
                  <Shield className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" style={{filter: 'drop-shadow(0 0 8px rgba(96,165,250,0.5))'}} />
                  <span className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent leading-tight">
                    {t('nav.contractAudited')}
                  </span>
                </div>
                <div className="flex items-start justify-center md:justify-start space-x-2">
                  <Shield className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" style={{filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.5))'}} />
                  <span className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent leading-tight">
                    {t('nav.zeroKnowledgePrivacy')}
                  </span>
                </div>
                <div className="flex items-start justify-center md:justify-start space-x-2">
                  <Shield className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" style={{filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.5))'}} />
                  <span className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent leading-tight">
                    {t('nav.decentralized')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 pt-6">
            <div className="max-w-md mx-auto mb-6">
              <PWAInstallButton />
            </div>

            <div className="flex flex-col md:flex-row justify-center md:justify-between items-center space-y-3 md:space-y-0">
              <div className="flex items-center space-x-3">
                <p className="text-xs font-bold bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 bg-clip-text text-transparent" style={{textShadow: '0 0 20px rgba(255,255,255,0.3)'}}>
                  {getCopyrightNotice()}
                </p>
                <RealtimeStatusIndicator position="bottom-right" showLabel={false} compact={true} />
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <span className="flex items-center space-x-1.5">
                  <Shield className="w-3 h-3 text-gray-300" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
                  <span className="font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">{t('nav.blockchainSecured')}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <DollarSign className="w-3 h-3 text-gray-300" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
                  <span className="font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">{t('nav.multiCrypto')}</span>
                </span>
                <FooterLanguageSelector />
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Modals */}
      <AuthModal
        isOpen={isOpen('auth')}
        onClose={() => closeModal('auth')}
        initialMode={authMode}
      />
      <ErrorBoundary>
        <Suspense fallback={<div />}>
          <UserDashboard
            isOpen={isOpen('userProfile')}
            onClose={() => closeModal('userProfile')}
        />
        <BuyNowModal
          isOpen={isOpen('buyNow')}
          onClose={() => closeModal('buyNow')}
          product={getData('buyNow')}
        />
        <MakeOfferModal
          isOpen={isOpen('makeOffer')}
          onClose={() => closeModal('makeOffer')}
          product={getData('makeOffer')}
        />
        <ReportListingModal
          isOpen={isOpen('reportListing')}
          onClose={() => closeModal('reportListing')}
          product={getData('reportListing')}
        />
        <Cart
          isOpen={isOpen('cart')}
          onClose={() => closeModal('cart')}
        />
        <MessagingCenter
          isOpen={isOpen('messages')}
          onClose={() => closeModal('messages')}
        />
        <OrderManagement
          isOpen={isOpen('orders')}
          onClose={() => closeModal('orders')}
        />
        <SellerDashboard
          isOpen={isOpen('sellerDashboard')}
          onClose={() => closeModal('sellerDashboard')}
        />
        <WalletDashboard
          isOpen={isOpen('wallet')}
          onClose={() => closeModal('wallet')}
          initialTab={getData('wallet')?.initialTab}
        />
        <ProfileSetup
          isOpen={isOpen('profileSetup')}
          onClose={() => closeModal('profileSetup')}
        />
        <SocialHub
          isOpen={isOpen('socialHub')}
          onClose={() => closeModal('socialHub')}
        />
        <FAQ
          isOpen={isOpen('faq')}
          onClose={() => closeModal('faq')}
          onContactClick={() => {
            closeModal('faq');
            openModal('contact');
          }}
        />
        <LegalPage
          isOpen={isOpen('legal')}
          onClose={() => closeModal('legal')}
        />
        <ProhibitedItemsPage
          isOpen={isOpen('prohibitedItems')}
          onClose={() => closeModal('prohibitedItems')}
        />
        <ContactForm
          isOpen={isOpen('contact')}
          onClose={() => closeModal('contact')}
        />
        <AdvancedSearch
          isOpen={isOpen('advancedSearch')}
          onClose={() => closeModal('advancedSearch')}
          onSearch={handleAdvancedSearch}
        />
        <SecurityDashboard
          isOpen={isOpen('security')}
          onClose={() => closeModal('security')}
        />
        <SecurityAuditModal
          isOpen={isOpen('securityAudit')}
          onClose={() => closeModal('securityAudit')}
        />
        <DocumentationModal
          isOpen={isOpen('documentation')}
          onClose={() => closeModal('documentation')}
        />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;