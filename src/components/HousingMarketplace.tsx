import React, { useState } from 'react';
import { Home, MapPin, Heart, TrendingUp, Users, DollarSign, Building, Globe, X, ChevronRight, CheckCircle, Clock, Hammer, HelpCircle, Award } from 'lucide-react';
import { useHousingMarketplace } from '../hooks/useHousingMarketplace';
import { HousingFAQ } from './HousingFAQ';
import type { HousingProject } from '../types/housing';

export function HousingMarketplace() {
  const { projects, myNFTs, loading, purchaseNFT } = useHousingMarketplace();
  const [selectedProject, setSelectedProject] = useState<HousingProject | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeView, setActiveView] = useState<'marketplace' | 'faq'>('marketplace');

  const countries = ['USA', 'Egypt', 'Cambodia', 'Thailand', 'South Africa', 'India'];
  const usaCities = ['Detroit', 'Appalachia', 'Los Angeles', 'San Francisco', 'New Orleans'];

  const filteredProjects = projects.filter(p => {
    if (filterCountry !== 'all' && p.location_country !== filterCountry) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  const handlePurchase = async (projectId: string, price: number) => {
    const success = await purchaseNFT(projectId, price);
    if (success) {
      alert('NFT purchased successfully! Thank you for your support in changing lives.');
      setSelectedProject(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-500';
      case 'fundraising': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <Clock className="w-4 h-4" />;
      case 'fundraising': return <DollarSign className="w-4 h-4" />;
      case 'in_progress': return <Hammer className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-neon-yellow border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="relative">
              <Home className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-neon-yellow" />
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500 absolute -bottom-2 -right-2 animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 bg-gradient-to-r from-neon-yellow via-neon-orange to-neon-yellow bg-clip-text text-transparent uppercase px-2">
            Housing NFT Marketplace
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-4 sm:mb-6 px-4">
            Purchase NFTs that sponsor housing rehabilitation and construction in impoverished communities worldwide.
            Each NFT represents a partnership opportunity with families seeking a path out of poverty.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 text-sm max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center sm:justify-start space-x-2 bg-gray-800/50 p-3 rounded-lg">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-neon-blue flex-shrink-0" />
              <span className="text-gray-300 text-xs sm:text-sm">Global Impact</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start space-x-2 bg-gray-800/50 p-3 rounded-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-neon-green flex-shrink-0" />
              <span className="text-gray-300 text-xs sm:text-sm">Direct Partnerships</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start space-x-2 bg-gray-800/50 p-3 rounded-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-neon-orange flex-shrink-0" />
              <span className="text-gray-300 text-xs sm:text-sm">85/10/5 Revenue Split</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start space-x-2 bg-gray-800/50 p-3 rounded-lg">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-neon-yellow flex-shrink-0" />
              <span className="text-gray-300 text-xs sm:text-sm">Lifetime Fee Waiver</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 px-4 max-w-md mx-auto">
            <button
              onClick={() => setActiveView('marketplace')}
              className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-black transition-all duration-300 min-h-[44px] ${
                activeView === 'marketplace'
                  ? 'bg-gradient-to-r from-neon-yellow to-neon-orange text-black shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
              }`}
            >
              <Building className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Browse Projects</span>
            </button>
            <button
              onClick={() => setActiveView('faq')}
              className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-black transition-all duration-300 min-h-[44px] ${
                activeView === 'faq'
                  ? 'bg-gradient-to-r from-neon-yellow to-neon-orange text-black shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
              }`}
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">FAQ & Info</span>
            </button>
          </div>
        </div>

        {activeView === 'faq' ? (
          <HousingFAQ />
        ) : (
          <>
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center justify-between bg-gray-900/50 p-4 sm:p-6 rounded-2xl border border-gray-700">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-neon-yellow focus:border-transparent min-h-[44px]"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-neon-yellow focus:border-transparent min-h-[44px]"
            >
              <option value="all">All Status</option>
              <option value="fundraising">Fundraising</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="text-neon-yellow font-bold text-sm sm:text-base text-center sm:text-left">
            {filteredProjects.length} Projects Available
          </div>
        </div>

        {myNFTs.length > 0 && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-2xl border border-green-500/30">
            <div className="flex items-center space-x-3 mb-2">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              <h3 className="text-lg sm:text-xl font-black text-white">Your Impact</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              You own {myNFTs.length} NFT{myNFTs.length > 1 ? 's' : ''} and are actively making a difference!
              Thank you for your generosity.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => setSelectedProject(project)}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <Building className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No projects match your filters</p>
          </div>
        )}

        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onPurchase={handlePurchase}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        )}
      </>
        )}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: HousingProject;
  onSelect: () => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

function ProjectCard({ project, onSelect, getStatusColor, getStatusIcon }: ProjectCardProps) {
  const fundingPercentage = (project.funds_raised / project.estimated_cost) * 100;
  const nftsAvailable = project.total_nft_supply - project.nfts_sold;

  return (
    <div
      onClick={onSelect}
      className="group relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 hover:border-neon-yellow active:border-neon-orange transition-all duration-300 cursor-pointer transform hover:scale-105 active:scale-100"
    >
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
        {project.property_images.length > 0 ? (
          <img
            src={project.property_images[0]}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building className="w-12 h-12 sm:w-16 sm:h-16 text-gray-700" />
          </div>
        )}

        <div className={`absolute top-2 right-2 sm:top-4 sm:right-4 px-2 py-1 sm:px-3 sm:py-1 ${getStatusColor(project.status)} rounded-full flex items-center space-x-1 sm:space-x-2 text-white text-xs font-bold`}>
          {getStatusIcon(project.status)}
          <span className="uppercase text-[10px] sm:text-xs">{project.status.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-neon-yellow transition-colors">
            {project.title}
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">{project.location_city}, {project.location_country}</span>
        </div>

        <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="mb-3 sm:mb-4">
          <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
            <span className="text-gray-400">Funding Progress</span>
            <span className="text-neon-yellow font-bold">{fundingPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-yellow to-neon-orange transition-all duration-500"
              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-800">
          <div>
            <div className="text-[10px] sm:text-xs text-gray-500 uppercase">NFT Price</div>
            <div className="text-base sm:text-lg font-black text-neon-yellow">${project.nft_price}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Available</div>
            <div className="text-base sm:text-lg font-black text-white">{nftsAvailable}/{project.total_nft_supply}</div>
          </div>
        </div>

        <button className="w-full mt-3 sm:mt-4 px-4 py-3 bg-gradient-to-r from-neon-yellow to-neon-orange text-black font-black rounded-lg hover:shadow-lg hover:shadow-neon-yellow/50 active:shadow-neon-orange/50 transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base min-h-[44px]">
          <span>View Details</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ProjectDetailModalProps {
  project: HousingProject;
  onClose: () => void;
  onPurchase: (projectId: string, price: number) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

function ProjectDetailModal({ project, onClose, onPurchase, getStatusColor, getStatusIcon }: ProjectDetailModalProps) {
  const fundingPercentage = (project.funds_raised / project.estimated_cost) * 100;
  const nftsAvailable = project.total_nft_supply - project.nfts_sold;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-none sm:rounded-3xl max-w-4xl w-full border-0 sm:border border-gray-700 shadow-2xl min-h-screen sm:min-h-0 sm:my-8">
        <div className="relative aspect-video sm:aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-t-none sm:rounded-t-3xl overflow-hidden">
          {project.property_images.length > 0 ? (
            <img
              src={project.property_images[0]}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-700" />
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2.5 sm:p-2 bg-black/70 hover:bg-black active:bg-black rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 px-3 py-1.5 sm:px-4 sm:py-2 ${getStatusColor(project.status)} rounded-full flex items-center space-x-1.5 sm:space-x-2 text-white font-bold text-xs sm:text-sm`}>
            {getStatusIcon(project.status)}
            <span className="uppercase">{project.status.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 sm:mb-4">{project.title}</h2>

          <div className="flex items-center space-x-2 text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">{project.location_city}, {project.location_region && `${project.location_region}, `}{project.location_country}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-800 rounded-xl p-3 sm:p-4">
              <div className="text-gray-400 text-xs sm:text-sm mb-1">Project Type</div>
              <div className="text-white font-black capitalize text-sm sm:text-base">{project.property_type}</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 sm:p-4">
              <div className="text-gray-400 text-xs sm:text-sm mb-1">Total Cost</div>
              <div className="text-neon-yellow font-black text-sm sm:text-base">${project.estimated_cost.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 sm:p-4">
              <div className="text-gray-400 text-xs sm:text-sm mb-1">Funds Raised</div>
              <div className="text-neon-green font-black text-sm sm:text-base">${project.funds_raised.toLocaleString()}</div>
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-gray-400">Funding Progress</span>
              <span className="text-neon-yellow font-bold">{fundingPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 sm:h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-yellow to-neon-orange"
                style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-green-900/30 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-blue-500/30">
            <h3 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3 flex items-center space-x-2">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              <span>Impact Story</span>
            </h3>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              {project.impact_story || project.description}
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-black text-white mb-3 sm:mb-4">NFT Details</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="text-gray-400 text-xs sm:text-sm mb-1">Price per NFT</div>
                <div className="text-lg sm:text-xl md:text-2xl font-black text-neon-yellow">${project.nft_price}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs sm:text-sm mb-1">Available</div>
                <div className="text-lg sm:text-xl md:text-2xl font-black text-white">{nftsAvailable}/{project.total_nft_supply}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs sm:text-sm mb-1">Ownership per NFT</div>
                <div className="text-base sm:text-lg font-black text-neon-blue">
                  {((1 / project.total_nft_supply) * 100).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs sm:text-sm mb-1">NFTs Sold</div>
                <div className="text-base sm:text-lg font-black text-neon-green">{project.nfts_sold}</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <h4 className="text-blue-200 font-black mb-2 flex items-center space-x-2 text-sm sm:text-base">
              <Heart className="w-4 h-4" />
              <span>What You're Purchasing</span>
            </h4>
            <p className="text-blue-100 text-xs sm:text-sm mb-2">
              <strong>Revenue-Sharing Rights:</strong> You are purchasing revenue-sharing rights, NOT property ownership. The platform retains ownership of all properties to ensure long-term sustainability and tenant security.
            </p>
            <p className="text-blue-100 text-xs sm:text-sm">
              Your NFT gives you the right to receive <strong>10% of revenue</strong> generated when your partnered tenant sells goods or services through our platform.
            </p>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <h4 className="text-yellow-200 font-black mb-2 flex items-center space-x-2 text-sm sm:text-base">
              <TrendingUp className="w-4 h-4" />
              <span>Partnership & Revenue Model</span>
            </h4>
            <p className="text-yellow-100 text-xs sm:text-sm mb-3">
              Tenants offer their skills, goods, or services through the platform. Revenue is shared to maximize tenant success:
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-green-900/30 p-2 sm:p-3 rounded text-center">
                <div className="text-green-400 font-black text-base sm:text-lg">85%</div>
                <div className="text-green-200 text-[10px] sm:text-xs">Tenant</div>
              </div>
              <div className="bg-blue-900/30 p-2 sm:p-3 rounded text-center">
                <div className="text-blue-400 font-black text-base sm:text-lg">10%</div>
                <div className="text-blue-200 text-[10px] sm:text-xs">Sponsor</div>
              </div>
              <div className="bg-gray-800/50 p-2 sm:p-3 rounded text-center">
                <div className="text-gray-400 font-black text-base sm:text-lg">5%</div>
                <div className="text-gray-300 text-[10px] sm:text-xs">Platform</div>
              </div>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <h4 className="text-green-200 font-black mb-2 flex items-center space-x-2 text-sm sm:text-base">
              <Award className="w-4 h-4" />
              <span>Lifetime Benefits</span>
            </h4>
            <p className="text-green-100 text-xs sm:text-sm">
              <strong>Platform Fee Waiver:</strong> Both you and your partnered tenant receive a <strong>lifetime waiver</strong> of platform listing fees. List and sell your own items with zero fees, forever. This benefit alone can save thousands over time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => onPurchase(project.id, project.nft_price)}
              disabled={nftsAvailable === 0}
              className="flex-1 px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-neon-yellow to-neon-orange text-black font-black rounded-xl hover:shadow-lg hover:shadow-neon-yellow/50 active:shadow-neon-orange/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base md:text-lg min-h-[48px]"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate">Purchase NFT - ${project.nft_price}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white font-black rounded-xl transition-colors text-sm sm:text-base min-h-[48px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
