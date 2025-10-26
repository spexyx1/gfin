import { useState, useEffect } from 'react';
import { supabase, requireSupabase, handleSupabaseError } from '../lib/supabase';

interface TermsOfService {
  id: string;
  version: string;
  title: string;
  content: string;
  effective_date: string;
  is_current: boolean;
  created_at: string;
}

interface TermsAcceptance {
  id: string;
  user_id: string;
  terms_version: string;
  ip_address?: string;
  user_agent?: string;
  accepted_at: string;
  acceptance_method: string;
}

export function useTerms() {
  const [currentTerms, setCurrentTerms] = useState<TermsOfService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentTerms();
  }, []);

  const loadCurrentTerms = async () => {
    try {
      setIsLoading(true);
      const supabaseClient = requireSupabase();

      const { data, error } = await supabaseClient
        .from('terms_of_service')
        .select('*')
        .eq('is_current', true)
        .single();

      if (error) throw error;

      setCurrentTerms(data);
      setError(null);
    } catch (err) {
      console.error('Error loading terms:', err);
      setError('Failed to load terms of service');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserAcceptance = async (userId: string): Promise<boolean> => {
    try {
      const supabaseClient = requireSupabase();

      if (!currentTerms) {
        await loadCurrentTerms();
        return false;
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('terms_accepted, current_terms_version')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      return profile?.terms_accepted === true &&
             profile?.current_terms_version === currentTerms.version;
    } catch (err) {
      console.error('Error checking user acceptance:', err);
      return false;
    }
  };

  const acceptTerms = async (
    userId: string,
    acceptanceMethod: string = 'manual'
  ): Promise<void> => {
    try {
      const supabaseClient = requireSupabase();

      if (!currentTerms) {
        throw new Error('No current terms available');
      }

      const userAgent = navigator.userAgent;
      let ipAddress = 'unknown';

      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (ipError) {
        console.warn('Could not fetch IP address:', ipError);
      }

      const { error: acceptanceError } = await supabaseClient
        .from('terms_acceptances')
        .insert({
          user_id: userId,
          terms_version: currentTerms.version,
          ip_address: ipAddress,
          user_agent: userAgent,
          acceptance_method: acceptanceMethod,
          accepted_at: new Date().toISOString(),
        });

      if (acceptanceError) throw acceptanceError;

      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          terms_accepted: true,
          current_terms_version: currentTerms.version,
          terms_accepted_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

    } catch (err) {
      handleSupabaseError(err);
      throw err;
    }
  };

  const getUserAcceptanceHistory = async (userId: string): Promise<TermsAcceptance[]> => {
    try {
      const supabaseClient = requireSupabase();

      const { data, error } = await supabaseClient
        .from('terms_acceptances')
        .select('*')
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error loading acceptance history:', err);
      return [];
    }
  };

  const getAllTermsVersions = async (): Promise<TermsOfService[]> => {
    try {
      const supabaseClient = requireSupabase();

      const { data, error } = await supabaseClient
        .from('terms_of_service')
        .select('*')
        .order('effective_date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error loading terms versions:', err);
      return [];
    }
  };

  const createNewTermsVersion = async (
    version: string,
    title: string,
    content: string,
    effectiveDate: string,
    createdBy: string
  ): Promise<void> => {
    try {
      const supabaseClient = requireSupabase();

      const { error } = await supabaseClient
        .from('terms_of_service')
        .insert({
          version,
          title,
          content,
          effective_date: effectiveDate,
          is_current: true,
          created_by: createdBy,
        });

      if (error) throw error;

      await loadCurrentTerms();
    } catch (err) {
      handleSupabaseError(err);
      throw err;
    }
  };

  const getUsersRequiringAcceptance = async (): Promise<number> => {
    try {
      const supabaseClient = requireSupabase();

      if (!currentTerms) return 0;

      const { count, error } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or(`terms_accepted.is.false,current_terms_version.neq.${currentTerms.version}`);

      if (error) throw error;

      return count || 0;
    } catch (err) {
      console.error('Error counting users requiring acceptance:', err);
      return 0;
    }
  };

  return {
    currentTerms,
    isLoading,
    error,
    loadCurrentTerms,
    checkUserAcceptance,
    acceptTerms,
    getUserAcceptanceHistory,
    getAllTermsVersions,
    createNewTermsVersion,
    getUsersRequiringAcceptance,
  };
}
