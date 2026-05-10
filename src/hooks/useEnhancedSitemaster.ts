import { useState, useEffect } from 'react';
import { requireSupabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface UserFlag {
  id: string;
  user_id: string;
  flagged_by: string;
  flag_type: string;
  reason: string;
  evidence: any;
  status: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ContentModeration {
  id: string;
  content_type: string;
  content_id: string;
  action: string;
  moderator_id: string;
  reason: string;
  metadata: any;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  activity_type: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserSuspension {
  id: string;
  user_id: string;
  suspended_by: string;
  reason: string;
  duration_hours?: number;
  expires_at?: string;
  active: boolean;
  created_at: string;
}

export interface PlatformSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  category: string;
  description?: string;
  updated_by?: string;
  updated_at: string;
}

export function useEnhancedSitemaster() {
  const [flags, setFlags] = useState<UserFlag[]>([]);
  const [suspensions, setSuspensions] = useState<UserSuspension[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSitemaster = async () => {
    try {
      const db = requireSupabase();
      const { data: { user } } = await db.auth.getUser();
      if (!user) {
        logger.debug('[useEnhancedSitemaster] No authenticated user', 'useEnhancedSitemaster');
        return false;
      }

      logger.debug('[useEnhancedSitemaster] Checking sitemaster role for user', 'useEnhancedSitemaster', user.id);
      const { data, error } = await db
        .from('user_admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role_type', 'sitemaster')
        .eq('active', true)
        .maybeSingle();

      if (error) {
        logger.error('[useEnhancedSitemaster] Database error', 'useEnhancedSitemaster', error);
        return false;
      }

      const hasSitemasterRole = !!data;
      logger.debug('[useEnhancedSitemaster] Role check result', 'useEnhancedSitemaster', { hasSitemasterRole, data });

      if (hasSitemasterRole) {
        logger.debug('[useEnhancedSitemaster] SITEMASTER ACCESS GRANTED', 'useEnhancedSitemaster');
      }

      return hasSitemasterRole;
    } catch (error) {
      logger.error('[useEnhancedSitemaster] Exception', 'useEnhancedSitemaster', error);
      return false;
    }
  };

  const flagUser = async (userId: string, flagType: string, reason: string, evidence: any = {}) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('user_flags')
      .insert({
        user_id: userId,
        flagged_by: user.id,
        flag_type: flagType,
        reason,
        evidence
      })
      .select()
      .single();

    if (error) throw error;
    await fetchFlags();
    return data;
  };

  const resolveFlag = async (flagId: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await db
      .from('user_flags')
      .update({
        status: 'resolved',
        resolved_by: user.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', flagId);

    if (error) throw error;
    await fetchFlags();
  };

  const suspendUser = async (userId: string, reason: string, durationHours?: number) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const expiresAt = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
      : undefined;

    const { data, error } = await db
      .from('user_suspensions')
      .insert({
        user_id: userId,
        suspended_by: user.id,
        reason,
        duration_hours: durationHours,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) throw error;
    await fetchSuspensions();
    return data;
  };

  const liftSuspension = async (suspensionId: string) => {
    const { error } = await requireSupabase()
      .from('user_suspensions')
      .update({ active: false })
      .eq('id', suspensionId);

    if (error) throw error;
    await fetchSuspensions();
  };

  const deleteContent = async (contentType: string, contentId: string, reason: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await db.from('content_moderation').insert({
      content_type: contentType,
      content_id: contentId,
      action: 'delete',
      moderator_id: user.id,
      reason,
      metadata: {}
    });

    if (contentType === 'product') {
      await db.from('products').delete().eq('id', contentId);
    } else if (contentType === 'post') {
      await db.from('social_posts').update({ deleted: true }).eq('id', contentId);
    }
  };

  const sendAdminMessage = async (recipientId: string, subject: string, message: string, priority: string = 'normal') => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('admin_messages')
      .insert({
        recipient_id: recipientId,
        sender_id: user.id,
        subject,
        message,
        priority
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const searchUsers = async (query: string) => {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(50);

    if (error) throw error;
    return data;
  };

  const searchListings = async (query: string) => {
    const { data, error } = await requireSupabase()
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(50);

    if (error) throw error;
    return data;
  };

  const getUserActivity = async (userId: string, limit: number = 50) => {
    const { data, error } = await requireSupabase()
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ActivityLog[];
  };

  const getPlatformStats = async () => {
    const db = requireSupabase();
    const [users, products, orders, activeSuspensions] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('products').select('id', { count: 'exact', head: true }),
      db.from('orders').select('id', { count: 'exact', head: true }),
      db.from('user_suspensions').select('id', { count: 'exact', head: true }).eq('active', true)
    ]);

    return {
      totalUsers: users.count || 0,
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      activeSuspensions: activeSuspensions.count || 0
    };
  };

  const getSetting = async (key: string) => {
    const { data, error } = await requireSupabase()
      .from('platform_settings')
      .select('*')
      .eq('setting_key', key)
      .maybeSingle();

    if (error) throw error;
    return data as PlatformSettings | null;
  };

  const updateSetting = async (key: string, value: any, category: string, description?: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('platform_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        category,
        description,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const getSettingsByCategory = async (category: string) => {
    const { data, error } = await requireSupabase()
      .from('platform_settings')
      .select('*')
      .eq('category', category)
      .order('setting_key');

    if (error) throw error;
    return data as PlatformSettings[];
  };

  // Feature Toggle Management
  const getFeatureToggles = async () => {
    const { data, error } = await requireSupabase()
      .from('feature_toggles')
      .select('*')
      .order('feature_name');

    if (error) throw error;
    return data;
  };

  const toggleFeature = async (featureName: string, enabled: boolean) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('feature_toggles')
      .update({
        enabled,
        last_toggled_by: user.id,
        last_toggled_at: new Date().toISOString()
      })
      .eq('feature_name', featureName)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Rate Configuration Management
  const getRateConfigurations = async () => {
    const { data, error } = await requireSupabase()
      .from('rate_configurations')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return data;
  };

  const updateRate = async (rateName: string, newValue: number) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('rate_configurations')
      .update({
        rate_value: newValue,
        last_updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('rate_name', rateName)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Escrow Management
  const getEscrowOrders = async (status?: string) => {
    let query = requireSupabase()
      .from('orders')
      .select('*, buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  };

  const cancelEscrowOrder = async (orderId: string, reason: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update order status
    const { error: orderError } = await db
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderError) throw orderError;

    // Log the cancellation
    await db.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'sitemaster_cancel_order',
      details: { order_id: orderId, reason }
    });
  };

  const forceReleaseEscrow = async (orderId: string, reason: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await db
      .from('orders')
      .update({
        status: 'funds_released',
        funds_released_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    // Log the action
    await db.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'sitemaster_force_release',
      details: { order_id: orderId, reason }
    });
  };

  // Transaction Search and Management
  const searchTransactions = async (query: string) => {
    const { data, error } = await requireSupabase()
      .from('orders')
      .select('*, buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)')
      .or(`id.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(50);

    if (error) throw error;
    return data;
  };

  const getAllMessages = async (limit: number = 100) => {
    const { data, error } = await requireSupabase()
      .from('messages')
      .select('*, sender:profiles!sender_id(username), receiver:profiles!receiver_id(username)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  };

  // View all platform data
  const getAllPosts = async (limit: number = 100) => {
    const { data, error } = await requireSupabase()
      .from('social_posts')
      .select('*, author:profiles(username)')
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  };

  const getAllProducts = async (limit: number = 100) => {
    const { data, error } = await requireSupabase()
      .from('products')
      .select('*, seller:profiles!seller_id(username)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  };

  // Advanced User Management
  const getAllUsers = async (limit: number = 100, offset: number = 0) => {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .select('*')
      .order('username', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  };

  const getUserDetails = async (userId: string) => {
    const db = requireSupabase();
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get user's orders
    const { data: orders } = await db
      .from('orders')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get user's products if seller
    const { data: products } = await db
      .from('products')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get user's flags
    const { data: flags } = await db
      .from('user_flags')
      .select('*')
      .eq('user_id', userId);

    // Get user's suspensions
    const { data: suspensions } = await db
      .from('user_suspensions')
      .select('*')
      .eq('user_id', userId);

    return {
      profile,
      orders: orders || [],
      products: products || [],
      flags: flags || [],
      suspensions: suspensions || []
    };
  };

  const updateUserProfile = async (userId: string, updates: any) => {
    const { data, error } = await requireSupabase()
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteUser = async (userId: string, reason: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Log the deletion
    await db.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'sitemaster_delete_user',
      details: { deleted_user_id: userId, reason }
    });

    // Soft delete by deactivating profile
    const { error } = await db
      .from('profiles')
      .update({
        username: `deleted_${userId.substring(0, 8)}`,
        display_name: 'Deleted User',
        bio: null,
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  };

  // Advanced Transaction Management
  const getAllTransactions = async (limit: number = 100, offset: number = 0) => {
    const { data, error } = await requireSupabase()
      .from('orders')
      .select('*, buyer:profiles!buyer_id(username, display_name), seller:profiles!seller_id(username, display_name), product:products(name)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  };

  const getTransactionDetails = async (orderId: string) => {
    const { data, error } = await requireSupabase()
      .from('orders')
      .select('*, buyer:profiles!buyer_id(*), seller:profiles!seller_id(*), product:products(*)')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  };

  const refundTransaction = async (orderId: string, reason: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await db
      .from('orders')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    await db.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'sitemaster_refund_transaction',
      details: { order_id: orderId, reason }
    });
  };

  // Advanced Escrow Management
  const getEscrowStatistics = async () => {
    const db = requireSupabase();
    const { data: total } = await db
      .from('orders')
      .select('amount', { count: 'exact' })
      .in('status', ['funded', 'in_progress']);

    const { data: disputed } = await db
      .from('orders')
      .select('amount', { count: 'exact' })
      .eq('status', 'disputed');

    const { data: completed } = await db
      .from('orders')
      .select('amount', { count: 'exact' })
      .eq('status', 'completed');

    const totalAmount = total?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
    const disputedAmount = disputed?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

    return {
      totalEscrowOrders: total?.length || 0,
      totalEscrowAmount: totalAmount,
      disputedOrders: disputed?.length || 0,
      disputedAmount: disputedAmount,
      completedOrders: completed?.length || 0
    };
  };

  // Advanced Analytics
  const getPlatformAnalytics = async () => {
    const db = requireSupabase();
    const [users, products, orders, revenue] = await Promise.all([
      db.from('profiles').select('id, created_at', { count: 'exact' }),
      db.from('products').select('id, created_at', { count: 'exact' }),
      db.from('orders').select('id, amount, created_at', { count: 'exact' }),
      db.from('orders').select('amount').eq('status', 'completed')
    ]);

    const totalRevenue = revenue.data?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;

    // Get growth metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newUsers } = await db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: newProducts } = await db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: newOrders } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      totalUsers: users.count || 0,
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      totalRevenue,
      newUsersLast30Days: newUsers || 0,
      newProductsLast30Days: newProducts || 0,
      newOrdersLast30Days: newOrders || 0
    };
  };

  // Bulk Operations
  const bulkSuspendUsers = async (userIds: string[], reason: string, durationHours?: number) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const expiresAt = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
      : undefined;

    const suspensions = userIds.map(userId => ({
      user_id: userId,
      suspended_by: user.id,
      reason,
      duration_hours: durationHours,
      expires_at: expiresAt
    }));

    const { error } = await db
      .from('user_suspensions')
      .insert(suspensions);

    if (error) throw error;

    await db.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'sitemaster_bulk_suspend',
      details: { user_ids: userIds, reason, count: userIds.length }
    });
  };

  const bulkDeleteContent = async (contentType: string, contentIds: string[], reason: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    for (const contentId of contentIds) {
      await deleteContent(contentType, contentId, reason);
    }

    await db.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'sitemaster_bulk_delete_content',
      details: { content_type: contentType, content_ids: contentIds, reason, count: contentIds.length }
    });
  };

  // Search and Filter
  const advancedSearch = async (query: string, type: 'all' | 'users' | 'products' | 'orders' | 'messages') => {
    const db = requireSupabase();
    const results: any = {};

    if (type === 'all' || type === 'users') {
      const { data: users } = await db
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(20);
      results.users = users || [];
    }

    if (type === 'all' || type === 'products') {
      const { data: products } = await db
        .from('products')
        .select('*, seller:profiles!seller_id(username)')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20);
      results.products = products || [];
    }

    if (type === 'all' || type === 'orders') {
      const { data: orders } = await db
        .from('orders')
        .select('*, buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)')
        .ilike('id', `%${query}%`)
        .limit(20);
      results.orders = orders || [];
    }

    if (type === 'all' || type === 'messages') {
      const { data: messages } = await db
        .from('messages')
        .select('*, sender:profiles!sender_id(username), receiver:profiles!receiver_id(username)')
        .or(`content.ilike.%${query}%,message.ilike.%${query}%`)
        .limit(20);
      results.messages = messages || [];
    }

    return results;
  };

  const fetchFlags = async () => {
    const { data, error } = await requireSupabase()
      .from('user_flags')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setFlags(data || []);
    }
  };

  const fetchSuspensions = async () => {
    const { data, error } = await requireSupabase()
      .from('user_suspensions')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setSuspensions(data || []);
    }
  };

  const fetchActivityLogs = async (limit: number = 100) => {
    const { data, error } = await requireSupabase()
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      setError(error.message);
    } else {
      setActivityLogs(data || []);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchFlags(),
        fetchSuspensions(),
        fetchActivityLogs()
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    flags,
    suspensions,
    activityLogs,
    loading,
    error,
    isSitemaster,
    flagUser,
    resolveFlag,
    suspendUser,
    liftSuspension,
    deleteContent,
    sendAdminMessage,
    searchUsers,
    searchListings,
    getUserActivity,
    getPlatformStats,
    getSetting,
    updateSetting,
    getSettingsByCategory,
    getFeatureToggles,
    toggleFeature,
    getRateConfigurations,
    updateRate,
    getEscrowOrders,
    cancelEscrowOrder,
    forceReleaseEscrow,
    searchTransactions,
    getAllMessages,
    getAllPosts,
    getAllProducts,
    getAllUsers,
    getUserDetails,
    updateUserProfile,
    deleteUser,
    getAllTransactions,
    getTransactionDetails,
    refundTransaction,
    getEscrowStatistics,
    getPlatformAnalytics,
    bulkSuspendUsers,
    bulkDeleteContent,
    advancedSearch,
    refresh: fetchAll
  };
}
