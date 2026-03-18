import { useState } from 'react';
import { X, TrendingUp, DollarSign, Package, Users, Award, Search, Filter, Plus, AlertCircle } from 'lucide-react';
import { useSponsorship } from '../hooks/useSponsorship';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

interface SponsorshipMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'browse' | 'my-investments' | 'my-requests' | 'create-request' | 'invest';

interface SponsorshipRequest {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  amount_requested: number;
  revenue_percentage: number;
  duration_days: number;
  category: string;
  amount_funded: number;
  status: string;
  created_at: string;
  seller?: {
    username: string;
    reputation_score: number;
  };
}

export function SponsorshipMarketplace({ isOpen, onClose }: SponsorshipMarketplaceProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<SponsorshipRequest | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');

  const {
    requests,
    myInvestments,
    myRequests,
    isLoading,
    createRequest,
    investInRequest,
    cancelRequest,
    getRequestAnalytics
  } = useSponsorship();

  // Form state for creating new request
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    amount_requested: '',
    revenue_percentage: '',
    duration_days: '90',
    category: 'electronics'
  });

  if (!isOpen) return null;

  const categories = ['all', 'electronics', 'fashion', 'collectibles', 'digital', 'services', 'other'];

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || req.category === selectedCategory;
    return matchesSearch && matchesCategory && req.status === 'active';
  });

  const handleCreateRequest = async () => {
    try {
      await createRequest({
        title: newRequest.title,
        description: newRequest.description,
        amount_requested: parseFloat(newRequest.amount_requested),
        revenue_percentage: parseFloat(newRequest.revenue_percentage),
        duration_days: parseInt(newRequest.duration_days),
        category: newRequest.category
      });
      setViewMode('my-requests');
      setNewRequest({
        title: '',
        description: '',
        amount_requested: '',
        revenue_percentage: '',
        duration_days: '90',
        category: 'electronics'
      });
    } catch (error) {
      logger.error('Failed to create request', 'SponsorshipMarketplace', error);
    }
  };

  const handleInvest = async () => {
    if (!selectedRequest || !investmentAmount) return;

    try {
      await investInRequest(selectedRequest.id, parseFloat(investmentAmount));
      setViewMode('my-investments');
      setSelectedRequest(null);
      setInvestmentAmount('');
    } catch (error) {
      logger.error('Failed to invest', 'SponsorshipMarketplace', error);
    }
  };

  const calculateFundingPercentage = (request: SponsorshipRequest) => {
    return (request.amount_funded / request.amount_requested) * 100;
  };

  const calculateROI = (request: SponsorshipRequest, investmentAmount: number) => {
    const daysActive = request.duration_days;
    const estimatedSales = investmentAmount * 2; // Assume 2x selling limit
    const sponsorRevenue = estimatedSales * (request.revenue_percentage / 100);
    const roi = ((sponsorRevenue - investmentAmount) / investmentAmount) * 100;
    return roi.toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="luxe-glass-strong rounded-3xl border border-white/10 w-full max-w-7xl h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-luxe-green" />
            <h2 className="text-2xl font-black text-white uppercase">Sponsorship Marketplace</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:luxe-glass rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-88px)]">
          {/* Sidebar Navigation */}
          <div className="w-64 luxe-glass border-r border-white/10 p-6">
            <nav className="space-y-2">
              <button
                onClick={() => setViewMode('browse')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-3 ${
                  viewMode === 'browse' ? 'bg-luxe-green text-black' : 'text-gray-300 hover:luxe-glass'
                }`}
              >
                <Search className="w-5 h-5" />
                <span className="font-medium">Browse Requests</span>
              </button>

              <button
                onClick={() => setViewMode('my-investments')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-3 ${
                  viewMode === 'my-investments' ? 'bg-luxe-green text-black' : 'text-gray-300 hover:luxe-glass'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">My Investments</span>
              </button>

              <button
                onClick={() => setViewMode('my-requests')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-3 ${
                  viewMode === 'my-requests' ? 'bg-luxe-green text-black' : 'text-gray-300 hover:luxe-glass'
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="font-medium">My Requests</span>
              </button>

              <button
                onClick={() => setViewMode('create-request')}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-3 ${
                  viewMode === 'create-request' ? 'bg-luxe-gold text-black' : 'text-gray-300 hover:luxe-glass'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create Request</span>
              </button>
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 space-y-4">
              <div className="luxe-glass rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Active Requests</div>
                <div className="text-2xl font-black text-white">{requests.length}</div>
              </div>

              <div className="luxe-glass rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">My Investments</div>
                <div className="text-2xl font-black text-luxe-green">{myInvestments.length}</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Browse Requests View */}
            {viewMode === 'browse' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-white mb-4 uppercase">Available Sponsorship Opportunities</h3>
                  <p className="text-gray-400 mb-6">
                    Stake GHETTO tokens to sponsor sellers and earn a percentage of their revenue
                  </p>

                  {/* Search and Filter */}
                  <div className="flex space-x-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search sponsorship requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green text-white"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green text-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Request Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredRequests.map((request) => {
                    const fundingPercentage = calculateFundingPercentage(request);

                    return (
                      <div key={request.id} className="luxe-glass rounded-2xl border border-white/10 p-6 hover:border-luxe-green transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-black text-white mb-1">{request.title}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>@{request.seller?.username || 'Seller'}</span>
                              <Award className="w-4 h-4 ml-2 text-luxe-gold" />
                              <span>{request.seller?.reputation_score || 0} rep</span>
                            </div>
                          </div>
                          <div className="bg-luxe-green/20 text-luxe-green px-3 py-1 rounded-lg text-sm font-bold">
                            {request.revenue_percentage}% Revenue
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{request.description}</p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Requested</div>
                            <div className="text-white font-bold">{request.amount_requested.toLocaleString()} GHETTO</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Duration</div>
                            <div className="text-white font-bold">{request.duration_days} days</div>
                          </div>
                        </div>

                        {/* Funding Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Funding Progress</span>
                            <span className="text-white font-bold">{fundingPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 luxe-glass rounded-full overflow-hidden">
                            <div
                              className="h-full bg-luxe-green transition-all duration-300"
                              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {request.amount_funded.toLocaleString()} / {request.amount_requested.toLocaleString()} GHETTO
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setViewMode('invest');
                          }}
                          className="w-full px-4 py-3 bg-luxe-green hover:bg-luxe-green/80 text-black rounded-xl transition-colors font-bold"
                        >
                          Invest Now
                        </button>
                      </div>
                    );
                  })}
                </div>

                {filteredRequests.length === 0 && (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No sponsorship requests found</p>
                  </div>
                )}
              </div>
            )}

            {/* My Investments View */}
            {viewMode === 'my-investments' && (
              <div>
                <h3 className="text-2xl font-black text-white mb-6 uppercase">My Investments</h3>

                <div className="space-y-4">
                  {myInvestments.map((investment) => (
                    <div key={investment.id} className="luxe-glass rounded-2xl border border-white/10 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-black text-white mb-1">{investment.request?.title}</h4>
                          <div className="text-sm text-gray-400">
                            Invested {investment.amount.toLocaleString()} GHETTO
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-luxe-green text-2xl font-black">
                            {investment.revenue_earned.toLocaleString()} GHETTO
                          </div>
                          <div className="text-sm text-gray-400">Revenue Earned</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-gray-400 text-xs mb-1">Your Share</div>
                          <div className="text-white font-bold">{investment.percentage_share.toFixed(2)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs mb-1">Status</div>
                          <div className="text-luxe-green font-bold capitalize">{investment.status}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs mb-1">ROI</div>
                          <div className="text-luxe-gold font-bold">
                            {((investment.revenue_earned / investment.amount - 1) * 100).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {myInvestments.length === 0 && (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">No investments yet</p>
                    <button
                      onClick={() => setViewMode('browse')}
                      className="px-6 py-3 bg-luxe-green text-black rounded-xl font-bold hover:bg-luxe-green/80 transition-colors"
                    >
                      Browse Opportunities
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* My Requests View */}
            {viewMode === 'my-requests' && (
              <div>
                <h3 className="text-2xl font-black text-white mb-6 uppercase">My Sponsorship Requests</h3>

                <div className="space-y-4">
                  {myRequests.map((request) => {
                    const fundingPercentage = calculateFundingPercentage(request);

                    return (
                      <div key={request.id} className="luxe-glass rounded-2xl border border-white/10 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-black text-white mb-1">{request.title}</h4>
                            <p className="text-sm text-gray-400">{request.description}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                            request.status === 'funded' ? 'bg-luxe-green/20 text-luxe-green' :
                            request.status === 'active' ? 'bg-luxe-gold/20 text-luxe-gold' :
                            'luxe-glass text-gray-400'
                          }`}>
                            {request.status.toUpperCase()}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Requested</div>
                            <div className="text-white font-bold">{request.amount_requested.toLocaleString()} GHETTO</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Funded</div>
                            <div className="text-luxe-green font-bold">{request.amount_funded.toLocaleString()} GHETTO</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Revenue Share</div>
                            <div className="text-white font-bold">{request.revenue_percentage}%</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Duration</div>
                            <div className="text-white font-bold">{request.duration_days} days</div>
                          </div>
                        </div>

                        {/* Funding Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Funding Progress</span>
                            <span className="text-white font-bold">{fundingPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 luxe-glass rounded-full overflow-hidden">
                            <div
                              className="h-full bg-luxe-green transition-all duration-300"
                              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        {request.status === 'draft' && (
                          <button
                            onClick={() => cancelRequest(request.id)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-colors"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {myRequests.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">No requests created yet</p>
                    <button
                      onClick={() => setViewMode('create-request')}
                      className="px-6 py-3 bg-luxe-gold text-black rounded-xl font-bold hover:bg-luxe-gold/80 transition-colors"
                    >
                      Create Request
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Create Request View */}
            {viewMode === 'create-request' && (
              <div className="max-w-3xl mx-auto">
                <h3 className="text-2xl font-black text-white mb-6 uppercase">Create Sponsorship Request</h3>

                <div className="luxe-glass rounded-2xl border border-white/10 p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Request Title</label>
                    <input
                      type="text"
                      value={newRequest.title}
                      onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                      placeholder="e.g., Premium Electronics Inventory Expansion"
                      className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Description</label>
                    <textarea
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                      placeholder="Describe what you'll use the funds for and why sponsors should invest..."
                      rows={4}
                      className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Amount Requested (GHETTO)</label>
                      <input
                        type="number"
                        value={newRequest.amount_requested}
                        onChange={(e) => setNewRequest({ ...newRequest, amount_requested: e.target.value })}
                        placeholder="Minimum 100"
                        min="100"
                        className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Revenue Share (%)</label>
                      <input
                        type="number"
                        value={newRequest.revenue_percentage}
                        onChange={(e) => setNewRequest({ ...newRequest, revenue_percentage: e.target.value })}
                        placeholder="1-50"
                        min="1"
                        max="50"
                        className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Duration (Days)</label>
                      <select
                        value={newRequest.duration_days}
                        onChange={(e) => setNewRequest({ ...newRequest, duration_days: e.target.value })}
                        className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                      >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">365 days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Category</label>
                      <select
                        value={newRequest.category}
                        onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                        className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                      >
                        <option value="electronics">Electronics</option>
                        <option value="fashion">Fashion</option>
                        <option value="collectibles">Collectibles</option>
                        <option value="digital">Digital</option>
                        <option value="services">Services</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-luxe-gold/10 border border-luxe-gold/30 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-luxe-gold flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-300">
                        <p className="font-bold text-luxe-gold mb-1">How It Works:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-400">
                          <li>Sponsors stake GHETTO tokens to fund your request</li>
                          <li>Funded amount increases your selling limit by 2:1</li>
                          <li>Sponsors earn their agreed percentage from your sales revenue</li>
                          <li>Revenue splits are automatic through the escrow system</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleCreateRequest}
                      disabled={!newRequest.title || !newRequest.description || !newRequest.amount_requested || !newRequest.revenue_percentage}
                      className="flex-1 px-6 py-3 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-xl transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Request
                    </button>
                    <button
                      onClick={() => setViewMode('browse')}
                      className="px-6 py-3 luxe-glass hover:bg-gray-600 text-white rounded-xl transition-colors font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Invest View */}
            {viewMode === 'invest' && selectedRequest && (
              <div className="max-w-2xl mx-auto">
                <button
                  onClick={() => setViewMode('browse')}
                  className="text-gray-400 hover:text-white mb-6 flex items-center space-x-2"
                >
                  <span>← Back to Browse</span>
                </button>

                <h3 className="text-2xl font-black text-white mb-6 uppercase">Invest in Sponsorship</h3>

                <div className="luxe-glass rounded-2xl border border-white/10 p-6 space-y-6">
                  <div>
                    <h4 className="text-xl font-black text-white mb-2">{selectedRequest.title}</h4>
                    <p className="text-gray-300">{selectedRequest.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="luxe-glass rounded-xl p-4">
                      <div className="text-gray-400 text-sm mb-1">Revenue Share</div>
                      <div className="text-2xl font-black text-luxe-green">{selectedRequest.revenue_percentage}%</div>
                    </div>
                    <div className="luxe-glass rounded-xl p-4">
                      <div className="text-gray-400 text-sm mb-1">Duration</div>
                      <div className="text-2xl font-black text-white">{selectedRequest.duration_days} days</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Investment Amount (GHETTO)</label>
                    <input
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder="Enter amount to invest"
                      min="1"
                      max={selectedRequest.amount_requested - selectedRequest.amount_funded}
                      className="w-full px-4 py-3 luxe-glass border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green text-white"
                    />
                    <div className="text-sm text-gray-400 mt-1">
                      Available to fund: {(selectedRequest.amount_requested - selectedRequest.amount_funded).toLocaleString()} GHETTO
                    </div>
                  </div>

                  {investmentAmount && parseFloat(investmentAmount) > 0 && (
                    <div className="bg-luxe-green/10 border border-luxe-green/30 rounded-xl p-4">
                      <div className="text-sm font-bold text-luxe-green mb-2">Investment Summary</div>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex justify-between">
                          <span>Your Investment:</span>
                          <span className="font-bold">{parseFloat(investmentAmount).toLocaleString()} GHETTO</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Your Share:</span>
                          <span className="font-bold">
                            {((parseFloat(investmentAmount) / selectedRequest.amount_requested) * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated ROI:</span>
                          <span className="font-bold text-luxe-gold">
                            {calculateROI(selectedRequest, parseFloat(investmentAmount))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleInvest}
                    disabled={!investmentAmount || parseFloat(investmentAmount) <= 0}
                    className="w-full px-6 py-3 bg-luxe-green hover:bg-luxe-green/80 text-black rounded-xl transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Investment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
