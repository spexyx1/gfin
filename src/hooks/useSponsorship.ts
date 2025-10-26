import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface SponsorshipRequest {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  amount_requested: number;
  revenue_percentage: number;
  duration_days: number;
  category: string;
  amount_funded: number;
  status: string;
  created_at: string;
  funded_at?: string;
  expires_at?: string;
  seller?: {
    username: string;
    reputation_score: number;
  };
  request?: {
    title: string;
    revenue_percentage: number;
  };
}

interface SponsorshipInvestment {
  id: string;
  request_id: string;
  sponsor_id: string;
  amount: number;
  percentage_share: number;
  revenue_earned: number;
  status: string;
  created_at: string;
  completed_at?: string;
  request?: {
    title: string;
    revenue_percentage: number;
    seller_id: string;
  };
}

interface SponsorshipTransaction {
  id: string;
  order_id: string;
  request_id: string;
  investment_id: string;
  sponsor_id: string;
  seller_id: string;
  order_amount: number;
  sponsor_cut: number;
  seller_amount: number;
  revenue_percentage: number;
  created_at: string;
}

interface CreateRequestParams {
  title: string;
  description: string;
  amount_requested: number;
  revenue_percentage: number;
  duration_days: number;
  category: string;
}

export function useSponsorship() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SponsorshipRequest[]>([]);
  const [myInvestments, setMyInvestments] = useState<SponsorshipInvestment[]>([]);
  const [myRequests, setMyRequests] = useState<SponsorshipRequest[]>([]);
  const [myTransactions, setMyTransactions] = useState<SponsorshipTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load active sponsorship requests
  const loadRequests = async () => {
    try {
      // Fetch sponsorship requests
      const { data: requests, error: requestsError } = await supabase
        .from('sponsorship_requests')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requests || requests.length === 0) {
        setRequests([]);
        return;
      }

      // Fetch seller profiles for all requests
      const sellerIds = [...new Set(requests.map(r => r.seller_id))];
      const { data: sellers, error: sellersError } = await supabase
        .from('profiles')
        .select('id, username, rating')
        .in('id', sellerIds);

      if (sellersError) throw sellersError;

      // Create a map of sellers by ID
      const sellerMap = new Map(sellers?.map(s => [s.id, s]) || []);

      // Map the data to match expected format
      const mappedData = requests.map((request: any) => {
        const seller = sellerMap.get(request.seller_id);
        return {
          ...request,
          seller: seller ? {
            username: seller.username || 'Unknown',
            reputation_score: seller.rating || 0
          } : undefined
        };
      });

      setRequests(mappedData as SponsorshipRequest[]);
    } catch (error) {
      console.error('Error loading requests:', error);
      setRequests([]);
    }
  };

  // Load user's investments
  const loadMyInvestments = async () => {
    if (!user) return;

    try {
      // Fetch investments
      const { data: investments, error: investmentsError } = await supabase
        .from('sponsorship_investments')
        .select('*')
        .eq('sponsor_id', user.id)
        .order('created_at', { ascending: false });

      if (investmentsError) throw investmentsError;

      if (!investments || investments.length === 0) {
        setMyInvestments([]);
        return;
      }

      // Fetch related requests
      const requestIds = [...new Set(investments.map(i => i.request_id))];
      const { data: requests, error: requestsError } = await supabase
        .from('sponsorship_requests')
        .select('id, title, revenue_percentage, seller_id')
        .in('id', requestIds);

      if (requestsError) throw requestsError;

      // Create a map of requests by ID
      const requestMap = new Map(requests?.map(r => [r.id, r]) || []);

      // Map the data to match expected format
      const mappedData = investments.map((investment: any) => {
        const request = requestMap.get(investment.request_id);
        return {
          ...investment,
          request: request ? {
            title: request.title || '',
            revenue_percentage: request.revenue_percentage || 0,
            seller_id: request.seller_id || ''
          } : undefined
        };
      });

      setMyInvestments(mappedData as SponsorshipInvestment[]);
    } catch (error) {
      console.error('Error loading investments:', error);
      setMyInvestments([]);
    }
  };

  // Load user's sponsorship requests
  const loadMyRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sponsorship_requests')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      console.error('Error loading my requests:', error);
      setMyRequests([]);
    }
  };

  // Load transaction history
  const loadMyTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sponsorship_transactions')
        .select('*')
        .or(`sponsor_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setMyTransactions([]);
    }
  };

  // Create a new sponsorship request
  const createRequest = async (params: CreateRequestParams) => {
    if (!user) throw new Error('Must be logged in');

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sponsorship_requests')
        .insert([
          {
            seller_id: user.id,
            title: params.title,
            description: params.description,
            amount_requested: params.amount_requested,
            revenue_percentage: params.revenue_percentage,
            duration_days: params.duration_days,
            category: params.category,
            status: 'active'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      await loadMyRequests();
      await loadRequests();

      return data;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Invest in a sponsorship request
  const investInRequest = async (requestId: string, amount: number) => {
    if (!user) throw new Error('Must be logged in');

    setIsLoading(true);
    try {
      // Check if request is still available
      const { data: request, error: requestError } = await supabase
        .from('sponsorship_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      if (!request) throw new Error('Request not found');

      const remainingAmount = request.amount_requested - request.amount_funded;
      if (amount > remainingAmount) {
        throw new Error(`Only ${remainingAmount} GHETTO remaining to fund`);
      }

      // Create investment
      const { data: investment, error: investError } = await supabase
        .from('sponsorship_investments')
        .insert([
          {
            request_id: requestId,
            sponsor_id: user.id,
            amount: amount,
            status: 'active'
          }
        ])
        .select()
        .single();

      if (investError) throw investError;

      // Reload data
      await loadRequests();
      await loadMyInvestments();

      return investment;
    } catch (error) {
      console.error('Error investing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a sponsorship request (only drafts)
  const cancelRequest = async (requestId: string) => {
    if (!user) throw new Error('Must be logged in');

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('sponsorship_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('seller_id', user.id)
        .eq('status', 'draft');

      if (error) throw error;

      await loadMyRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get analytics for a specific request
  const getRequestAnalytics = async (requestId: string) => {
    try {
      // Get total investments
      const { data: investments, error: invError } = await supabase
        .from('sponsorship_investments')
        .select('amount, revenue_earned')
        .eq('request_id', requestId);

      if (invError) throw invError;

      // Get transaction history
      const { data: transactions, error: txError } = await supabase
        .from('sponsorship_transactions')
        .select('sponsor_cut, order_amount')
        .eq('request_id', requestId);

      if (txError) throw txError;

      const totalInvested = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
      const totalRevenue = investments?.reduce((sum, inv) => sum + inv.revenue_earned, 0) || 0;
      const totalSales = transactions?.reduce((sum, tx) => sum + tx.order_amount, 0) || 0;
      const transactionCount = transactions?.length || 0;

      return {
        totalInvested,
        totalRevenue,
        totalSales,
        transactionCount,
        roi: totalInvested > 0 ? ((totalRevenue / totalInvested - 1) * 100) : 0
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalInvested: 0,
        totalRevenue: 0,
        totalSales: 0,
        transactionCount: 0,
        roi: 0
      };
    }
  };

  // Calculate sponsor payout for an order
  const calculateSponsorPayouts = async (orderId: string, sellerId: string, orderAmount: number) => {
    try {
      // Find active sponsorships for this seller
      const { data: activeRequests, error: reqError } = await supabase
        .from('sponsorship_requests')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('status', 'funded')
        .gte('expires_at', new Date().toISOString());

      if (reqError) throw reqError;
      if (!activeRequests || activeRequests.length === 0) return [];

      const payouts = [];

      for (const request of activeRequests) {
        // Get all investments for this request
        const { data: investments, error: invError } = await supabase
          .from('sponsorship_investments')
          .select('*')
          .eq('request_id', request.id)
          .eq('status', 'active');

        if (invError) throw invError;
        if (!investments || investments.length === 0) continue;

        // Calculate payout for each sponsor
        for (const investment of investments) {
          const sponsorCut = orderAmount * (request.revenue_percentage / 100) * (investment.percentage_share / 100);
          const sellerAmount = orderAmount - (orderAmount * (request.revenue_percentage / 100));

          payouts.push({
            order_id: orderId,
            request_id: request.id,
            investment_id: investment.id,
            sponsor_id: investment.sponsor_id,
            seller_id: sellerId,
            order_amount: orderAmount,
            sponsor_cut: sponsorCut,
            seller_amount: sellerAmount,
            revenue_percentage: request.revenue_percentage
          });

          // Update investment revenue
          await supabase
            .from('sponsorship_investments')
            .update({
              revenue_earned: investment.revenue_earned + sponsorCut
            })
            .eq('id', investment.id);
        }
      }

      return payouts;
    } catch (error) {
      console.error('Error calculating payouts:', error);
      return [];
    }
  };

  // Record sponsor transactions
  const recordSponsorTransactions = async (payouts: any[]) => {
    if (!payouts || payouts.length === 0) return;

    try {
      const { error } = await supabase
        .from('sponsorship_transactions')
        .insert(payouts);

      if (error) throw error;
    } catch (error) {
      console.error('Error recording transactions:', error);
      throw error;
    }
  };

  // Get seller's available selling limit from sponsorships
  const getSellerSponsorshipLimit = async (sellerId: string) => {
    try {
      const { data: requests, error } = await supabase
        .from('sponsorship_requests')
        .select('amount_funded')
        .eq('seller_id', sellerId)
        .eq('status', 'funded')
        .gte('expires_at', new Date().toISOString());

      if (error) throw error;

      const totalFunding = requests?.reduce((sum, req) => sum + req.amount_funded, 0) || 0;
      return totalFunding * 2; // 2:1 selling limit
    } catch (error) {
      console.error('Error getting sponsorship limit:', error);
      return 0;
    }
  };

  useEffect(() => {
    loadRequests();
    if (user) {
      loadMyInvestments();
      loadMyRequests();
      loadMyTransactions();
    }
  }, [user]);

  return {
    requests,
    myInvestments,
    myRequests,
    myTransactions,
    isLoading,
    createRequest,
    investInRequest,
    cancelRequest,
    getRequestAnalytics,
    calculateSponsorPayouts,
    recordSponsorTransactions,
    getSellerSponsorshipLimit,
    refreshData: () => {
      loadRequests();
      if (user) {
        loadMyInvestments();
        loadMyRequests();
        loadMyTransactions();
      }
    }
  };
}
