import { useState, useEffect } from 'react';
import { supabase, requireSupabase, handleSupabaseError, isSupabaseConfigured } from '../lib/supabase';
import { AuctionBid } from '../types';
import { useAuth } from './useAuth';

export function useAuctionBids(auctionId?: string) {
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadBidHistory = async (targetAuctionId: string) => {
    if (!isSupabaseConfigured()) {
      setBids([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabaseClient = requireSupabase();

      const { data, error: queryError } = await supabaseClient
        .from('auction_bids')
        .select(`
          *,
          bidder:bidder_id (
            id,
            display_name,
            username,
            verified
          )
        `)
        .eq('auction_id', targetAuctionId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const formattedBids: AuctionBid[] = (data || []).map((bid: any) => ({
        id: bid.id,
        auctionId: bid.auction_id,
        bidderId: bid.bidder_id,
        amount: parseFloat(bid.amount),
        bidType: bid.bid_type,
        autoBidMax: bid.auto_bid_max ? parseFloat(bid.auto_bid_max) : undefined,
        isWinning: bid.is_winning,
        createdAt: new Date(bid.created_at),
        bidder: bid.bidder ? {
          id: bid.bidder.id,
          name: bid.bidder.display_name || bid.bidder.username,
          username: bid.bidder.username,
          verified: bid.bidder.verified || false,
        } : undefined,
      }));

      setBids(formattedBids);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bid history';
      setError(errorMessage);
      handleSupabaseError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const placeBid = async (targetAuctionId: string, amount: number, autoBidMax?: number): Promise<boolean> => {
    if (!isSupabaseConfigured() || !user) {
      setError('Authentication required');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabaseClient = requireSupabase();

      const isValid = await supabaseClient.rpc('validate_auction_bid', {
        p_auction_id: targetAuctionId,
        p_bidder_id: user.id,
        p_bid_amount: amount,
      });

      if (isValid.error) throw isValid.error;

      const { error: insertError } = await supabaseClient
        .from('auction_bids')
        .insert({
          auction_id: targetAuctionId,
          bidder_id: user.id,
          amount,
          bid_type: autoBidMax ? 'auto' : 'manual',
          auto_bid_max: autoBidMax || null,
        });

      if (insertError) throw insertError;

      await loadBidHistory(targetAuctionId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to place bid';
      setError(errorMessage);
      handleSupabaseError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getMyBids = async (targetAuctionId: string): Promise<AuctionBid[]> => {
    if (!isSupabaseConfigured() || !user) return [];

    try {
      const supabaseClient = requireSupabase();

      const { data, error: queryError } = await supabaseClient
        .from('auction_bids')
        .select('*')
        .eq('auction_id', targetAuctionId)
        .eq('bidder_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      return (data || []).map((bid: any) => ({
        id: bid.id,
        auctionId: bid.auction_id,
        bidderId: bid.bidder_id,
        amount: parseFloat(bid.amount),
        bidType: bid.bid_type,
        autoBidMax: bid.auto_bid_max ? parseFloat(bid.auto_bid_max) : undefined,
        isWinning: bid.is_winning,
        createdAt: new Date(bid.created_at),
      }));
    } catch (err) {
      handleSupabaseError(err);
      return [];
    }
  };

  const getWinningBid = async (targetAuctionId: string): Promise<AuctionBid | null> => {
    if (!isSupabaseConfigured()) return null;

    try {
      const supabaseClient = requireSupabase();

      const { data, error: queryError } = await supabaseClient
        .from('auction_bids')
        .select(`
          *,
          bidder:bidder_id (
            id,
            display_name,
            username,
            verified
          )
        `)
        .eq('auction_id', targetAuctionId)
        .eq('is_winning', true)
        .single();

      if (queryError || !data) return null;

      return {
        id: data.id,
        auctionId: data.auction_id,
        bidderId: data.bidder_id,
        amount: parseFloat(data.amount),
        bidType: data.bid_type,
        autoBidMax: data.auto_bid_max ? parseFloat(data.auto_bid_max) : undefined,
        isWinning: data.is_winning,
        createdAt: new Date(data.created_at),
        bidder: data.bidder ? {
          id: data.bidder.id,
          name: data.bidder.display_name || data.bidder.username,
          username: data.bidder.username,
          verified: data.bidder.verified || false,
        } : undefined,
      };
    } catch (err) {
      handleSupabaseError(err);
      return null;
    }
  };

  const isUserWinning = async (targetAuctionId: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !user) return false;

    try {
      const supabaseClient = requireSupabase();

      const { data, error: queryError } = await supabaseClient
        .from('auction_bids')
        .select('id')
        .eq('auction_id', targetAuctionId)
        .eq('bidder_id', user.id)
        .eq('is_winning', true)
        .maybeSingle();

      if (queryError) throw queryError;
      return !!data;
    } catch (err) {
      handleSupabaseError(err);
      return false;
    }
  };

  const calculateMinimumBid = (currentPrice: number): number => {
    const minIncrement = currentPrice * 0.05;
    return currentPrice + minIncrement;
  };

  const subscribeToBids = (targetAuctionId: string, onBidUpdate: (bid: AuctionBid) => void) => {
    if (!isSupabaseConfigured()) return () => {};

    const supabaseClient = requireSupabase();

    const subscription = supabaseClient
      .channel(`auction_bids:${targetAuctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_bids',
          filter: `auction_id=eq.${targetAuctionId}`,
        },
        async (payload) => {
          const newBid = payload.new as any;

          const { data: bidderData } = await supabaseClient
            .from('profiles')
            .select('id, display_name, username, verified')
            .eq('id', newBid.bidder_id)
            .single();

          const formattedBid: AuctionBid = {
            id: newBid.id,
            auctionId: newBid.auction_id,
            bidderId: newBid.bidder_id,
            amount: parseFloat(newBid.amount),
            bidType: newBid.bid_type,
            autoBidMax: newBid.auto_bid_max ? parseFloat(newBid.auto_bid_max) : undefined,
            isWinning: newBid.is_winning,
            createdAt: new Date(newBid.created_at),
            bidder: bidderData ? {
              id: bidderData.id,
              name: bidderData.display_name || bidderData.username,
              username: bidderData.username,
              verified: bidderData.verified || false,
            } : undefined,
          };

          onBidUpdate(formattedBid);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  useEffect(() => {
    if (auctionId && isSupabaseConfigured()) {
      loadBidHistory(auctionId);
    }
  }, [auctionId]);

  return {
    bids,
    isLoading,
    error,
    loadBidHistory,
    placeBid,
    getMyBids,
    getWinningBid,
    isUserWinning,
    calculateMinimumBid,
    subscribeToBids,
  };
}
