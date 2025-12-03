/*
  # Housing NFT Marketplace for Social Impact

  ## Overview
  Create an NFT marketplace where each NFT represents sponsorship of housing rehabilitation
  or construction in impoverished areas. Sponsors partner with tenants who offer their skills
  through the platform in exchange for revenue sharing.

  ## Mission
  - Help poverty-stricken families gain financial step-up through sponsored housing
  - Create direct relationships between donors and beneficiaries
  - Enable tenants to offer skills/goods through platform for revenue sharing
  - Revitalize impoverished areas globally (Detroit, Appalachia, LA, SF, New Orleans, Egypt, Cambodia, Thailand, Africa, India)

  ## New Tables
  1. housing_projects - Property listings needing rehabilitation/construction
  2. housing_nfts - NFT ownership records
  3. tenant_partnerships - Sponsor-tenant collaborations
  4. partnership_revenues - Revenue tracking and distribution
  5. project_updates - Progress documentation and impact stories
*/

-- Housing Projects Table
CREATE TABLE IF NOT EXISTS public.housing_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  location_city text NOT NULL,
  location_region text,
  location_country text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('rehabilitation', 'construction', 'purchase')),
  estimated_cost decimal(15,2) NOT NULL,
  funds_raised decimal(15,2) DEFAULT 0,
  nft_price decimal(10,2) NOT NULL,
  total_nft_supply integer NOT NULL,
  nfts_sold integer DEFAULT 0,
  property_images jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'fundraising', 'in_progress', 'completed')),
  impact_story text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completion_date date
);

-- Housing NFTs Table
CREATE TABLE IF NOT EXISTS public.housing_nfts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.housing_projects(id) ON DELETE CASCADE,
  token_id text,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purchase_price decimal(10,2) NOT NULL,
  purchase_date timestamptz DEFAULT now(),
  ownership_percentage decimal(5,4) NOT NULL,
  contract_address text,
  metadata_uri text,
  created_at timestamptz DEFAULT now()
);

-- Tenant Partnerships Table
CREATE TABLE IF NOT EXISTS public.tenant_partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.housing_projects(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partnership_type text NOT NULL CHECK (partnership_type IN ('skills', 'goods', 'services', 'mixed')),
  tenant_offering text NOT NULL,
  revenue_share_percentage decimal(5,2) NOT NULL DEFAULT 70.00,
  sponsor_share_percentage decimal(5,2) NOT NULL DEFAULT 25.00,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  total_revenue_generated decimal(15,2) DEFAULT 0,
  tenant_bio text,
  partnership_story text,
  started_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Partnership Revenues Table
CREATE TABLE IF NOT EXISTS public.partnership_revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid NOT NULL REFERENCES public.tenant_partnerships(id) ON DELETE CASCADE,
  transaction_id uuid,
  revenue_amount decimal(10,2) NOT NULL,
  tenant_amount decimal(10,2) NOT NULL,
  sponsor_amount decimal(10,2) NOT NULL,
  platform_fee decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Project Updates Table
CREATE TABLE IF NOT EXISTS public.project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.housing_projects(id) ON DELETE CASCADE,
  update_type text NOT NULL CHECK (update_type IN ('milestone', 'progress', 'story', 'completion')),
  title text NOT NULL,
  content text NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  posted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_housing_projects_status ON public.housing_projects(status);
CREATE INDEX IF NOT EXISTS idx_housing_projects_country ON public.housing_projects(location_country);
CREATE INDEX IF NOT EXISTS idx_housing_projects_city ON public.housing_projects(location_city);
CREATE INDEX IF NOT EXISTS idx_housing_projects_created_by ON public.housing_projects(created_by);
CREATE INDEX IF NOT EXISTS idx_housing_nfts_project_id ON public.housing_nfts(project_id);
CREATE INDEX IF NOT EXISTS idx_housing_nfts_owner_id ON public.housing_nfts(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenant_partnerships_project_id ON public.tenant_partnerships(project_id);
CREATE INDEX IF NOT EXISTS idx_tenant_partnerships_sponsor_id ON public.tenant_partnerships(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_tenant_partnerships_tenant_id ON public.tenant_partnerships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_partnerships_status ON public.tenant_partnerships(status);
CREATE INDEX IF NOT EXISTS idx_partnership_revenues_partnership_id ON public.partnership_revenues(partnership_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON public.project_updates(project_id);

-- Enable Row Level Security
ALTER TABLE public.housing_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for housing_projects
CREATE POLICY "Anyone can view housing projects"
  ON public.housing_projects FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can create housing projects"
  ON public.housing_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role_type IN ('sitemaster', 'treasurer')
      AND active = true
    )
  );

CREATE POLICY "Admins can update housing projects"
  ON public.housing_projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role_type IN ('sitemaster', 'treasurer')
      AND active = true
    )
  );

-- RLS Policies for housing_nfts
CREATE POLICY "Anyone can view NFTs"
  ON public.housing_nfts FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can purchase NFTs"
  ON public.housing_nfts FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- RLS Policies for tenant_partnerships
CREATE POLICY "Anyone can view partnerships"
  ON public.tenant_partnerships FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Sponsors can create partnerships"
  ON public.tenant_partnerships FOR INSERT
  TO authenticated
  WITH CHECK (
    sponsor_id = (SELECT auth.uid()) AND
    EXISTS (SELECT 1 FROM public.housing_nfts WHERE owner_id = (SELECT auth.uid()) AND project_id = tenant_partnerships.project_id)
  );

CREATE POLICY "Tenants and sponsors can update partnerships"
  ON public.tenant_partnerships FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT auth.uid()) OR sponsor_id = (SELECT auth.uid()));

-- RLS Policies for partnership_revenues
CREATE POLICY "Partners can view their revenues"
  ON public.partnership_revenues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_partnerships
      WHERE id = partnership_revenues.partnership_id
      AND (tenant_id = (SELECT auth.uid()) OR sponsor_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "System can create revenue records"
  ON public.partnership_revenues FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for project_updates
CREATE POLICY "Anyone can view project updates"
  ON public.project_updates FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins and tenants can create updates"
  ON public.project_updates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_admin_roles
      WHERE user_id = (SELECT auth.uid())
      AND role_type IN ('sitemaster', 'treasurer')
      AND active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.tenant_partnerships
      WHERE project_id = project_updates.project_id
      AND tenant_id = (SELECT auth.uid())
      AND status = 'active'
    )
  );

-- Function to update project funds when NFT is sold
CREATE OR REPLACE FUNCTION update_project_funds_on_nft_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.housing_projects
  SET 
    funds_raised = funds_raised + NEW.purchase_price,
    nfts_sold = nfts_sold + 1,
    updated_at = now()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_nft_purchase
  AFTER INSERT ON public.housing_nfts
  FOR EACH ROW
  EXECUTE FUNCTION update_project_funds_on_nft_sale();

-- Function to track partnership revenue
CREATE OR REPLACE FUNCTION calculate_partnership_revenue()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tenant_partnerships
  SET 
    total_revenue_generated = total_revenue_generated + NEW.revenue_amount,
    updated_at = now()
  WHERE id = NEW.partnership_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_partnership_revenue
  AFTER INSERT ON public.partnership_revenues
  FOR EACH ROW
  EXECUTE FUNCTION calculate_partnership_revenue();
