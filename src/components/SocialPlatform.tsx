import React, { useState } from 'react';
import { ArrowLeft, Globe, Plus, Search, TrendingUp, Users, MessageCircle, Heart, Share2, Eye, MapPin, DollarSign, Tag, Clock, Flag, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocialSystem } from '../hooks/useSocialSystem';
import { useAuth } from '../hooks/useAuth';
import { useMessaging } from '../hooks/useMessaging';
import { formatDistanceToNow } from 'date-fns';
import { HousingMarketplace } from './HousingMarketplace';
import { logger } from '../utils/logger';

interface SocialPlatformProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

interface CommunityPost {
  id: string;
  authorId: string;
  communityId?: string;
  type: 'deal' | 'classified' | 'discussion' | 'announcement';
  title: string;
  content: string;
  price?: number;
  currency?: string;
  location?: string;
  category: string;
  tags: string[];
  images: string[];
  likes: string[];
  shares: number;
  views: number;
  createdAt: Date;
  expiresAt?: Date;
  isPromoted: boolean;
  contactInfo?: {
    method: 'message' | 'email' | 'phone';
    value: string;
  };
}

interface Community {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  category: string;
  memberCount: number;
  postCount: number;
  isPrivate: boolean;
  rules: string[];
  moderators: string[];
  createdBy: string;
  createdAt: Date;
  tags: string[];
}

export function SocialPlatform({ searchTerm, setSearchTerm }: SocialPlatformProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feed' | 'communities' | 'deals' | 'classifieds' | 'housing-nfts'>('feed');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');

  const [newPostData, setNewPostData] = useState({
    type: 'discussion' as CommunityPost['type'],
    title: '',
    content: '',
    price: '',
    currency: 'USDC',
    location: '',
    category: 'general',
    tags: '',
    contactMethod: 'message' as 'message' | 'email' | 'phone',
    contactValue: '',
  });

  const [newCommunityData, setNewCommunityData] = useState({
    name: '',
    description: '',
    category: 'trading',
    isPrivate: false,
    rules: ['Be respectful to all members', 'No spam or self-promotion', 'Follow community guidelines'],
  });

  const { user } = useAuth();
  const { createConversation } = useMessaging();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  const categories = ['all', 'trading', 'nft', 'hardware', 'defi', 'gaming', 'services', 'general'];
  const postCategories = ['general', 'hardware', 'nft', 'defi', 'gaming', 'services', 'analysis', 'news'];

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      authorId: user.id,
      communityId: selectedCommunity || undefined,
      type: newPostData.type,
      title: newPostData.title,
      content: newPostData.content,
      price: newPostData.price ? parseFloat(newPostData.price) : undefined,
      currency: newPostData.currency,
      location: newPostData.location || undefined,
      category: newPostData.category,
      tags: newPostData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      images: [],
      likes: [],
      shares: 0,
      views: 0,
      createdAt: new Date(),
      expiresAt: newPostData.type === 'deal' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      isPromoted: false,
      contactInfo: newPostData.contactMethod !== 'message' ? {
        method: newPostData.contactMethod,
        value: newPostData.contactValue
      } : { method: 'message', value: user.id },
    };

    setPosts(prev => [newPost, ...prev]);
    setShowCreatePost(false);
    setNewPostData({
      type: 'discussion',
      title: '',
      content: '',
      price: '',
      currency: 'USDC',
      location: '',
      category: 'general',
      tags: '',
      contactMethod: 'message',
      contactValue: '',
    });
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newCommunity: Community = {
      id: `comm_${Date.now()}`,
      name: newCommunityData.name,
      description: newCommunityData.description,
      category: newCommunityData.category,
      memberCount: 1,
      postCount: 0,
      isPrivate: newCommunityData.isPrivate,
      rules: newCommunityData.rules,
      moderators: [user.id],
      createdBy: user.id,
      createdAt: new Date(),
      tags: [],
    };

    setCommunities(prev => [newCommunity, ...prev]);
    setShowCreateCommunity(false);
    setNewCommunityData({
      name: '',
      description: '',
      category: 'trading',
      isPrivate: false,
      rules: ['Be respectful to all members', 'No spam or self-promotion', 'Follow community guidelines'],
    });
  };

  const handleLikePost = (postId: string) => {
    if (!user) return;
    
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const hasLiked = post.likes.includes(user.id);
        return {
          ...post,
          likes: hasLiked 
            ? post.likes.filter(id => id !== user.id)
            : [...post.likes, user.id]
        };
      }
      return post;
    }));
  };

  const handleContactUser = async (userId: string) => {
    if (!user) return;
    try {
      await createConversation(userId);
      // This would typically open the messaging center
      logger.debug('Opening conversation with user', 'SocialPlatform', userId);
    } catch (error) {
      logger.error('Failed to create conversation', 'SocialPlatform', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
    
    const matchesTab = activeTab === 'feed' || 
      (activeTab === 'deals' && post.type === 'deal') ||
      (activeTab === 'classifieds' && post.type === 'classified');
    
    const matchesCommunity = !selectedCommunity || post.communityId === selectedCommunity;
    
    return matchesSearch && matchesCategory && matchesTab && matchesCommunity;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.likes.length + b.shares) - (a.likes.length + a.shares);
      case 'trending':
        return b.views - a.views;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = searchTerm === '' || 
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black flex">
        {/* Sidebar */}
        <div className="w-80 luxe-glass border-r border-white/10 flex flex-col min-h-screen">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-6 w-6 text-luxe-gold" />
                <h2 className="text-xl font-black text-white uppercase">Social Platform</h2>
              </div>
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:luxe-glass rounded-lg transition-colors"
                title="Back to Marketplace"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search posts, communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 luxe-glass border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white placeholder-gray-400 text-sm"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 border-b border-white/10">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'feed', label: 'Feed', icon: TrendingUp },
                { id: 'communities', label: 'Communities', icon: Users },
                { id: 'deals', label: 'Deals', icon: DollarSign },
                { id: 'classifieds', label: 'Classifieds', icon: Tag },
                { id: 'housing-nfts', label: 'Housing NFTs', icon: Home },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id as any);
                    setSelectedCommunity(null);
                  }}
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    activeTab === id
                      ? 'bg-luxe-gold text-black'
                      : 'text-gray-300 hover:luxe-glass'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Communities List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black uppercase text-sm">Communities</h3>
              <button
                onClick={() => setShowCreateCommunity(true)}
                className="p-1 hover:luxe-glass rounded text-gray-400 hover:text-luxe-gold transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedCommunity(null)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  !selectedCommunity
                    ? 'bg-luxe-gold/20 border border-luxe-gold/30 text-luxe-gold'
                    : 'luxe-glass hover:bg-gray-600 text-gray-300'
                }`}
              >
                <div className="font-medium text-sm">All Communities</div>
                <div className="text-xs text-gray-400">View all posts</div>
              </button>

              {filteredCommunities.map((community) => (
                <button
                  key={community.id}
                  onClick={() => setSelectedCommunity(community.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCommunity === community.id
                      ? 'bg-luxe-gold/20 border border-luxe-gold/30'
                      : 'luxe-glass hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm">{community.name}</h4>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">{community.description}</p>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        <span>{community.memberCount} members</span>
                        <span>{community.postCount} posts</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white uppercase">
                  {selectedCommunity
                    ? communities.find(c => c.id === selectedCommunity)?.name
                    : activeTab === 'deals' ? 'Deals & Offers'
                    : activeTab === 'classifieds' ? 'Classifieds'
                    : activeTab === 'communities' ? 'Communities'
                    : activeTab === 'housing-nfts' ? 'Housing NFT Marketplace'
                    : 'Social Feed'
                  }
                </h2>
                <p className="text-gray-400 text-sm">
                  {selectedCommunity 
                    ? communities.find(c => c.id === selectedCommunity)?.description
                    : `${sortedPosts.length} posts available`
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Filters */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 luxe-glass border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                >
                  <option value="all">All Categories</option>
                  {postCategories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 luxe-glass border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                >
                  <option value="recent">Recent</option>
                  <option value="popular">Popular</option>
                  <option value="trending">Trending</option>
                </select>

                <button
                  onClick={() => setShowCreatePost(true)}
                  className="px-4 py-2 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-medium flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Post</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'housing-nfts' ? (
              <HousingMarketplace />
            ) : activeTab === 'communities' && !selectedCommunity ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommunities.map((community) => (
                  <div key={community.id} className="luxe-glass rounded-2xl p-6 border border-white/10 hover:border-luxe-gold/30 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-white mb-2">{community.name}</h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-3">{community.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{community.memberCount} members</span>
                          <span>{community.postCount} posts</span>
                          <span className="capitalize">{community.category}</span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          community.isPrivate ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {community.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedCommunity(community.id)}
                        className="flex-1 px-4 py-2 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-medium"
                      >
                        View
                      </button>
                      <button className="px-4 py-2 luxe-glass hover:bg-gray-600 text-white rounded-lg transition-colors">
                        Join
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredCommunities.length === 0 && searchTerm && (
                  <div className="col-span-full text-center py-12">
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No communities found</p>
                    <p className="text-gray-500">Try different search terms or browse all communities</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-4 px-4 py-2 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-medium"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Posts Feed */
              <div className="space-y-6">
                {sortedPosts.map((post) => (
                  <div key={post.id} className="luxe-glass rounded-2xl p-6 border border-white/10 hover:border-gray-600 transition-all duration-300">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-10 h-10 bg-luxe-gold rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-black font-bold text-sm">
                            {post.authorId.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white font-medium">@{post.authorId}</span>
                            <span className="text-gray-500 text-sm">
                              {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                            </span>
                            {post.communityId && (
                              <span className="text-luxe-gold text-sm">
                                in {communities.find(c => c.id === post.communityId)?.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              post.type === 'deal' ? 'bg-green-500/20 text-green-400' :
                              post.type === 'classified' ? 'bg-blue-500/20 text-blue-400' :
                              post.type === 'announcement' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {post.type.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 luxe-glass text-gray-300 rounded-full text-xs">
                              {post.category}
                            </span>
                            {post.isPromoted && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                                PROMOTED
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors">
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <h3 className="text-lg font-black text-white mb-2">{post.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{post.content}</p>
                      
                      {/* Price and Location */}
                      {(post.price || post.location) && (
                        <div className="flex items-center space-x-4 mt-3">
                          {post.price && (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 font-black">
                                {post.price} {post.currency}
                              </span>
                            </div>
                          )}
                          {post.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400 text-sm">{post.location}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 luxe-glass text-gray-300 rounded-full text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expiration */}
                      {post.expiresAt && (
                        <div className="flex items-center space-x-1 mt-3">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 text-sm">
                            Expires {formatDistanceToNow(post.expiresAt, { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Post Images */}
                    {post.images.length > 0 && (
                      <div className="mb-4">
                        <div className="grid grid-cols-2 gap-2">
                          {post.images.slice(0, 4).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center space-x-2 transition-colors ${
                            user && post.likes.includes(user.id)
                              ? 'text-red-400'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${user && post.likes.includes(user.id) ? 'fill-current' : ''}`} />
                          <span className="text-sm">{post.likes.length}</span>
                        </button>
                        
                        <button className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors">
                          <Share2 className="w-4 h-4" />
                          <span className="text-sm">{post.shares}</span>
                        </button>
                        
                        <div className="flex items-center space-x-2 text-gray-400">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">{post.views}</span>
                        </div>
                      </div>

                      {/* Contact Button */}
                      {post.contactInfo && (
                        <button
                          onClick={() => {
                            if (post.contactInfo?.method === 'message') {
                              handleContactUser(post.contactInfo.value);
                            }
                          }}
                          className="px-4 py-2 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-medium flex items-center space-x-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Contact</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {sortedPosts.length === 0 && (
                  <div className="text-center py-12">
                    {searchTerm ? (
                      <>
                        <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No posts found for "{searchTerm}"</p>
                        <p className="text-gray-500">Try different search terms or browse all posts</p>
                        <button
                          onClick={() => setSearchTerm('')}
                          className="mt-4 px-4 py-2 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-medium"
                        >
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <>
                        <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No posts found</p>
                        <p className="text-gray-500">Try adjusting your filters or create the first post!</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase">Create Post</h3>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="p-2 hover:luxe-glass rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Post Type</label>
                  <select
                    value={newPostData.type}
                    onChange={(e) => setNewPostData({ ...newPostData, type: e.target.value as any })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                  >
                    <option value="discussion">Discussion</option>
                    <option value="deal">Deal/Offer</option>
                    <option value="classified">Classified Ad</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Category</label>
                  <select
                    value={newPostData.category}
                    onChange={(e) => setNewPostData({ ...newPostData, category: e.target.value })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                  >
                    {postCategories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newPostData.title}
                  onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
                  className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                  placeholder="Enter post title..."
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Content</label>
                <textarea
                  value={newPostData.content}
                  onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white resize-none"
                  placeholder="Share your thoughts, deals, or classifieds..."
                  required
                />
              </div>

              {(newPostData.type === 'deal' || newPostData.type === 'classified') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPostData.price}
                      onChange={(e) => setNewPostData({ ...newPostData, price: e.target.value })}
                      className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Currency</label>
                    <select
                      value={newPostData.currency}
                      onChange={(e) => setNewPostData({ ...newPostData, currency: e.target.value })}
                      className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                    >
                      <option value="USDC">USDC</option>
                      <option value="ETH">ETH</option>
                      <option value="BTC">BTC</option>
                      <option value="GHETTO">GHETTO</option>
                      <option value="GRAIN">GRAIN</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Location (Optional)</label>
                  <input
                    type="text"
                    value={newPostData.location}
                    onChange={(e) => setNewPostData({ ...newPostData, location: e.target.value })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                    placeholder="City, State/Country"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newPostData.tags}
                    onChange={(e) => setNewPostData({ ...newPostData, tags: e.target.value })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                    placeholder="crypto, nft, trading"
                  />
                </div>
              </div>

              {(newPostData.type === 'deal' || newPostData.type === 'classified') && (
                <div>
                  <label className="block text-white font-medium mb-2">Contact Method</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { id: 'message', label: 'Message' },
                      { id: 'email', label: 'Email' },
                      { id: 'phone', label: 'Phone' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setNewPostData({ ...newPostData, contactMethod: id as any })}
                        className={`py-2 rounded-lg font-medium transition-colors ${
                          newPostData.contactMethod === id
                            ? 'bg-luxe-gold text-black'
                            : 'luxe-glass text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {newPostData.contactMethod !== 'message' && (
                    <input
                      type={newPostData.contactMethod === 'email' ? 'email' : 'tel'}
                      value={newPostData.contactValue}
                      onChange={(e) => setNewPostData({ ...newPostData, contactValue: e.target.value })}
                      className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                      placeholder={newPostData.contactMethod === 'email' ? 'your@email.com' : '+1 (555) 123-4567'}
                      required
                    />
                  )}
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-medium"
                >
                  Create Post
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  className="px-6 py-3 luxe-glass hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase">Create Community</h3>
                <button
                  onClick={() => setShowCreateCommunity(false)}
                  className="p-2 hover:luxe-glass rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCommunity} className="p-6 space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Community Name</label>
                <input
                  type="text"
                  value={newCommunityData.name}
                  onChange={(e) => setNewCommunityData({ ...newCommunityData, name: e.target.value })}
                  className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                  placeholder="Enter community name..."
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  value={newCommunityData.description}
                  onChange={(e) => setNewCommunityData({ ...newCommunityData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white resize-none"
                  placeholder="Describe your community..."
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Category</label>
                <select
                  value={newCommunityData.category}
                  onChange={(e) => setNewCommunityData({ ...newCommunityData, category: e.target.value })}
                  className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                >
                  <option value="trading">Trading</option>
                  <option value="nft">NFT</option>
                  <option value="defi">DeFi</option>
                  <option value="hardware">Hardware</option>
                  <option value="gaming">Gaming</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newCommunityData.isPrivate}
                  onChange={(e) => setNewCommunityData({ ...newCommunityData, isPrivate: e.target.checked })}
                  className="w-4 h-4 text-luxe-gold luxe-glass border-gray-600 rounded focus:ring-luxe-gold"
                />
                <label htmlFor="isPrivate" className="text-white font-medium">Private Community</label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-medium"
                >
                  Create Community
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(false)}
                  className="px-6 py-3 luxe-glass hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}