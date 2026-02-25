import { useState, useEffect } from 'react';
import { supabase, requireSupabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '../utils/logger';

export interface BusinessInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'reviewing' | 'responded' | 'closed';
  response: string | null;
  respondedBy: string | null;
  respondedAt: Date | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useBusinessInquiries() {
  const [inquiries, setInquiries] = useState<BusinessInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !supabase) return;

    loadInquiries();

    const channel = supabase
      .channel('business_inquiries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_inquiries',
        },
        () => {
          loadInquiries();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const loadInquiries = async () => {
    try {
      const supabaseClient = requireSupabase();
      const { data, error } = await supabaseClient
        .from('business_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setInquiries(
          data.map((row: any) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            subject: row.subject,
            message: row.message,
            status: row.status,
            response: row.response,
            respondedBy: row.responded_by,
            respondedAt: row.responded_at ? new Date(row.responded_at) : null,
            userId: row.user_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
          }))
        );
      }
    } catch (err) {
      logger.error('Failed to load business inquiries', 'useBusinessInquiries', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateInquiryStatus = async (
    inquiryId: string,
    status: BusinessInquiry['status']
  ): Promise<boolean> => {
    try {
      const supabaseClient = requireSupabase();
      const { error } = await supabaseClient
        .from('business_inquiries')
        .update({ status })
        .eq('id', inquiryId);

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error('Failed to update inquiry status', 'useBusinessInquiries', err);
      return false;
    }
  };

  const respondToInquiry = async (
    inquiryId: string,
    response: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const supabaseClient = requireSupabase();
      const { error } = await supabaseClient
        .from('business_inquiries')
        .update({
          response,
          status: 'responded',
          responded_by: user.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', inquiryId);

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error('Failed to respond to inquiry', 'useBusinessInquiries', err);
      return false;
    }
  };

  const getPendingCount = () => {
    return inquiries.filter((i) => i.status === 'pending').length;
  };

  const getInquiriesByStatus = (status: BusinessInquiry['status']) => {
    return inquiries.filter((i) => i.status === status);
  };

  return {
    inquiries,
    isLoading,
    updateInquiryStatus,
    respondToInquiry,
    getPendingCount,
    getInquiriesByStatus,
  };
}
