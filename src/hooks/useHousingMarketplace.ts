import { useState, useEffect } from 'react';
import { requireSupabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { HousingProject, HousingNFT, TenantPartnership, ProjectUpdate } from '../types/housing';

export function useHousingMarketplace() {
  const [projects, setProjects] = useState<HousingProject[]>([]);
  const [myNFTs, setMyNFTs] = useState<HousingNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchMyNFTs();
  }, []);

  const fetchProjects = async () => {
    try {
      const db = requireSupabase();
      const { data, error } = await db
        .from('housing_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyNFTs = async () => {
    try {
      const db = requireSupabase();
      const { data: { user } } = await db.auth.getUser();
      if (!user) return;

      const { data, error } = await db
        .from('housing_nfts')
        .select('*')
        .eq('owner_id', user.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setMyNFTs(data || []);
    } catch (err: any) {
      logger.error('Error fetching NFTs', 'useHousingMarketplace', err);
    }
  };

  const purchaseNFT = async (projectId: string, price: number): Promise<boolean> => {
    try {
      const db = requireSupabase();
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Must be logged in to purchase');

      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');

      const ownershipPercentage = (1 / project.total_nft_supply) * 100;

      const { error } = await db
        .from('housing_nfts')
        .insert({
          project_id: projectId,
          owner_id: user.id,
          purchase_price: price,
          ownership_percentage: ownershipPercentage
        });

      if (error) throw error;

      await fetchProjects();
      await fetchMyNFTs();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const createProject = async (projectData: Partial<HousingProject>): Promise<boolean> => {
    try {
      const db = requireSupabase();
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { error } = await db
        .from('housing_projects')
        .insert({
          ...projectData,
          created_by: user.id
        });

      if (error) throw error;

      await fetchProjects();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getProjectUpdates = async (projectId: string): Promise<ProjectUpdate[]> => {
    try {
      const db = requireSupabase();
      const { data, error } = await db
        .from('project_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      logger.error('Error fetching updates', 'useHousingMarketplace', err);
      return [];
    }
  };

  const getProjectPartnerships = async (projectId: string): Promise<TenantPartnership[]> => {
    try {
      const db = requireSupabase();
      const { data, error } = await db
        .from('tenant_partnerships')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      logger.error('Error fetching partnerships', 'useHousingMarketplace', err);
      return [];
    }
  };

  const filterProjectsByLocation = (country?: string, city?: string) => {
    return projects.filter(p => {
      if (country && p.location_country !== country) return false;
      if (city && p.location_city !== city) return false;
      return true;
    });
  };

  const filterProjectsByStatus = (status: HousingProject['status']) => {
    return projects.filter(p => p.status === status);
  };

  return {
    projects,
    myNFTs,
    loading,
    error,
    purchaseNFT,
    createProject,
    getProjectUpdates,
    getProjectPartnerships,
    filterProjectsByLocation,
    filterProjectsByStatus,
    refresh: fetchProjects
  };
}
