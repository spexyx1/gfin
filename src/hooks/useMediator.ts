import { useState, useEffect } from 'react';
import { requireSupabase } from '../lib/supabase';

export interface DisputeCase {
  id: string;
  case_number: string;
  order_id?: string;
  plaintiff_id: string;
  defendant_id: string;
  mediator_id?: string;
  status: string;
  visibility: string;
  title: string;
  description: string;
  resolution?: string;
  awarded_to?: string;
  escrow_amount?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface CaseEvidence {
  id: string;
  case_id: string;
  submitted_by: string;
  evidence_type: string;
  file_url?: string;
  description?: string;
  metadata: any;
  visible_to: string[];
  submitted_at: string;
}

export interface CaseComment {
  id: string;
  case_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  metadata: any;
  created_at: string;
}

export interface CaseAppeal {
  id: string;
  case_id: string;
  appealed_by: string;
  reason: string;
  status: string;
  reviewed_by?: string;
  decision?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface UserReputation {
  id: string;
  user_id: string;
  reputation_score: number;
  good_behavior_count: number;
  violation_count: number;
  report_accuracy_rate: number;
  rewards_earned: number;
  fines_paid: number;
  last_updated: string;
}

export function useMediator() {
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [appeals, setAppeals] = useState<CaseAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMediator = async () => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return false;

    const { data } = await db
      .from('user_admin_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role_type', 'mediator')
      .eq('active', true)
      .maybeSingle();

    return !!data;
  };

  const createCase = async (caseData: Partial<DisputeCase>) => {
    const db = requireSupabase();
    const caseNumber = `CASE-${Date.now()}`;

    const { data, error } = await db
      .from('dispute_cases')
      .insert({
        case_number: caseNumber,
        ...caseData
      })
      .select()
      .single();

    if (error) throw error;
    await fetchCases();
    return data;
  };

  const updateCase = async (caseId: string, updates: Partial<DisputeCase>) => {
    const db = requireSupabase();
    const { error } = await db
      .from('dispute_cases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', caseId);

    if (error) throw error;
    await fetchCases();
  };

  const resolveCase = async (caseId: string, resolution: string, awardedTo?: string) => {
    const db = requireSupabase();
    const { error } = await db
      .from('dispute_cases')
      .update({
        status: 'resolved',
        resolution,
        awarded_to: awardedTo,
        resolved_at: new Date().toISOString()
      })
      .eq('id', caseId);

    if (error) throw error;
    await fetchCases();
  };

  const getCaseEvidence = async (caseId: string) => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('case_evidence')
      .select('*')
      .eq('case_id', caseId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data as CaseEvidence[];
  };

  const addEvidence = async (caseId: string, evidenceData: Partial<CaseEvidence>) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('case_evidence')
      .insert({
        case_id: caseId,
        submitted_by: user.id,
        ...evidenceData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const getCaseComments = async (caseId: string) => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('case_comments')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as CaseComment[];
  };

  const addComment = async (caseId: string, content: string, isInternal: boolean = false) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('case_comments')
      .insert({
        case_id: caseId,
        author_id: user.id,
        content,
        is_internal: isInternal
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const assignModerator = async (caseId: string, moderatorId: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await db
      .from('moderator_assignments')
      .insert({
        case_id: caseId,
        moderator_id: moderatorId,
        assigned_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateReputation = async (
    userId: string,
    updates: Partial<UserReputation>
  ) => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('user_reputation')
      .upsert({
        user_id: userId,
        ...updates,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const rewardUser = async (userId: string, amount: number, reason: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await db.from('moderation_actions').insert({
      moderator_id: user.id,
      user_id: userId,
      action_type: 'reward',
      reason,
      details: JSON.stringify({ reward_amount: amount })
    });

    const { data: reputation } = await db
      .from('user_reputation')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    await updateReputation(userId, {
      rewards_earned: (reputation?.rewards_earned || 0) + amount,
      good_behavior_count: (reputation?.good_behavior_count || 0) + 1,
      reputation_score: (reputation?.reputation_score || 0) + 10
    });
  };

  const fineUser = async (userId: string, amount: number, reason: string) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await db.from('moderation_actions').insert({
      moderator_id: user.id,
      user_id: userId,
      action_type: 'fine',
      reason,
      details: JSON.stringify({ fine_amount: amount })
    });

    const { data: reputation } = await db
      .from('user_reputation')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    await updateReputation(userId, {
      fines_paid: (reputation?.fines_paid || 0) + amount,
      violation_count: (reputation?.violation_count || 0) + 1,
      reputation_score: Math.max(0, (reputation?.reputation_score || 0) - 20)
    });
  };

  const reviewAppeal = async (appealId: string, decision: string, approved: boolean) => {
    const db = requireSupabase();
    const { data: { user } } = await db.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await db
      .from('case_appeals')
      .update({
        status: approved ? 'approved' : 'denied',
        reviewed_by: user.id,
        decision,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', appealId);

    if (error) throw error;
    await fetchAppeals();
  };

  const fetchCases = async () => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('dispute_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setCases(data || []);
    }
  };

  const fetchAppeals = async () => {
    const db = requireSupabase();
    const { data, error } = await db
      .from('case_appeals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setAppeals(data || []);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCases(), fetchAppeals()]);
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
    cases,
    appeals,
    loading,
    error,
    isMediator,
    createCase,
    updateCase,
    resolveCase,
    getCaseEvidence,
    addEvidence,
    getCaseComments,
    addComment,
    assignModerator,
    updateReputation,
    rewardUser,
    fineUser,
    reviewAppeal,
    refresh: fetchAll
  };
}
