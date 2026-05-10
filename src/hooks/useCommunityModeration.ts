import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '../utils/logger';

export interface ProhibitedCategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  legal_reference: string;
  icon: string;
  is_active: boolean;
}

export interface ModeratorReputation {
  user_id: string;
  reports_submitted: number;
  reports_validated: number;
  false_positives: number;
  accuracy_rate: number;
  reputation_tier: 'observer' | 'guardian' | 'sentinel' | 'protector' | 'champion';
  total_rewards_earned: number;
  current_streak: number;
  longest_streak: number;
  last_report_date: string;
}

export interface ModerationReward {
  id: string;
  report_id: string;
  reporter_id: string;
  amount: number;
  reward_type: 'base' | 'severity_bonus' | 'accuracy_bonus' | 'speed_bonus' | 'streak_bonus' | 'first_reporter';
  validation_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  notes: string | null;
}

export interface ContentFlag {
  id: string;
  product_id: string;
  reporter_id: string;
  prohibited_category_id: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  evidence_urls: string[];
  priority_score: number;
  status: 'pending' | 'under_review' | 'validated' | 'rejected' | 'appealed';
  assigned_to: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export function useCommunityModeration() {
  const { user } = useAuth();
  const [prohibitedCategories, setProhibitedCategories] = useState<ProhibitedCategory[]>([]);
  const [reputation, setReputation] = useState<ModeratorReputation | null>(null);
  const [rewards, setRewards] = useState<ModerationReward[]>([]);
  const [reports, setReports] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProhibitedCategories();
    if (user) {
      fetchReputation();
      fetchRewards();
      fetchReports();
    }
  }, [user]);

  const fetchProhibitedCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('prohibited_categories')
        .select('*')
        .eq('is_active', true)
        .order('severity', { ascending: false });

      if (error) throw error;
      setProhibitedCategories(data || []);
    } catch (error) {
      logger.error('Error fetching prohibited categories', 'useCommunityModeration', error);
    }
  };

  const fetchReputation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('community_moderator_reputation')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setReputation(data);
    } catch (error) {
      logger.error('Error fetching reputation', 'useCommunityModeration', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('moderation_rewards')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      logger.error('Error fetching rewards', 'useCommunityModeration', error);
    }
  };

  const fetchReports = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('content_flags_queue')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      logger.error('Error fetching reports', 'useCommunityModeration', error);
    }
  };

  const submitReport = async (params: {
    productId: string;
    prohibitedCategoryId?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    evidenceUrls?: string[];
    isAnonymous?: boolean;
  }) => {
    if (!user) {
      throw new Error('Must be logged in to submit reports');
    }

    try {
      const reporterAccuracy = reputation?.accuracy_rate || 0;

      const reportCount = await getReportCountForProduct(params.productId);

      const priorityScore = calculatePriorityScore(
        params.severity,
        reportCount,
        reporterAccuracy
      );

      const { data, error } = await supabase
        .from('content_flags_queue')
        .insert({
          product_id: params.productId,
          reporter_id: user.id,
          prohibited_category_id: params.prohibitedCategoryId,
          severity: params.severity,
          reason: params.reason,
          evidence_urls: params.evidenceUrls || [],
          priority_score: priorityScore,
          is_anonymous: params.isAnonymous || false,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      await fetchReports();
      await fetchReputation();

      return data;
    } catch (error) {
      logger.error('Error submitting report', 'useCommunityModeration', error);
      throw error;
    }
  };

  const getReportCountForProduct = async (productId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('content_flags_queue')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error getting report count', 'useCommunityModeration', error);
      return 0;
    }
  };

  const calculatePriorityScore = (
    severity: string,
    reportCount: number,
    reporterAccuracy: number
  ): number => {
    const severityScore = {
      critical: 40,
      high: 30,
      medium: 20,
      low: 10,
    }[severity] || 10;

    const reportScore = Math.min(reportCount * 10, 40);

    const accuracyScore = reporterAccuracy >= 90 ? 20 : reporterAccuracy >= 75 ? 10 : 0;

    return severityScore + reportScore + accuracyScore;
  };

  const estimateReward = (severity: 'low' | 'medium' | 'high' | 'critical'): { min: number; max: number } => {
    const accuracyRate = reputation?.accuracy_rate || 0;
    const accuracyMultiplier = accuracyRate >= 90 ? 1.10 : accuracyRate >= 75 ? 1.05 : 1.00;

    const baseRewards = {
      critical: 500,
      high: 100,
      medium: 25,
      low: 5,
    };

    const baseAmount = baseRewards[severity];
    const withAccuracy = baseAmount * accuracyMultiplier;
    const withFirstReporterBonus = withAccuracy * 1.20;

    return {
      min: Math.round(withAccuracy),
      max: Math.round(withFirstReporterBonus),
    };
  };

  const getTotalEarnings = (): number => {
    return rewards
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const getPendingEarnings = (): number => {
    return rewards
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const getLeaderboard = async (limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('community_moderator_reputation')
        .select('user_id, reputation_tier, reports_validated, accuracy_rate, total_rewards_earned')
        .order('total_rewards_earned', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching leaderboard', 'useCommunityModeration', error);
      return [];
    }
  };

  return {
    prohibitedCategories,
    reputation,
    rewards,
    reports,
    loading,
    submitReport,
    estimateReward,
    getTotalEarnings,
    getPendingEarnings,
    getLeaderboard,
    refetch: () => {
      fetchProhibitedCategories();
      if (user) {
        fetchReputation();
        fetchRewards();
        fetchReports();
      }
    },
  };
}
