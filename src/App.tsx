import React, { useState, useMemo } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Search, ShoppingCart, User, Wallet, TrendingUp, Package, MessageCircle, Store, CreditCard, Users, AtSign, Filter, Globe, Mail, DollarSign, ShoppingBag, Briefcase, UserCircle } from 'lucide-react';
import { AdvancedSearch, SearchFilters } from './components/AdvancedSearch';
import { GraffitiLogo } from './components/GraffitiLogo';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { Cart } from './components/Cart';
import { BuyNowModal } from './components/BuyNowModal';
import { MakeOfferModal } from './components/MakeOfferModal';
import { ReportListingModal } from './components/ReportListingModal';
import { MessagingCenter } from './components/MessagingCenter';
import { OrderManagement } from './components/OrderManagement';
import { SellerDashboard } from './components/SellerDashboard';
import { WalletDashboard } from './components/WalletDashboard';
import { EnhancedSitemasterDashboard } from './components/EnhancedSitemasterDashboard';
import { TreasurerDashboard } from './components/TreasurerDashboard';
import { MediatorDashboard } from './components/MediatorDashboard';
import { ProfileSetup } from './components/ProfileSetup';
import { SocialHub } from './components/SocialHub';
import { SocialPlatform } from './components/SocialPlatform';
import { SecurityDashboard } from './components/SecurityDashboard';
import { FAQ } from './components/FAQ';
import { LegalPage } from './components/LegalPage';
import { ContactForm } from './components/ContactForm';
import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useMessaging } from './hooks/useMessaging';
import { useSocialSystem } from './hooks/useSocialSystem';
import { useProducts } from './hooks/useProducts';
import { useSiteMaster } from './hooks/useSiteMaster';


function App() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showBuyNow, setShowBuyNow] = useState(false);
  const [showMakeOffer, setShowMakeOffer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showMessages, setShowMessages] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showSellerDashboard, setShowSellerDashboard] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showSiteMaster, setShowSiteMaster] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showSocialHub, setShowSocialHub] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showReportListing, setShowReportListing] = useState(false);
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
          console.error('Failed to load unread count:', error);
          setUnreadMessageCount(0);
        }
      } else {
        setUnreadMessageCount(0);
      }
    };

    loadUnreadCount();
  }, [user, getUnreadCount]);

  // Listen for showLegal event from AuthModal
  React.useEffect(() => {
    const handleShowLegal = () => {
      setShowLegal(true);
    };

    window.addEventListener('showLegal', handleShowLegal);

    return () => {
      window.removeEventListener('showLegal', handleShowLegal);
    };
  }, []);

  // Check if we're on the social platform page
  const isSocialPage = location.pathname === '/social';

  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter(product => {
      // Basic search term
      const matchesBasicSearch = searchTerm === '' || 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Advanced search filters
      const matchesAdvancedSearch = searchFilters.query === '' ||
        product.title.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
        product.description.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchFilters.query.toLowerCase()));
      
      const matchesCategory = searchFilters.category === 'all' || product.category === searchFilters.category;
      const matchesPrice = product.price >= searchFilters.priceMin && product.price <= searchFilters.priceMax;
      const matchesSeller = searchFilters.seller === '' || product.seller.name === searchFilters.seller;
      const matchesVerified = !searchFilters.verifiedOnly || product.seller.verified;
      const matchesStock = !searchFilters.inStockOnly || product.inStock;
      const matchesTags = searchFilters.tags.length === 0 || 
        searchFilters.tags.some(tag => product.tags.includes(tag));
      
      return matchesBasicSearch && matchesAdvancedSearch && matchesCategory && 
             matchesPrice && matchesSeller && matchesVerified && matchesStock && matchesTags;
    });

    // Apply sorting
    switch (searchFilters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => b.seller.rating - a.seller.rating);
        break;
      default:
        // Relevance - keep original order
        break;
    }

    return filtered;
  }, [searchTerm, searchFilters]);

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setSearchTerm(filters.query);
  };

  const handleAddToCart = (product: any) => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    addToCart(product);
  };

  const handleBuyNow = (product: any) => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    setSelectedProduct(product);
    setShowBuyNow(true);
  };

  const handleMakeOffer = (product: any) => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    setSelectedProduct(product);
    setShowMakeOffer(true);
  };

  const handleContactSeller = async (sellerId: string) => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    
    try {
      await createConversation(sellerId);
      setShowMessages(true);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleReportListing = (product: any) => {
    setSelectedProduct(product);
    setShowReportListing(true);
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
                <div className="text-sm apple-title text-neon-yellow">Smart Escrow</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow">Token Economy</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow">Disputes</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AtSign className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow">Stealth Mode</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow">Social Network</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow">Multi-Crypto</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow">Seller Protection</div>
              </div>

              <div className="glass-morphism rounded-apple p-4 text-center">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MessageCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-sm apple-title text-neon-yellow">Secure Messaging</div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="glass-morphism rounded-apple p-8 max-w-6xl mx-auto">
            <h2 className="text-3xl apple-title text-neon-blue text-center mb-8">HOW IT WORKS</h2>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-start">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-yellow-500/50">
                  <Wallet className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow mb-2">STEP 1</div>
                <p className="text-xs text-neon-orange apple-font leading-relaxed">
                  Seller deposits GHETTO collateral
                </p>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-yellow-500/50 to-green-500/50"></div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-green-500/50">
                  <ShoppingCart className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow mb-2">STEP 2</div>
                <p className="text-xs text-neon-orange apple-font leading-relaxed">
                  Buyer pays with crypto
                </p>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-green-500/50 to-blue-500/50"></div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-blue-500/50">
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow mb-2">STEP 3</div>
                <p className="text-xs text-neon-orange apple-font leading-relaxed">
                  Smart contract locks funds
                </p>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-orange-500/50"></div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-orange-500/50">
                  <Package className="w-8 h-8 text-orange-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow mb-2">STEP 4</div>
                <p className="text-xs text-neon-orange apple-font leading-relaxed">
                  Seller ships with tracking
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mt-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-cyan-500/50">
                  <User className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow mb-2">STEP 5</div>
                <p className="text-xs text-neon-orange apple-font leading-relaxed">
                  Buyer confirms delivery or auto-releases after 7 days
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-teal-500/50">
                  <TrendingUp className="w-8 h-8 text-teal-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow mb-2">STEP 6</div>
                <p className="text-xs text-neon-orange apple-font leading-relaxed">
                  Smart contract releases funds to seller automatically
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-red-500/50">
                  <AtSign className="w-8 h-8 text-red-400" />
                </div>
                <div className="text-xs apple-title text-neon-yellow mb-2">IF DISPUTE</div>
                <p className="text-xs text-neon-orange apple-font leading-relaxed">
                  Site master team resolves within 90 days based on evidence
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-apple-gray-400 apple-font max-w-2xl mx-auto leading-relaxed">
                All transactions are secured by blockchain smart contracts. Seller collateral and buyer payments are held until successful delivery.
                Platform fees: <span className="text-neon-yellow">2.5% with GHETTO</span> or <span className="text-neon-orange">3.75% with other crypto</span>.
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

      <footer className="glass-morphism mt-24 border-t border-white/10 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-6">
                <GraffitiLogo size="sm" />
              </div>
              <p className="text-sm font-bold leading-relaxed mb-6 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 bg-clip-text text-transparent" style={{textShadow: '0 0 20px rgba(255,255,255,0.3)'}}>
                Decentralized P2P marketplace with blockchain-powered escrow protection. Trade anything legal, anywhere.
              </p>
              <div className="flex space-x-4 justify-center md:justify-start">
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
            </div>

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
                  <button onClick={() => setShowSellerDashboard(true)} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Sell Products
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowWallet(true)} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Wallet
                  </button>
                </li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h4 className="font-black mb-6 text-sm uppercase tracking-wider bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255,255,255,0.5)'}}>Support</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => setShowFAQ(true)} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    FAQ
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowContact(true)} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Contact Us
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowLegal(true)} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowLegal(true)} className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h4 className="font-black mb-6 text-sm uppercase tracking-wider bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent" style={{textShadow: '0 0 30px rgba(255,255,255,0.5)'}}>Resources</h4>
              <ul className="space-y-3">
                <li className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">Smart Contracts</li>
                <li className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">Security Audits</li>
                <li className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">Documentation</li>
                <li>
                  <a href="mailto:info@ghetto.finance" className="text-sm font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent hover:from-white hover:to-gray-200 transition-all">
                    Business Inquiries
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-center md:justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm font-bold bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 bg-clip-text text-transparent" style={{textShadow: '0 0 20px rgba(255,255,255,0.3)'}}>
                &copy; 2025 GHETTO FINANCE. All rights reserved.
              </p>
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
    </>
  );
  return (
    <div className="min-h-screen bg-apple-gray-950">
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
                  onClick={() => setShowAdvancedSearch(true)}
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
              <button
                onClick={() => setShowMessages(true)}
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
                onClick={() => setShowWallet(true)}
                className="relative p-2 text-apple-gray-500 hover:text-white apple-hover"
                title="Wallet"
              >
                <Wallet className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowOrders(true)}
                className="relative p-2 text-apple-gray-500 hover:text-white apple-hover"
                title="My Orders"
              >
                <ShoppingBag className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSellerDashboard(true)}
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
                onClick={() => setShowCart(true)}
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
                    onClick={() => setShowUserProfile(true)}
                    className="flex items-center space-x-2 p-2 glass-morphism rounded-apple apple-hover"
                  >
                    <div className="w-8 h-8 bg-apple-blue rounded-full flex items-center justify-center">
                      <UserCircle className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-white apple-font">{user.username}</span>
                  </button>
                  {issitemaster && (
                    <div className="flex items-center justify-center p-2" title="Sitemaster">
                      <Shield className="w-5 h-5 text-red-500" />
                    </div>
                  )}
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
                    setShowAuthModal(true);
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
      <Routes>
        <Route path="/" element={<MarketplaceContent />} />
        <Route path="/social" element={<SocialPlatform searchTerm={searchTerm} setSearchTerm={setSearchTerm} />} />
        <Route path="/sitemaster" element={<EnhancedSitemasterDashboard />} />
        <Route path="/treasurer" element={<TreasurerDashboard />} />
        <Route path="/mediator" element={<MediatorDashboard />} />
      </Routes>
      
      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
      <UserDashboard
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
      <BuyNowModal 
        isOpen={showBuyNow} 
        onClose={() => setShowBuyNow(false)}
        product={selectedProduct}
      />
      <MakeOfferModal 
        isOpen={showMakeOffer} 
        onClose={() => setShowMakeOffer(false)}
        product={selectedProduct}
      />
      <ReportListingModal 
        isOpen={showReportListing} 
        onClose={() => setShowReportListing(false)}
        product={selectedProduct}
      />
    <Cart 
      isOpen={showCart} 
      onClose={() => setShowCart(false)}
    />
    <MessagingCenter 
      isOpen={showMessages} 
      onClose={() => setShowMessages(false)}
    />
    <OrderManagement 
      isOpen={showOrders} 
      onClose={() => setShowOrders(false)}
    />
    <SellerDashboard 
      isOpen={showSellerDashboard} 
      onClose={() => setShowSellerDashboard(false)}
    />
    <WalletDashboard 
      isOpen={showWallet} 
      onClose={() => setShowWallet(false)}
    />
    <ProfileSetup 
      isOpen={showProfileSetup} 
      onClose={() => setShowProfileSetup(false)}
    />
    <SocialHub 
      isOpen={showSocialHub} 
      onClose={() => setShowSocialHub(false)}
    />
    <FAQ 
      isOpen={showFAQ} 
      onClose={() => setShowFAQ(false)}
      onContactClick={() => {
        setShowFAQ(false);
        setShowContact(true);
      }}
    />
    <LegalPage 
      isOpen={showLegal} 
      onClose={() => setShowLegal(false)}
    />
    <ContactForm 
      isOpen={showContact} 
      onClose={() => setShowContact(false)}
    />
    <AdvancedSearch 
      isOpen={showAdvancedSearch} 
      onClose={() => setShowAdvancedSearch(false)}
      onSearch={handleAdvancedSearch}
    />
    <SecurityDashboard
      isOpen={showSecurity}
      onClose={() => setShowSecurity(false)}
    />
    </div>
  );
}

export default App;