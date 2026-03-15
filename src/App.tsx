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
const ContactForm = lazy(() => import('./components/ContactForm').then(m => ({ default: m.ContactForm })));
const BlockchainManagement = lazy(() => import('./components/BlockchainManagement').then(m => ({ default: m.BlockchainManagement })));
import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useMessaging } from './hooks/useMessaging';
import { useSocialSystem } from './hooks/useSocialSystem';
import { useProducts } from './hooks/useProducts';
import { useSiteMaster } from './hooks/useSiteMaster';
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

  const { user, logout } = useAuth();
  const { addToCart, getItemCount } = useCart();
  const { getUnreadCount, createConversation } = useMessaging();
  const { getUserProfile } = useSocialSystem();
  const { products: allProducts, isLoading: productsLoading, loadProducts } = useProducts();
  const { issitemaster } = useSiteMaster();
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
      <main className={`max-w-7xl mx-auto px-6 transition-all duration-500 ease-in-out ${
        isSearchFocused ? 'pt-4 pb-16' : 'py-16'
      }`}>
        {/* Comprehensive Features Section */}
        <div className={`transition-all duration-500 ease-in-out ${
          isSearchFocused ? 'h-0 mb-0 opacity-0 overflow-hidden pointer-events-none' : 'mb-16 opacity-100'
        }`}>
          <div className="text-center mb-8">
            <h1 className="text-5xl apple-title text-neon-yellow mb-4">SECURE P2P MARKETPLACE</h1>
            <p className="text-xl text-neon-orange apple-font max-w-4xl mx-auto leading-relaxed">
              TRADE ANYTHING LEGAL WITH CRYPTO. MODERATED ESCROW PROTECTION. STEALTH OPTIONS. BUILT-IN SOCIAL NETWORK.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
            <div className="glass-morphism rounded-apple p-4 text-center">
              <div className="text-3xl apple-title text-neon-blue mb-1">$2.5M+</div>
              <div className="text-xs text-apple-gray-400 apple-font uppercase">Total Volume Secured</div>
            </div>
            <div className="glass-morphism rounded-apple p-4 text-center">
              <div className="text-3xl apple-title text-green-400 mb-1">15,000+</div>
              <div className="text-xs text-apple-gray-400 apple-font uppercase">Successful Trades</div>
            </div>
            <div className="glass-morphism rounded-apple p-4 text-center">
              <div className="text-3xl apple-title text-neon-yellow mb-1">48hrs</div>
              <div className="text-xs text-apple-gray-400 apple-font uppercase">Avg Dispute Resolution</div>
            </div>
            <div className="glass-morphism rounded-apple p-4 text-center">
              <div className="text-3xl apple-title text-orange-400 mb-1">500K+</div>
              <div className="text-xs text-apple-gray-400 apple-font uppercase">GHETTO Collateral Locked</div>
            </div>
          </div>

          {/* Main Feature Cards - Simplified */}
          <div className="mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow leading-tight">Advanced Smart Escrow Function Facilitates Safe Transactions</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow leading-tight">Gasless Transfers and Lower Fees With GHETTO</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow leading-tight">Moderated Dispute Resolution By Trained Specialists</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AtSign className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow leading-tight">Stealth Options For Users and Full Privacy</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow leading-tight">Dedicated Community Hub</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow leading-tight">Crypto Native with DEX's and Ease of Use</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow leading-tight">Seller Protection and Best-in-Class Fees</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MessageCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow leading-tight">Military Grade Encryption and Security Across All Features, including Messaging</div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="glass-morphism rounded-apple p-8 max-w-6xl mx-auto">
            <h2 className="text-3xl apple-title text-neon-blue text-center mb-8">HOW IT WORKS</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass-morphism rounded-apple p-6">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-yellow-500/50">
                  <ShoppingCart className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow mb-3 text-center">STEP 1</div>
                <p className="text-sm text-neon-orange apple-font leading-relaxed text-center">
                  Buyer selects items they want to buy
                </p>
              </div>

              <div className="glass-morphism rounded-apple p-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500/50">
                  <Wallet className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow mb-3 text-center">STEP 2</div>
                <p className="text-sm text-neon-orange apple-font leading-relaxed text-center">
                  Buyer pays with crypto of seller's choice as listed, or buyer can use connected DEX to swap their tokens for that of seller's preference. <span className="text-neon-yellow font-semibold">GHETTO is gas-free and cheaper!</span>
                </p>
              </div>

              <div className="glass-morphism rounded-apple p-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-500/50">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow mb-3 text-center">STEP 3</div>
                <p className="text-sm text-neon-orange apple-font leading-relaxed text-center">
                  Buyer's funds get held in escrow smart contract, and holds seller collateral for the same amount as required prior to listing item
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-morphism rounded-apple p-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-500/50">
                  <Package className="w-8 h-8 text-orange-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow mb-3 text-center">STEP 4</div>
                <p className="text-sm text-neon-orange apple-font leading-relaxed text-center">
                  Seller ships or delivers item with tracking, if available
                </p>
              </div>

              <div className="glass-morphism rounded-apple p-6">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-cyan-500/50">
                  <User className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow mb-3 text-center">STEP 5</div>
                <p className="text-sm text-neon-orange apple-font leading-relaxed text-center">
                  Buyer confirms delivery or disputes for moderation. An official member of the moderation team will review the case and release the funds held in escrow in full or in part to the correct side
                </p>
              </div>

              <div className="glass-morphism rounded-apple p-6">
                <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-teal-500/50">
                  <TrendingUp className="w-8 h-8 text-teal-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow mb-3 text-center">STEP 6</div>
                <p className="text-sm text-neon-orange apple-font leading-relaxed text-center">
                  If all's good, funds are released to the seller, and everyone can continue on their merry way!
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-apple-gray-400 apple-font max-w-3xl mx-auto leading-relaxed">
                <span className="text-neon-yellow font-semibold">All transactions are 100% secured, and moderated by trained specialists for integrity.</span>
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
              <span className="ml-3 text-neon-yellow apple-font">Loading products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl apple-title text-neon-yellow mb-2">No products found</h3>
              <p className="text-neon-orange apple-font max-w-md mx-auto">
                {searchTerm || searchFilters.query 
                  ? 'Try adjusting your search terms or filters'
                  : 'No products are currently available. Check back soon!'
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
                  className="mt-4 btn-apple-primary px-6 py-3"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl">
              {filteredProducts.map((product) => (
                <div key={product.id} className="glass-morphism rounded-apple overflow-hidden apple-card group">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-56 object-cover transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="glass-morphism px-3 py-1 rounded-full text-xs font-medium text-apple-blue">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg apple-font text-neon-yellow transition-colors line-clamp-2 text-center w-full font-medium">
                        {product.title}
                      </h3>
                    </div>
                    
                    <p className="text-neon-orange text-sm mb-4 line-clamp-2 leading-relaxed apple-font text-center">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl apple-title text-neon-yellow text-center font-semibold">
                          {product.price} GHETTO
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm text-apple-gray-500 apple-font text-center">by</span>
                        <span className="text-sm apple-font text-neon-orange text-center font-medium">
                          {product.seller.name}
                        </span>
                        {product.seller.verified && (
                          <Shield className="w-4 h-4 text-apple-blue" />
                        )}
                        <span className="text-sm apple-font text-apple-yellow text-center">★{product.seller.rating}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="btn-apple-primary w-full py-3 flex items-center justify-center space-x-2 apple-font text-center"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                      
                      <button 
                        onClick={() => handleContactSeller(product.seller.id)}
                        className="btn-apple-secondary w-full py-2 flex items-center justify-center space-x-2 text-sm apple-font text-center"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Contact Seller</span>
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
            <p className="text-apple-gray-600 text-sm apple-font">
              Showing {filteredProducts.length} of {allProducts.length} products
            </p>
          </div>
        )}
      </main>

    </>
  );
  return (
    <div className="min-h-screen bg-apple-gray-950">
      <MobileNetworkIndicator />
      <NetworkSwitchModal />

      {/* Header */}
      <header className={`glass-morphism border-b border-white/10 sticky top-0 z-50 ${
        isSocialPage ? 'bg-gray-900/95' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center h-20">
            <div className="flex items-center justify-center flex-1">
              <div className="flex items-center space-x-3 justify-center">
                <Link to="/" className="flex items-center space-x-3">
                  <GraffitiLogo size="sm" />
                </Link>
              </div>
            </div>

            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-apple-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder={isSocialPage ? "Search posts, communities, users..." : "Search products and services"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full min-w-[600px] pl-12 pr-16 py-3 glass-morphism rounded-apple focus:outline-none apple-focus text-white placeholder-apple-gray-500 text-sm apple-font"
                />
                {!isSocialPage && (
                  <button
                  onClick={() => openModal('advancedSearch')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-apple-gray-500 hover:text-apple-blue apple-hover"
                  title="Advanced Search"
                >
                  <Filter className="w-4 h-4" />
                </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center space-x-6 flex-1">
              {issitemaster && (
                <Link
                  to="/sitemaster"
                  className="relative p-2 text-red-500 hover:text-red-400 apple-hover"
                  title="Sitemaster Dashboard"
                >
                  <Shield className="w-5 h-5" />
                </Link>
              )}
              <RealtimeNotificationSystem />
              <button
                onClick={() => openModal('messages')}
                className="relative p-2 text-apple-gray-500 hover:text-white apple-hover"
                title="Messages"
              >
                <Mail className="w-5 h-5" />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-apple-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    {unreadMessageCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => openModal('wallet')}
                className="relative p-2 text-apple-gray-500 hover:text-white apple-hover"
                title="Wallet"
              >
                <Wallet className="w-5 h-5" />
              </button>
              <button
                onClick={() => openModal('orders')}
                className="relative p-2 text-apple-gray-500 hover:text-white apple-hover"
                title="My Orders"
              >
                <ShoppingBag className="w-5 h-5" />
              </button>
              <button
                onClick={() => openModal('sellerDashboard')}
                className="relative p-2 text-apple-gray-500 hover:text-white apple-hover"
                title="Seller Dashboard"
              >
                <Briefcase className="w-5 h-5" />
              </button>

              <Link
                to="/social"
                className="relative p-2 text-apple-gray-500 hover:text-white apple-hover"
                title="Social Platform"
              >
                <Globe className="w-5 h-5" />
              </Link>

              <button
                onClick={() => openModal('cart')}
                className="relative p-2 text-apple-gray-500 hover:text-white apple-hover"
                title="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-apple-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    {getItemCount()}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => openModal('userProfile')}
                    className="flex items-center space-x-2 p-2 glass-morphism rounded-apple apple-hover"
                  >
                    <div className="w-8 h-8 bg-apple-blue rounded-full flex items-center justify-center">
                      <UserCircle className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-white apple-font">{user.username}</span>
                  </button>
                  <button
                    onClick={logout}
                    className="btn-apple-secondary px-4 py-2 text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    openModal('auth');
                  }}
                  className="btn-apple-primary px-6 py-2"
                >
                  Login
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

      {/* Global Footer */}
      <footer className="glass-morphism mt-24 border-t border-white/10 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
            {/* About Section */}
            <div className="text-center md:text-left md:col-span-1">
              <div className="flex items-center justify-center md:justify-start mb-6">
                <GraffitiLogo size="sm" />
              </div>
              <p className="text-sm font-bold leading-relaxed mb-6 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 bg-clip-text text-transparent" style={{textShadow: '0 0 20px rgba(255,255,255,0.3)'}}>
                Decentralized P2P marketplace with blockchain-powered escrow protection and military-grade encryption.
              </p>
              <div className="flex space-x-4 justify-center md:justify-start mb-6">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <Globe className="w-5 h-5 text-gray-400" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <Mail className="w-5 h-5 text-gray-400" />
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-xs">
                <Shield className="w-4 h-4 text-green-400" style={{filter: 'drop-shadow(0 0 10px rgba(74,222,128,0.5))'}} />
                <span className="font-bold bg-gradient-to-r from-green-300 to-green-400 bg-clip-text text-transparent">End-to-End Encrypted</span>
              </div>
            </div>

            {/* Platform Section */}
            <div className="text-center md:text-left">
              <h4 className="font-black mb-6 text-sm uppercase tracking-wider bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255,255,255,0.5)'}}>Platform</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link to="/social" className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Social Network
                  </Link>
                </li>
                <li>
                  <button onClick={() => openModal('sellerDashboard')} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Seller Dashboard
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('wallet')} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Wallet
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('orders')} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    My Orders
                  </button>
                </li>
              </ul>
            </div>

            {/* Support Section */}
            <div className="text-center md:text-left">
              <h4 className="font-black mb-6 text-sm uppercase tracking-wider bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255,255,255,0.5)'}}>Support</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => openModal('faq')} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    FAQ
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('contact')} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Contact Us
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('legal')} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('legal')} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources Section */}
            <div className="text-center md:text-left">
              <h4 className="font-black mb-6 text-sm uppercase tracking-wider bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255,255,255,0.5)'}}>Resources</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => openModal('securityAudit')} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Security Audits
                  </button>
                </li>
                <li>
                  <button onClick={() => openModal('documentation')} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Documentation
                  </button>
                </li>
                <li>
                  <a href="mailto:info@ghetto.finance" className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Business Inquiries
                  </a>
                </li>
              </ul>
            </div>

            {/* Security & Trust Section */}
            <div className="text-center md:text-left">
              <h4 className="font-black mb-6 text-sm uppercase tracking-wider bg-gradient-to-br from-green-200 via-green-300 to-green-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(74,222,128,0.5)'}}>Security & Trust</h4>
              <div className="space-y-4">
                <div className="flex items-start justify-center md:justify-start space-x-2">
                  <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" style={{filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.5))'}} />
                  <span className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent leading-tight">
                    Military-Grade AES-256 Encryption
                  </span>
                </div>
                <div className="flex items-start justify-center md:justify-start space-x-2">
                  <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" style={{filter: 'drop-shadow(0 0 8px rgba(96,165,250,0.5))'}} />
                  <span className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent leading-tight">
                    Smart Contract Audited
                  </span>
                </div>
                <div className="flex items-start justify-center md:justify-start space-x-2">
                  <Shield className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" style={{filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.5))'}} />
                  <span className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent leading-tight">
                    Zero-Knowledge Privacy
                  </span>
                </div>
                <div className="flex items-start justify-center md:justify-start space-x-2">
                  <Shield className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" style={{filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.5))'}} />
                  <span className="text-xs font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent leading-tight">
                    Decentralized Infrastructure
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 pt-8">
            <div className="max-w-md mx-auto mb-8">
              <PWAInstallButton />
            </div>

            <div className="flex flex-col md:flex-row justify-center md:justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <p className="text-sm font-bold bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 bg-clip-text text-transparent" style={{textShadow: '0 0 20px rgba(255,255,255,0.3)'}}>
                  {getCopyrightNotice()}
                </p>
                <RealtimeStatusIndicator position="bottom-right" showLabel={false} compact={true} />
              </div>
              <div className="flex items-center space-x-6 text-xs">
                <span className="flex items-center space-x-2">
                  <Shield className="w-3 h-3 text-gray-300" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
                  <span className="font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">Secured by Blockchain</span>
                </span>
                <span className="flex items-center space-x-2">
                  <DollarSign className="w-3 h-3 text-gray-300" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
                  <span className="font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">Multi-Crypto Payments</span>
                </span>
                <span className="flex items-center space-x-2">
                  <Globe className="w-3 h-3 text-gray-300" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
                  <span className="font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">Global Marketplace</span>
                </span>
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