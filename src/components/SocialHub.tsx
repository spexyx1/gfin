import React, { useState } from 'react';
import { X, Users, Plus, Search, TrendingUp, MessageCircle, Heart, Siren as Fire, Rocket, Diamond, Send, DollarSign } from 'lucide-react';
import { useSocialSystem } from '../hooks/useSocialSystem';
import { useMessaging } from '../hooks/useMessaging';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { SponsorshipMarketplace } from './SponsorshipMarketplace';
import { logger } from '../utils/logger';

interface SocialHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SocialHub({ isOpen, onClose }: SocialHubProps) {
  const [activeTab, setActiveTab] = useState<'groups' | 'discover' | 'trades' | 'transfers' | 'sponsorships'>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    category: 'trading',
    isPrivate: false,
  });

  const {
    tradingGroups,
    getUserGroups,
    getGroupPosts,
    getUserProfile,
    createTradingGroup,
    joinGroup,
    createGroupPost,
    reactToPost,
    searchGroups,
    searchUsers,
  } = useSocialSystem();

  const { user } = useAuth();
  const { createConversation } = useMessaging();

  const userGroups = user ? getUserGroups(user.id) : [];
  const filteredGroups = searchQuery ? searchGroups(searchQuery) : tradingGroups;
  const selectedGroupData = selectedGroup ? tradingGroups.find(g => g.id === selectedGroup) : null;
  const groupPosts = selectedGroup ? getGroupPosts(selectedGroup) : [];

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createTradingGroup(newGroupData);
      setShowCreateGroup(false);
      setNewGroupData({ name: '', description: '', category: 'trading', isPrivate: false });
    } catch (error) {
      logger.error('Failed to create group', 'SocialHub', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    try {
      await joinGroup(groupId);
    } catch (error) {
      logger.error('Failed to join group', 'SocialHub', error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newPostContent.trim()) return;

    try {
      await createGroupPost(selectedGroup, newPostContent.trim());
      setNewPostContent('');
    } catch (error) {
      logger.error('Failed to create post', 'SocialHub', error);
    }
  };

  const handleReaction = async (postId: string, reactionType: 'like' | 'love' | 'fire' | 'rocket' | 'diamond') => {
    if (!selectedGroup) return;
    try {
      await reactToPost(postId, selectedGroup, reactionType);
    } catch (error) {
      logger.error('Failed to react to post', 'SocialHub', error);
    }
  };

  const handleContactUser = async (userId: string) => {
    try {
      const conversation = await createConversation(userId);
      // This would open the existing messaging center
      // For now, we'll just log it - in a full implementation,
      // this would trigger opening the messaging center with this conversation
      logger.debug('Opening conversation', 'SocialHub', conversation);
    } catch (error) {
      logger.error('Failed to create conversation', 'SocialHub', error);
    }
  };

  const getReactionIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4" />;
      case 'love': return <Heart className="w-4 h-4 fill-current" />;
      case 'fire': return <Fire className="w-4 h-4" />;
      case 'rocket': return <Rocket className="w-4 h-4" />;
      case 'diamond': return <Diamond className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-7xl h-[90vh] overflow-hidden flex shadow-2xl">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white uppercase">Social Hub</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search groups or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white placeholder-gray-400 text-sm"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="p-4 border-b border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'groups', label: 'Groups', icon: Users },
                { id: 'discover', label: 'Discover', icon: TrendingUp },
                { id: 'trades', label: 'Trades', icon: MessageCircle },
                { id: 'transfers', label: 'Transfers', icon: DollarSign },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    activeTab === id
                      ? 'bg-neon-blue text-black'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Sponsorships Tab - Full Width */}
            <button
              onClick={() => setActiveTab('sponsorships')}
              className={`w-full mt-2 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                activeTab === 'sponsorships'
                  ? 'bg-neon-green text-black'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Sponsorships</span>
            </button>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black uppercase text-sm">
                {activeTab === 'groups' ? 'My Groups' : 'All Groups'}
              </h3>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-neon-blue transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {(activeTab === 'groups' ? userGroups : filteredGroups).map((group) => {
                const isMember = user && group.members.some(m => m.userId === user.id);
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedGroup === group.id
                        ? 'bg-neon-blue/20 border border-neon-blue/30'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">{group.name}</h4>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{group.description}</p>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                          <span>{group.stats.memberCount} members</span>
                          <span>{group.category}</span>
                        </div>
                      </div>
                      {!isMember && activeTab === 'discover' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinGroup(group.id);
                          }}
                          className="px-2 py-1 bg-neon-blue text-black rounded text-xs font-medium hover:bg-neon-blue/80 transition-colors"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'sponsorships' ? (
            <SponsorshipMarketplace isOpen={true} onClose={() => setActiveTab('groups')} />
          ) : selectedGroupData ? (
            <>
              {/* Group Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedGroupData.name}</h2>
                    <p className="text-gray-400 mt-1">{selectedGroupData.description}</p>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span>{selectedGroupData.stats.memberCount} members</span>
                      <span>{selectedGroupData.stats.totalTrades} trades</span>
                      <span>${selectedGroupData.stats.totalVolume.toLocaleString()} volume</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedGroupData.isPrivate ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {selectedGroupData.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Post Creation */}
              {user && selectedGroupData.members.some(m => m.userId === user.id) && (
                <div className="p-6 border-b border-gray-700">
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share something with the group..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue text-white placeholder-gray-500 resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newPostContent.trim()}
                        className="px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 disabled:bg-gray-700 text-black rounded-lg transition-colors font-medium flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Post</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Posts Feed */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {groupPosts.map((post) => {
                    const author = getUserProfile(post.authorId);
                    return (
                      <div key={post.id} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-neon-blue rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-black font-bold text-sm">
                              {author?.handle?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-white font-medium">
                                @{author?.handle || 'unknown'}
                              </span>
                              <span className="text-gray-500 text-sm">
                                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{post.content}</p>
                            
                            {/* Reactions */}
                            <div className="flex items-center space-x-4 mt-4">
                              {['like', 'love', 'fire', 'rocket', 'diamond'].map((reactionType) => {
                                const reactionCount = post.reactions.filter(r => r.type === reactionType).length;
                                const userReacted = user && post.reactions.some(r => r.userId === user.id && r.type === reactionType);
                                
                                return (
                                  <button
                                    key={reactionType}
                                    onClick={() => handleReaction(post.id, reactionType as any)}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors ${
                                      userReacted
                                        ? 'bg-neon-blue/20 text-neon-blue'
                                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                                    }`}
                                  >
                                    {getReactionIcon(reactionType)}
                                    {reactionCount > 0 && <span className="text-xs">{reactionCount}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {groupPosts.length === 0 && (
                    <div className="text-center py-12">
                      <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No posts yet</p>
                      <p className="text-gray-500">Be the first to share something!</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Select a group to view posts</p>
                <p className="text-gray-500">Join groups to start trading and socializing</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-black text-white uppercase">Create Group</h3>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Group Name</label>
                <input
                  type="text"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Category</label>
                <select
                  value={newGroupData.category}
                  onChange={(e) => setNewGroupData({ ...newGroupData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                >
                  <option value="trading">Trading</option>
                  <option value="nft">NFT</option>
                  <option value="defi">DeFi</option>
                  <option value="gaming">Gaming</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newGroupData.isPrivate}
                  onChange={(e) => setNewGroupData({ ...newGroupData, isPrivate: e.target.checked })}
                  className="w-4 h-4 text-neon-blue bg-gray-800 border-gray-600 rounded focus:ring-neon-blue"
                />
                <label htmlFor="isPrivate" className="text-white font-medium">Private Group</label>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors font-medium"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
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