import { useState, useEffect } from 'react';
import { UserProfile, TradingGroup, GroupPost, TradeOffer, FundTransfer, GroupInvite } from '../types/social';
import { useAuth } from './useAuth';
import { useMessaging } from './useMessaging';
import { supabase, requireSupabase, handleSupabaseError } from '../lib/supabase';
import { logger } from '../utils/logger';

export function useSocialSystem() {
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [tradingGroups, setTradingGroups] = useState<TradingGroup[]>([]);
  const [groupPosts, setGroupPosts] = useState<Record<string, GroupPost[]>>({});
  const [tradeOffers, setTradeOffers] = useState<Record<string, TradeOffer[]>>({});
  const [fundTransfers, setFundTransfers] = useState<Record<string, FundTransfer[]>>({});
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const { sendMessage, createConversation } = useMessaging();

  // Load data from Supabase
  useEffect(() => {
    // Load data from Supabase
    loadUserProfiles();
    loadTradingGroups();
    if (user) {
      loadGroupInvites();
    }
  }, []);

  // Load user profiles from Supabase
  const loadUserProfiles = async () => {
    if (!supabase) return;

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        logger.error('Error loading profiles', 'useSocialSystem', error);
        return;
      }

      const profilesMap: Record<string, UserProfile> = {};
      profiles?.forEach(profile => {
        profilesMap[profile.id] = {
          id: profile.id,
          handle: profile.username,
          displayName: profile.display_name,
          bio: profile.bio || '',
          avatar: profile.avatar,
          coverImage: profile.cover_image,
          location: profile.location,
          website: profile.website,
          joinedAt: new Date(profile.created_at),
          followers: profile.followers || [],
          following: profile.following || [],
          isVerified: profile.verified,
          badges: [], // Will be implemented later
          stats: {
            totalSales: profile.total_sales || 0,
            totalPurchases: profile.total_purchases || 0,
            rating: profile.rating || 0,
            reviewCount: profile.review_count || 0,
            completedTrades: profile.completed_trades || 0,
            groupsJoined: profile.groups_joined || 0,
          },
          socialLinks: profile.social_links || [],
          storeSettings: {
            isEnabled: profile.store_enabled || false,
            storeName: profile.store_name || '',
            storeDescription: profile.store_description || '',
            storeTheme: profile.store_theme || 'cyberpunk',
            featuredProducts: profile.featured_products || [],
            customBanner: profile.custom_banner,
            storeCategories: profile.store_categories || [],
          },
        };
      });

      setUserProfiles(profilesMap);
    } catch (error) {
      logger.error('Failed to load user profiles', 'useSocialSystem', error);
    }
  };

  // Load trading groups from Supabase
  const loadTradingGroups = async () => {
    if (!supabase) return;

    try {
      const { data: groups, error } = await supabase
        .from('trading_groups')
        .select(`
          *,
          group_members(
            user_id,
            role,
            reputation,
            joined_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading trading groups', 'useSocialSystem', error);
        return;
      }

      const tradingGroupsData: TradingGroup[] = groups?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        coverImage: group.cover_image,
        createdBy: group.created_by,
        createdAt: new Date(group.created_at),
        members: group.group_members?.map((member: any) => ({
          userId: member.user_id,
          role: member.role,
          joinedAt: new Date(member.joined_at),
          permissions: [],
          reputation: member.reputation || 50,
        })) || [],
        isPrivate: group.is_private,
        category: group.category,
        tags: group.tags || [],
        rules: group.rules || [],
        stats: {
          memberCount: group.member_count || 0,
          totalTrades: group.total_trades || 0,
          totalVolume: group.total_volume || 0,
          activeMembers: group.active_members || 0,
          messagesCount: group.post_count || 0,
        },
        settings: {
          allowInvites: group.allow_invites,
          requireApproval: group.require_approval,
          allowTrades: group.allow_trades,
          allowFundTransfers: group.allow_fund_transfers,
          maxMembers: group.max_members || 1000,
          tradingFeePercent: group.trading_fee_percent || 0,
        },
      })) || [];

      setTradingGroups(tradingGroupsData);
    } catch (error) {
      logger.error('Failed to load trading groups', 'useSocialSystem', error);
    }
  };

  // Load group posts from Supabase
  const loadGroupPosts = async (groupId: string) => {
    if (!supabase || !user) return;

    try {
      const { data: posts, error } = await supabase
        .from('group_posts')
        .select(`
          *,
          post_reactions(
            user_id,
            reaction_type,
            created_at
          ),
          post_comments(
            id,
            author_id,
            content,
            created_at
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading group posts', 'useSocialSystem', error);
        return;
      }

      const groupPostsData: GroupPost[] = posts?.map(post => ({
        id: post.id,
        groupId: post.group_id,
        authorId: post.author_id,
        content: post.content,
        type: post.post_type,
        attachments: post.attachments || [],
        reactions: post.post_reactions?.map((reaction: any) => ({
          userId: reaction.user_id,
          type: reaction.reaction_type,
          createdAt: new Date(reaction.created_at),
        })) || [],
        comments: post.post_comments?.map((comment: any) => ({
          id: comment.id,
          authorId: comment.author_id,
          content: comment.content,
          createdAt: new Date(comment.created_at),
          reactions: [],
          replies: [],
        })) || [],
        createdAt: new Date(post.created_at),
        updatedAt: new Date(post.updated_at),
        isPinned: post.is_pinned,
        tags: post.tags || [],
      })) || [];

      setGroupPosts(prev => ({
        ...prev,
        [groupId]: groupPostsData
      }));
    } catch (error) {
      logger.error('Failed to load group posts', 'useSocialSystem', error);
    }
  };

  // Load trade offers for a specific group
  const loadTradeOffers = async (groupId: string) => {
    if (!supabase || !user) return;

    try {
      const { data: offers, error } = await supabase
        .from('trade_offers')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading trade offers', 'useSocialSystem', error);
        return;
      }

      const tradeOffersData: TradeOffer[] = offers?.map(offer => ({
        id: offer.id,
        groupId: offer.group_id,
        createdBy: offer.created_by,
        title: offer.title,
        description: offer.description,
        offerType: offer.offer_type,
        items: offer.items || [],
        requestedItems: offer.requested_items || [],
        priceRange: offer.price_min && offer.price_max ? {
          min: offer.price_min,
          max: offer.price_max,
          currency: offer.price_currency || 'USDC'
        } : undefined,
        location: offer.location,
        expiresAt: new Date(offer.expires_at),
        status: offer.status,
        interestedUsers: offer.interested_users || [],
        createdAt: new Date(offer.created_at),
      })) || [];

      setTradeOffers(prev => ({
        ...prev,
        [groupId]: tradeOffersData
      }));
    } catch (error) {
      logger.error('Failed to load trade offers', 'useSocialSystem', error);
    }
  };

  // Load fund transfers for a specific group
  const loadFundTransfers = async (groupId: string) => {
    if (!supabase || !user) return;

    try {
      const { data: transfers, error } = await supabase
        .from('fund_transfers')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading fund transfers', 'useSocialSystem', error);
        return;
      }

      const fundTransfersData: FundTransfer[] = transfers?.map(transfer => ({
        id: transfer.id,
        groupId: transfer.group_id,
        fromUserId: transfer.from_user_id,
        toUserId: transfer.to_user_id,
        amount: transfer.amount,
        currency: transfer.currency,
        reason: transfer.reason,
        status: transfer.status,
        createdAt: new Date(transfer.created_at),
        completedAt: transfer.completed_at ? new Date(transfer.completed_at) : undefined,
        txHash: transfer.tx_hash,
      })) || [];

      setFundTransfers(prev => ({
        ...prev,
        [groupId]: fundTransfersData
      }));
    } catch (error) {
      logger.error('Failed to load fund transfers', 'useSocialSystem', error);
    }
  };

  // Load group invites for current user
  const loadGroupInvites = async () => {
    if (!supabase || !user) return;

    try {
      const { data: invites, error } = await supabase
        .from('group_invites')
        .select(`
          *,
          group:group_id(name, description),
          inviter:invited_by(username, display_name)
        `)
        .eq('invited_user', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error loading group invites', 'useSocialSystem', error);
        return;
      }

      const groupInvitesData: GroupInvite[] = invites?.map(invite => ({
        id: invite.id,
        groupId: invite.group_id,
        invitedBy: invite.invited_by,
        invitedUser: invite.invited_user,
        message: invite.message,
        status: invite.status,
        createdAt: new Date(invite.created_at),
        expiresAt: new Date(invite.expires_at),
      })) || [];

      setGroupInvites(groupInvitesData);
    } catch (error) {
      logger.error('Failed to load group invites', 'useSocialSystem', error);
    }
  };

  // Profile Management
  const createUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const supabaseClient = requireSupabase();

      const handle = profileData.handle?.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!handle) throw new Error('Handle is required');

      // Check if handle is already taken
      const { data: existingProfile, error: checkError } = await supabaseClient
        .from('profiles')
        .select('username')
        .eq('username', handle)
        .single();

      if (existingProfile) throw new Error('Handle already taken');

      // Update the existing profile in Supabase
      const { data: updatedProfile, error } = await supabaseClient
        .from('profiles')
        .update({
          username: handle,
          display_name: profileData.displayName || user.name,
          bio: profileData.bio || '',
          avatar: profileData.avatar,
          cover_image: profileData.coverImage,
          location: profileData.location,
          website: profileData.website,
          social_links: profileData.socialLinks || [],
          store_enabled: profileData.storeSettings?.isEnabled || false,
          store_name: profileData.storeSettings?.storeName || '',
          store_description: profileData.storeSettings?.storeDescription || '',
          store_theme: profileData.storeSettings?.storeTheme || 'cyberpunk',
          featured_products: profileData.storeSettings?.featuredProducts || [],
          store_categories: profileData.storeSettings?.storeCategories || [],
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create UserProfile object from database response
      const newProfile: UserProfile = {
        id: updatedProfile.id,
        handle: updatedProfile.username,
        displayName: updatedProfile.display_name,
        bio: updatedProfile.bio || '',
        avatar: updatedProfile.avatar,
        coverImage: updatedProfile.cover_image,
        location: updatedProfile.location,
        website: updatedProfile.website,
        joinedAt: new Date(updatedProfile.created_at),
        followers: updatedProfile.followers || [],
        following: updatedProfile.following || [],
        isVerified: updatedProfile.verified,
        badges: [],
        stats: {
          totalSales: updatedProfile.total_sales || 0,
          totalPurchases: updatedProfile.total_purchases || 0,
          rating: updatedProfile.rating || 0,
          reviewCount: updatedProfile.review_count || 0,
          completedTrades: updatedProfile.completed_trades || 0,
          groupsJoined: updatedProfile.groups_joined || 0,
        },
        socialLinks: updatedProfile.social_links || [],
        storeSettings: {
          isEnabled: updatedProfile.store_enabled || false,
          storeName: updatedProfile.store_name || '',
          storeDescription: updatedProfile.store_description || '',
          storeTheme: updatedProfile.store_theme || 'cyberpunk',
          featuredProducts: updatedProfile.featured_products || [],
          customBanner: updatedProfile.custom_banner,
          storeCategories: updatedProfile.store_categories || [],
        },
      };

      setUserProfiles(prev => ({ ...prev, [user.id]: newProfile }));
      return newProfile;
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const supabaseClient = requireSupabase();

      // Map UserProfile fields to database fields
      const dbUpdates: any = {};
      
      if (updates.handle) dbUpdates.username = updates.handle;
      if (updates.displayName) dbUpdates.display_name = updates.displayName;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.avatar) dbUpdates.avatar = updates.avatar;
      if (updates.coverImage) dbUpdates.cover_image = updates.coverImage;
      if (updates.location) dbUpdates.location = updates.location;
      if (updates.website) dbUpdates.website = updates.website;
      if (updates.followers) dbUpdates.followers = updates.followers;
      if (updates.following) dbUpdates.following = updates.following;
      if (updates.socialLinks) dbUpdates.social_links = updates.socialLinks;
      if (updates.storeSettings) {
        dbUpdates.store_enabled = updates.storeSettings.isEnabled;
        dbUpdates.store_name = updates.storeSettings.storeName;
        dbUpdates.store_description = updates.storeSettings.storeDescription;
        dbUpdates.store_theme = updates.storeSettings.storeTheme;
        dbUpdates.featured_products = updates.storeSettings.featuredProducts;
        dbUpdates.custom_banner = updates.storeSettings.customBanner;
        dbUpdates.store_categories = updates.storeSettings.storeCategories;
      }

      const { data: updatedProfile, error } = await supabaseClient
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setUserProfiles(prev => ({
        ...prev,
        [user.id]: { ...prev[user.id], ...updates }
      }));
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  };

  const followUser = async (targetUserId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const supabaseClient = requireSupabase();

      // Update current user's following list
      const currentFollowing = userProfiles[user.id]?.following || [];
      const newFollowing = [...currentFollowing, targetUserId];

      await supabaseClient
        .from('profiles')
        .update({ following: newFollowing })
        .eq('id', user.id);

      // Update target user's followers list
      const targetFollowers = userProfiles[targetUserId]?.followers || [];
      const newFollowers = [...targetFollowers, user.id];

      await supabaseClient
        .from('profiles')
        .update({ followers: newFollowers })
        .eq('id', targetUserId);

      // Update local state
      setUserProfiles(prev => ({
        ...prev,
        [user.id]: {
          ...prev[user.id],
          following: newFollowing
        },
        [targetUserId]: {
          ...prev[targetUserId],
          followers: newFollowers
        }
      }));
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const supabaseClient = requireSupabase();

      // Update current user's following list
      const currentFollowing = userProfiles[user.id]?.following || [];
      const newFollowing = currentFollowing.filter(id => id !== targetUserId);

      await supabaseClient
        .from('profiles')
        .update({ following: newFollowing })
        .eq('id', user.id);

      // Update target user's followers list
      const targetFollowers = userProfiles[targetUserId]?.followers || [];
      const newFollowers = targetFollowers.filter(id => id !== user.id);

      await supabaseClient
        .from('profiles')
        .update({ followers: newFollowers })
        .eq('id', targetUserId);

      // Update local state
      setUserProfiles(prev => ({
        ...prev,
        [user.id]: {
          ...prev[user.id],
          following: newFollowing
        },
        [targetUserId]: {
          ...prev[targetUserId],
          followers: newFollowers
        }
      }));
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  };

  // Group Management
  const createTradingGroup = async (groupData: Partial<TradingGroup>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { data: newGroup, error } = await supabaseClient
        .from('trading_groups')
        .insert({
          name: groupData.name || '',
          description: groupData.description || '',
          avatar: groupData.avatar,
          cover_image: groupData.coverImage,
          created_by: user.id,
          category: groupData.category || 'general',
          tags: groupData.tags || [],
          is_private: groupData.isPrivate || false,
          rules: groupData.rules || [],
          allow_invites: groupData.settings?.allowInvites ?? true,
          require_approval: groupData.settings?.requireApproval ?? false,
          allow_trades: groupData.settings?.allowTrades ?? true,
          allow_fund_transfers: groupData.settings?.allowFundTransfers ?? true,
          max_members: groupData.settings?.maxMembers || 1000,
          trading_fee_percent: groupData.settings?.tradingFeePercent || 0,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reload groups to get the updated data with member info
      await loadTradingGroups();
      
      return newGroup.id;
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to create trading group');
    } finally {
      setIsLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { error } = await supabaseClient
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
          reputation: 50,
        });

      if (error) {
        throw error;
      }

      // Reload groups to get updated member count
      await loadTradingGroups();
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { error } = await supabaseClient
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Reload groups to get updated member count
      await loadTradingGroups();
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to leave group');
    } finally {
      setIsLoading(false);
    }
  };

  // Post Management
  const createGroupPost = async (groupId: string, content: string, type: GroupPost['type'] = 'text') => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { data: newPost, error } = await supabaseClient
        .from('group_posts')
        .insert({
          group_id: groupId,
          author_id: user.id,
          content,
          post_type: type,
          attachments: [],
          tags: [],
          is_pinned: false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reload posts for this group
      await loadGroupPosts(groupId);
      
      return newPost.id;
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to create group post');
    } finally {
      setIsLoading(false);
    }
  };

  const reactToPost = async (postId: string, groupId: string, reactionType: 'like' | 'love' | 'fire' | 'rocket' | 'diamond') => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      // Use upsert to either insert new reaction or update existing one
      const { error } = await supabaseClient
        .from('post_reactions')
        .upsert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        }, {
          onConflict: 'post_id,user_id'
        });

      if (error) {
        throw error;
      }

      // Reload posts for this group to get updated reactions
      await loadGroupPosts(groupId);
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to react to post');
    } finally {
      setIsLoading(false);
    }
  };

  // Trade Offers
  const createTradeOffer = async (offerData: Partial<TradeOffer>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { data: newOffer, error } = await supabaseClient
        .from('trade_offers')
        .insert({
          group_id: offerData.groupId,
          created_by: user.id,
          title: offerData.title || '',
          description: offerData.description || '',
          offer_type: offerData.offerType || 'sell',
          items: offerData.items || [],
          requested_items: offerData.requestedItems || [],
          price_min: offerData.priceRange?.min,
          price_max: offerData.priceRange?.max,
          price_currency: offerData.priceRange?.currency || 'USDC',
          location: offerData.location,
          expires_at: offerData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'active',
          interested_users: [],
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reload trade offers for this group
      if (offerData.groupId) {
        await loadTradeOffers(offerData.groupId);
      }
      
      return newOffer.id;
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to create trade offer');
    } finally {
      setIsLoading(false);
    }
  };

  const expressInterest = async (offerId: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      // Get current interested users
      const { data: currentOffer, error: fetchError } = await supabaseClient
        .from('trade_offers')
        .select('interested_users, group_id')
        .eq('id', offerId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const currentInterested = currentOffer.interested_users || [];
      if (!currentInterested.includes(user.id)) {
        const { error } = await supabaseClient
          .from('trade_offers')
          .update({
            interested_users: [...currentInterested, user.id]
          })
          .eq('id', offerId);

        if (error) {
          throw error;
        }

        // Reload trade offers for this group
        await loadTradeOffers(currentOffer.group_id);
      }
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to express interest');
    } finally {
      setIsLoading(false);
    }
  };

  // Fund Transfers
  const initiateFundTransfer = async (groupId: string, toUserId: string, amount: number, currency: string, reason: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { data: newTransfer, error } = await supabaseClient
        .from('fund_transfers')
        .insert({
          group_id: groupId,
          from_user_id: user.id,
          to_user_id: toUserId,
          amount,
          currency,
          reason,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reload fund transfers for this group
      await loadFundTransfers(groupId);

      // Notify recipient
      try {
        const conversation = await createConversation(toUserId);
        await sendMessage(
          conversation,
          `You have received a fund transfer request of ${amount} ${currency} from @${userProfiles[user.id]?.handle || user.username}. Reason: ${reason}`,
          'system'
        );
      } catch (error) {
        logger.error('Failed to notify recipient', 'useSocialSystem', error);
      }

      return newTransfer.id;
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to initiate fund transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const completeFundTransfer = async (transferId: string, groupId: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { data: updatedTransfer, error } = await supabaseClient
        .from('fund_transfers')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        })
        .eq('id', transferId)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`) // Only participants can complete
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reload fund transfers for this group
      await loadFundTransfers(groupId);
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to complete fund transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelFundTransfer = async (transferId: string, groupId: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { error } = await supabaseClient
        .from('fund_transfers')
        .update({ status: 'cancelled' })
        .eq('id', transferId)
        .eq('from_user_id', user.id) // Only sender can cancel
        .eq('status', 'pending'); // Can only cancel pending transfers

      if (error) {
        throw error;
      }

      // Reload fund transfers for this group
      await loadFundTransfers(groupId);
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to cancel fund transfer');
    } finally {
      setIsLoading(false);
    }
  };

  // Group Invites
  const createGroupInvite = async (groupId: string, invitedUserId: string, message?: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { data: newInvite, error } = await supabaseClient
        .from('group_invites')
        .insert({
          group_id: groupId,
          invited_by: user.id,
          invited_user: invitedUserId,
          message: message || '',
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reload invites
      await loadGroupInvites();

      // Notify invited user
      try {
        const conversation = await createConversation(invitedUserId);
        const groupName = tradingGroups.find(g => g.id === groupId)?.name || 'a group';
        await sendMessage(
          conversation,
          `You've been invited to join "${groupName}" by @${userProfiles[user.id]?.handle || user.username}. ${message ? `Message: ${message}` : ''}`,
          'system'
        );
      } catch (error) {
        logger.error('Failed to notify invited user', 'useSocialSystem', error);
      }

      return newInvite.id;
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to create group invite');
    } finally {
      setIsLoading(false);
    }
  };

  const respondToGroupInvite = async (inviteId: string, accept: boolean) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const invite = groupInvites.find(inv => inv.id === inviteId);
      if (!invite) throw new Error('Invite not found');

      const { error: updateError } = await supabaseClient
        .from('group_invites')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', inviteId)
        .eq('invited_user', user.id);

      if (updateError) {
        throw updateError;
      }

      // If accepted, join the group
      if (accept) {
        await joinGroup(invite.groupId);
      }

      // Reload invites
      await loadGroupInvites();
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to respond to invite');
    } finally {
      setIsLoading(false);
    }
  };

  // Search and Discovery
  const searchUsers = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return Object.values(userProfiles).filter(profile => 
      profile.handle.includes(lowercaseQuery) ||
      profile.displayName.toLowerCase().includes(lowercaseQuery)
    );
  };

  const searchGroups = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return tradingGroups.filter(group => 
      group.name.toLowerCase().includes(lowercaseQuery) ||
      group.description.toLowerCase().includes(lowercaseQuery) ||
      group.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const getUserProfile = (userId: string) => userProfiles[userId];
  const getUserByHandle = (handle: string) => Object.values(userProfiles).find(p => p.handle === handle);
  const getGroupById = (groupId: string) => tradingGroups.find(g => g.id === groupId);
  const getGroupPosts = (groupId: string) => {
    // Load posts if not already loaded
    if (!groupPosts[groupId]) {
      loadGroupPosts(groupId);
    }
    return groupPosts[groupId] || [];
  };
  const getUserGroups = (userId: string) => tradingGroups.filter(g => g.members.some(m => m.userId === userId));
  const getTradeOffers = (groupId: string) => {
    // Load offers if not already loaded
    if (!tradeOffers[groupId]) {
      loadTradeOffers(groupId);
    }
    return tradeOffers[groupId] || [];
  };
  const getFundTransfers = (groupId: string) => {
    // Load transfers if not already loaded
    if (!fundTransfers[groupId]) {
      loadFundTransfers(groupId);
    }
    return fundTransfers[groupId] || [];
  };

  return {
    // State
    userProfiles,
    tradingGroups,
    groupPosts,
    tradeOffers,
    fundTransfers,
    groupInvites,
    isLoading,

    // Profile Management
    createUserProfile,
    updateUserProfile,
    followUser,
    unfollowUser,

    // Group Management
    createTradingGroup,
    joinGroup,
    leaveGroup,

    // Post Management
    createGroupPost,
    reactToPost,

    // Trade Management
    createTradeOffer,
    expressInterest,
    loadTradeOffers,

    // Fund Transfers
    initiateFundTransfer,
    completeFundTransfer,
    cancelFundTransfer,
    loadFundTransfers,

    // Group Invites
    createGroupInvite,
    respondToGroupInvite,
    loadGroupInvites,

    // Search and Discovery
    searchUsers,
    searchGroups,
    getUserProfile,
    getUserByHandle,
    getGroupById,
    getGroupPosts,
    getUserGroups,
    getTradeOffers,
    getFundTransfers,

    // Data Loading
    loadTradingGroups,
    loadGroupPosts,
    loadUserProfiles,
  };
}