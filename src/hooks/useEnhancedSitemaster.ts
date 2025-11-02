import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('user_admin_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role_type', 'sitemaster')
      .eq('active', true)
      .maybeSingle();

    return !!data;
  };

  const flagUser = async (userId: string, flagType: string, reason: string, evidence: any = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const expiresAt = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
      : undefined;

    const { data, error } = await supabase
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
    const { error } = await supabase
      .from('user_suspensions')
      .update({ active: false })
      .eq('id', suspensionId);

    if (error) throw error;
    await fetchSuspensions();
  };

  const deleteContent = async (contentType: string, contentId: string, reason: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await supabase.from('content_moderation').insert({
      content_type: contentType,
      content_id: contentId,
      action: 'delete',
      moderator_id: user.id,
      reason,
      metadata: {}
    });

    if (contentType === 'product') {
      await supabase.from('products').delete().eq('id', contentId);
    } else if (contentType === 'post') {
      await supabase.from('social_posts').update({ deleted: true }).eq('id', contentId);
    }
  };

  const sendAdminMessage = async (recipientId: string, subject: string, message: string, priority: string = 'normal') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(50);

    if (error) throw error;
    return data;
  };

  const searchListings = async (query: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(50);

    if (error) throw error;
    return data;
  };

  const getUserActivity = async (userId: string, limit: number = 50) => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ActivityLog[];
  };

  const getPlatformStats = async () => {
    const [users, products, orders, activeSuspensions] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('user_suspensions').select('id', { count: 'exact', head: true }).eq('active', true)
    ]);

    return {
      totalUsers: users.count || 0,
      totalProducts: products.count || 0,
      totalOrders: orders.count || 0,
      activeSuspensions: activeSuspensions.count || 0
    };
  };

  const getSetting = async (key: string) => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('setting_key', key)
      .maybeSingle();

    if (error) throw error;
    return data as PlatformSettings | null;
  };

  const updateSetting = async (key: string, value: any, category: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('category', category)
      .order('setting_key');

    if (error) throw error;
    return data as PlatformSettings[];
  };

  // Feature Toggle Management
  const getFeatureToggles = async () => {
    const { data, error } = await supabase
      .from('feature_toggles')
      .select('*')
      .order('feature_name');

    if (error) throw error;
    return data;
  };

  const toggleFeature = async (featureName: string, enabled: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('rate_configurations')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true });

    if (error) throw error;
    return data;
  };

  const updateRate = async (rateName: string, newValue: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
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
    let query = supabase
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (orderError) throw orderError;

    // Log the cancellation
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'sitemaster_cancel_order',
      details: { order_id: orderId, reason }
    });
  };

  const forceReleaseEscrow = async (orderId: string, reason: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'funds_released',
        funds_released_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    // Log the action
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'sitemaster_force_release',
      details: { order_id: orderId, reason }
    });
  };

  // Transaction Search and Management
  const searchTransactions = async (query: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)')
      .or(`id.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(50);

    if (error) throw error;
    return data;
  };

  const getAllMessages = async (limit: number = 100) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(username), receiver:profiles!receiver_id(username)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  };

  // View all platform data
  const getAllPosts = async (limit: number = 100) => {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*, author:profiles(username)')
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  };

  const getAllProducts = async (limit: number = 100) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, seller:profiles!seller_id(username)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  };

  const fetchFlags = async () => {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    refresh: fetchAll
  };
}
