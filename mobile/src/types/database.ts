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
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
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
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          seller_id: string;
          product_id: string;
          amount: number;
          seller_hold_amount: number;
          status: OrderStatus;
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
          status?: OrderStatus;
          seller_agreed?: boolean;
          description: string;
          payment_token?: string;
          currency?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read?: boolean;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      social_posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          likes: number;
          comments_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          likes?: number;
          comments_count?: number;
        };
        Update: {
          content?: string;
          likes?: number;
          comments_count?: number;
        };
      };
    };
  };
};

export type OrderStatus =
  | 'created'
  | 'funded'
  | 'shipped'
  | 'delivered'
  | 'awaiting_release'
  | 'funds_released'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
