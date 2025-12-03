export interface HousingProject {
  id: string;
  title: string;
  description: string;
  location_city: string;
  location_region: string;
  location_country: string;
  property_type: 'rehabilitation' | 'construction' | 'purchase';
  estimated_cost: number;
  funds_raised: number;
  nft_price: number;
  total_nft_supply: number;
  nfts_sold: number;
  property_images: string[];
  status: 'planning' | 'fundraising' | 'in_progress' | 'completed';
  impact_story?: string;
  latitude?: number;
  longitude?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  completion_date?: string;
}

export interface HousingNFT {
  id: string;
  project_id: string;
  token_id?: string;
  owner_id: string;
  purchase_price: number;
  purchase_date: string;
  ownership_percentage: number;
  contract_address?: string;
  metadata_uri?: string;
  created_at: string;
}

export interface TenantPartnership {
  id: string;
  project_id: string;
  sponsor_id: string;
  tenant_id: string;
  partnership_type: 'skills' | 'goods' | 'services' | 'mixed';
  tenant_offering: string;
  revenue_share_percentage: number;
  sponsor_share_percentage: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  total_revenue_generated: number;
  tenant_bio?: string;
  partnership_story?: string;
  started_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnershipRevenue {
  id: string;
  partnership_id: string;
  transaction_id?: string;
  revenue_amount: number;
  tenant_amount: number;
  sponsor_amount: number;
  platform_fee: number;
  created_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  update_type: 'milestone' | 'progress' | 'story' | 'completion';
  title: string;
  content: string;
  images: string[];
  posted_by: string;
  created_at: string;
}
