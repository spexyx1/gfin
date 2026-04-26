import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client only if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Helper function to ensure Supabase is available
export const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please connect to Supabase first.');
    }
  return supabase;
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  if (error?.message) {
    throw new Error(error.message);
  }
  throw new Error('An unexpected error occurred');
};

// Type definitions for database tables
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          bio: string | null;
          avatar: string | null;
          cover_image: string | null;
          location: string | null;
          website: string | null;
          joined_at: string;
          followers: string[];
          following: string[];
          is_verified: boolean;
          stealth_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          handle: string;
          display_name: string;
          bio?: string | null;
          avatar?: string | null;
          cover_image?: string | null;
          location?: string | null;
          website?: string | null;
          joined_at?: string;
          followers?: string[];
          following?: string[];
          is_verified?: boolean;
          stealth_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          handle?: string;
          display_name?: string;
          bio?: string | null;
          avatar?: string | null;
          cover_image?: string | null;
          location?: string | null;
          website?: string | null;
          joined_at?: string;
          followers?: string[];
          following?: string[];
          is_verified?: boolean;
          stealth_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          title: string;
          description: string;
          price_usdc: number;
          category: string;
          tags: string[];
          in_stock: boolean;
          seller_id: string;
          status: 'draft' | 'active' | 'paused' | 'sold';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          price_usdc: number;
          category: string;
          tags?: string[];
          in_stock?: boolean;
          seller_id: string;
          status?: 'draft' | 'active' | 'paused' | 'sold';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          price_usdc?: number;
          category?: string;
          tags?: string[];
          in_stock?: boolean;
          seller_id?: string;
          status?: 'draft' | 'active' | 'paused' | 'sold';
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          seller_id: string;
          product_id: string;
          amount: number;
          seller_hold_amount: number;
          status: 'created' | 'funded' | 'shipped' | 'delivered' | 'awaiting_release' | 'funds_released' | 'completed' | 'disputed' | 'cancelled';
          seller_agreed: boolean;
          description: string;
          payment_token: string;
          currency: string;
          funded_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          delivery_confirmed_at: string | null;
          funds_release_deadline: string | null;
          funds_released_at: string | null;
          auto_release_eligible: boolean;
          tracking_number: string | null;
          tracking_url: string | null;
          carrier: string | null;
          estimated_delivery: string | null;
          dispute_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          seller_id: string;
          product_id: string;
          amount: number;
          seller_hold_amount: number;
          status?: 'created' | 'funded' | 'shipped' | 'delivered' | 'awaiting_release' | 'funds_released' | 'completed' | 'disputed' | 'cancelled';
          seller_agreed?: boolean;
          description: string;
          payment_token?: string;
          currency?: string;
          funded_at?: string;
          shipped_at?: string;
          delivered_at?: string;
          delivery_confirmed_at?: string;
          funds_release_deadline?: string;
          funds_released_at?: string;
          auto_release_eligible?: boolean;
          tracking_number?: string;
          tracking_url?: string;
          carrier?: string;
          estimated_delivery?: string;
          dispute_reason?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          seller_id?: string;
          product_id?: string;
          amount?: number;
          seller_hold_amount?: number;
          status?: 'created' | 'funded' | 'shipped' | 'delivered' | 'awaiting_release' | 'funds_released' | 'completed' | 'disputed' | 'cancelled';
          seller_agreed?: boolean;
          description?: string;
          payment_token?: string;
          currency?: string;
          funded_at?: string;
          shipped_at?: string;
          delivered_at?: string;
          delivery_confirmed_at?: string;
          funds_release_deadline?: string;
          funds_released_at?: string;
          auto_release_eligible?: boolean;
          tracking_number?: string;
          tracking_url?: string;
          carrier?: string;
          estimated_delivery?: string;
          dispute_reason?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};