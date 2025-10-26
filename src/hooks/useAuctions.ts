import { useState, useEffect } from 'react';
import { supabase, requireSupabase, handleSupabaseError, isSupabaseConfigured } from '../lib/supabase';
import { Auction, AuctionFormData } from '../types';
import { useAuth } from './useAuth';

export function useAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadAuctions = async (filters?: {
    status?: 'active' | 'ended' | 'cancelled';
    auctionType?: 'english' | 'dutch';
    sellerId?: string;
    endingSoon?: boolean;
  }) => {
    if (!isSupabaseConfigured()) {
      setAuctions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabaseClient = requireSupabase();

      let query = supabaseClient
        .from('auctions')
        .select(`
          *,
          product:product_id (
            id,
            title,
            description,
            category,
            images,
            tags
          ),
          seller:seller_id (
            id,
            display_name,
            username,
            verified,
            rating
          )
        `);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.auctionType) {
        query = query.eq('auction_type', filters.auctionType);
      }

      if (filters?.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }

      if (filters?.endingSoon) {
        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        query = query
          .eq('status', 'active')
          .lte('end_time', oneHourFromNow)
          .gte('end_time', new Date().toISOString());
      }

      query = query.order('end_time', { ascending: true });

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const formattedAuctions: Auction[] = (data || []).map((auction: any) => ({
        id: auction.id,
        productId: auction.product_id,
        sellerId: auction.seller_id,
        auctionType: auction.auction_type,
        startPrice: parseFloat(auction.start_price),
        reservePrice: auction.reserve_price ? parseFloat(auction.reserve_price) : undefined,
        currentPrice: parseFloat(auction.current_price),
        buyNowPrice: auction.buy_now_price ? parseFloat(auction.buy_now_price) : undefined,
        startTime: new Date(auction.start_time),
        endTime: new Date(auction.end_time),
        originalEndTime: new Date(auction.original_end_time),
        status: auction.status,
        winnerId: auction.winner_id,
        totalBids: auction.total_bids,
        viewCount: auction.view_count,
        extensionCount: auction.extension_count,
        dutchDecrementHours: auction.dutch_decrement_hours,
        dutchDecrementPercent: parseFloat(auction.dutch_decrement_percent),
        createdAt: new Date(auction.created_at),
        updatedAt: new Date(auction.updated_at),
        product: auction.product ? {
          id: auction.product.id,
          title: auction.product.title,
          description: auction.product.description,
          price: 0,
          currency: 'USDC',
          image: auction.product.images?.[0]?.url || '',
          category: auction.product.category,
          seller: {
            id: auction.seller.id,
            name: auction.seller.display_name || auction.seller.username,
            rating: auction.seller.rating || 0,
            verified: auction.seller.verified || false,
          },
          inStock: true,
          tags: auction.product.tags || [],
          createdAt: new Date(),
        } : undefined,
        seller: auction.seller ? {
          id: auction.seller.id,
          name: auction.seller.display_name || auction.seller.username,
          username: auction.seller.username,
          verified: auction.seller.verified || false,
          rating: auction.seller.rating || 0,
        } : undefined,
      }));

      setAuctions(formattedAuctions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load auctions';
      setError(errorMessage);
      handleSupabaseError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuctionById = async (auctionId: string): Promise<Auction | null> => {
    if (!isSupabaseConfigured()) return null;

    try {
      const supabaseClient = requireSupabase();

      const { data, error: queryError } = await supabaseClient
        .from('auctions')
        .select(`
          *,
          product:product_id (
            id,
            title,
            description,
            category,
            images,
            tags
          ),
          seller:seller_id (
            id,
            display_name,
            username,
            verified,
            rating
          ),
          winner:winner_id (
            id,
            display_name,
            username
          )
        `)
        .eq('id', auctionId)
        .single();

      if (queryError) throw queryError;
      if (!data) return null;

      await supabaseClient.rpc('increment_auction_views', { p_auction_id: auctionId });

      return {
        id: data.id,
        productId: data.product_id,
        sellerId: data.seller_id,
        auctionType: data.auction_type,
        startPrice: parseFloat(data.start_price),
        reservePrice: data.reserve_price ? parseFloat(data.reserve_price) : undefined,
        currentPrice: parseFloat(data.current_price),
        buyNowPrice: data.buy_now_price ? parseFloat(data.buy_now_price) : undefined,
        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time),
        originalEndTime: new Date(data.original_end_time),
        status: data.status,
        winnerId: data.winner_id,
        totalBids: data.total_bids,
        viewCount: data.view_count,
        extensionCount: data.extension_count,
        dutchDecrementHours: data.dutch_decrement_hours,
        dutchDecrementPercent: parseFloat(data.dutch_decrement_percent),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        product: data.product ? {
          id: data.product.id,
          title: data.product.title,
          description: data.product.description,
          price: 0,
          currency: 'USDC',
          image: data.product.images?.[0]?.url || '',
          category: data.product.category,
          seller: {
            id: data.seller.id,
            name: data.seller.display_name || data.seller.username,
            rating: data.seller.rating || 0,
            verified: data.seller.verified || false,
          },
          inStock: true,
          tags: data.product.tags || [],
          createdAt: new Date(),
        } : undefined,
        seller: data.seller ? {
          id: data.seller.id,
          name: data.seller.display_name || data.seller.username,
          username: data.seller.username,
          verified: data.seller.verified || false,
          rating: data.seller.rating || 0,
        } : undefined,
        winner: data.winner ? {
          id: data.winner.id,
          name: data.winner.display_name || data.winner.username,
          username: data.winner.username,
        } : undefined,
      };
    } catch (err) {
      handleSupabaseError(err);
      return null;
    }
  };

  const createAuction = async (formData: AuctionFormData): Promise<Auction | null> => {
    if (!isSupabaseConfigured() || !user) {
      setError('Authentication required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabaseClient = requireSupabase();

      const endTime = new Date(Date.now() + formData.durationMinutes * 60 * 1000);

      const { data, error: insertError } = await supabaseClient
        .from('auctions')
        .insert({
          product_id: formData.productId,
          seller_id: user.id,
          auction_type: formData.auctionType,
          start_price: formData.startPrice,
          reserve_price: formData.reservePrice || null,
          current_price: formData.startPrice,
          buy_now_price: formData.buyNowPrice || null,
          end_time: endTime.toISOString(),
          original_end_time: endTime.toISOString(),
          dutch_decrement_hours: formData.dutchDecrementHours || 24,
          dutch_decrement_percent: formData.dutchDecrementPercent || 10,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await supabaseClient
        .from('products')
        .update({ is_auction: true, status: 'active' })
        .eq('id', formData.productId);

      return await loadAuctionById(data.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create auction';
      setError(errorMessage);
      handleSupabaseError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAuction = async (auctionId: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !user) {
      setError('Authentication required');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabaseClient = requireSupabase();

      const auction = await loadAuctionById(auctionId);
      if (!auction || auction.sellerId !== user.id) {
        throw new Error('Unauthorized or auction not found');
      }

      if (auction.totalBids > 0) {
        throw new Error('Cannot cancel auction with bids');
      }

      const { error: updateError } = await supabaseClient
        .from('auctions')
        .update({ status: 'cancelled' })
        .eq('id', auctionId);

      if (updateError) throw updateError;

      await supabaseClient
        .from('products')
        .update({ is_auction: false, status: 'active' })
        .eq('id', auction.productId);

      await loadAuctions();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel auction';
      setError(errorMessage);
      handleSupabaseError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const closeExpiredAuctions = async (): Promise<void> => {
    if (!isSupabaseConfigured()) return;

    try {
      const supabaseClient = requireSupabase();
      await supabaseClient.rpc('close_expired_auctions');
    } catch (err) {
      handleSupabaseError(err);
    }
  };

  const calculateDutchPrice = async (auctionId: string): Promise<number | null> => {
    if (!isSupabaseConfigured()) return null;

    try {
      const supabaseClient = requireSupabase();
      const { data, error } = await supabaseClient.rpc('calculate_dutch_price', {
        p_auction_id: auctionId,
      });

      if (error) throw error;
      return parseFloat(data);
    } catch (err) {
      handleSupabaseError(err);
      return null;
    }
  };

  const getMyActiveBids = async (): Promise<Auction[]> => {
    if (!isSupabaseConfigured() || !user) return [];

    try {
      const supabaseClient = requireSupabase();

      const { data, error } = await supabaseClient
        .from('auction_bids')
        .select(`
          auction_id,
          auctions!inner (
            *,
            product:product_id (
              id,
              title,
              description,
              category,
              images
            ),
            seller:seller_id (
              id,
              display_name,
              username,
              verified,
              rating
            )
          )
        `)
        .eq('bidder_id', user.id)
        .eq('auctions.status', 'active');

      if (error) throw error;

      const uniqueAuctions = new Map();
      data?.forEach((item: any) => {
        if (!uniqueAuctions.has(item.auction_id)) {
          const auction = item.auctions;
          uniqueAuctions.set(item.auction_id, {
            id: auction.id,
            productId: auction.product_id,
            sellerId: auction.seller_id,
            auctionType: auction.auction_type,
            startPrice: parseFloat(auction.start_price),
            reservePrice: auction.reserve_price ? parseFloat(auction.reserve_price) : undefined,
            currentPrice: parseFloat(auction.current_price),
            buyNowPrice: auction.buy_now_price ? parseFloat(auction.buy_now_price) : undefined,
            startTime: new Date(auction.start_time),
            endTime: new Date(auction.end_time),
            originalEndTime: new Date(auction.original_end_time),
            status: auction.status,
            winnerId: auction.winner_id,
            totalBids: auction.total_bids,
            viewCount: auction.view_count,
            extensionCount: auction.extension_count,
            dutchDecrementHours: auction.dutch_decrement_hours,
            dutchDecrementPercent: parseFloat(auction.dutch_decrement_percent),
            createdAt: new Date(auction.created_at),
            updatedAt: new Date(auction.updated_at),
            product: auction.product ? {
              id: auction.product.id,
              title: auction.product.title,
              description: auction.product.description,
              price: 0,
              currency: 'USDC' as const,
              image: auction.product.images?.[0]?.url || '',
              category: auction.product.category,
              seller: {
                id: auction.seller.id,
                name: auction.seller.display_name || auction.seller.username,
                rating: auction.seller.rating || 0,
                verified: auction.seller.verified || false,
              },
              inStock: true,
              tags: auction.product.tags || [],
              createdAt: new Date(),
            } : undefined,
            seller: auction.seller ? {
              id: auction.seller.id,
              name: auction.seller.display_name || auction.seller.username,
              username: auction.seller.username,
              verified: auction.seller.verified || false,
              rating: auction.seller.rating || 0,
            } : undefined,
          });
        }
      });

      return Array.from(uniqueAuctions.values());
    } catch (err) {
      handleSupabaseError(err);
      return [];
    }
  };

  const getWonAuctions = async (): Promise<Auction[]> => {
    if (!isSupabaseConfigured() || !user) return [];

    try {
      const supabaseClient = requireSupabase();

      const { data, error } = await supabaseClient
        .from('auctions')
        .select(`
          *,
          product:product_id (
            id,
            title,
            description,
            category,
            images
          ),
          seller:seller_id (
            id,
            display_name,
            username,
            verified,
            rating
          )
        `)
        .eq('winner_id', user.id)
        .eq('status', 'ended')
        .order('end_time', { ascending: false });

      if (error) throw error;

      return (data || []).map((auction: any) => ({
        id: auction.id,
        productId: auction.product_id,
        sellerId: auction.seller_id,
        auctionType: auction.auction_type,
        startPrice: parseFloat(auction.start_price),
        reservePrice: auction.reserve_price ? parseFloat(auction.reserve_price) : undefined,
        currentPrice: parseFloat(auction.current_price),
        buyNowPrice: auction.buy_now_price ? parseFloat(auction.buy_now_price) : undefined,
        startTime: new Date(auction.start_time),
        endTime: new Date(auction.end_time),
        originalEndTime: new Date(auction.original_end_time),
        status: auction.status,
        winnerId: auction.winner_id,
        totalBids: auction.total_bids,
        viewCount: auction.view_count,
        extensionCount: auction.extension_count,
        dutchDecrementHours: auction.dutch_decrement_hours,
        dutchDecrementPercent: parseFloat(auction.dutch_decrement_percent),
        createdAt: new Date(auction.created_at),
        updatedAt: new Date(auction.updated_at),
        product: auction.product ? {
          id: auction.product.id,
          title: auction.product.title,
          description: auction.product.description,
          price: 0,
          currency: 'USDC' as const,
          image: auction.product.images?.[0]?.url || '',
          category: auction.product.category,
          seller: {
            id: auction.seller.id,
            name: auction.seller.display_name || auction.seller.username,
            rating: auction.seller.rating || 0,
            verified: auction.seller.verified || false,
          },
          inStock: true,
          tags: auction.product.tags || [],
          createdAt: new Date(),
        } : undefined,
        seller: auction.seller ? {
          id: auction.seller.id,
          name: auction.seller.display_name || auction.seller.username,
          username: auction.seller.username,
          verified: auction.seller.verified || false,
          rating: auction.seller.rating || 0,
        } : undefined,
      }));
    } catch (err) {
      handleSupabaseError(err);
      return [];
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      loadAuctions({ status: 'active' });
    }
  }, []);

  return {
    auctions,
    isLoading,
    error,
    loadAuctions,
    loadAuctionById,
    createAuction,
    cancelAuction,
    closeExpiredAuctions,
    calculateDutchPrice,
    getMyActiveBids,
    getWonAuctions,
  };
}
