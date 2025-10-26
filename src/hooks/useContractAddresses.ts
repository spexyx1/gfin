import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ContractAddresses {
  ghettoToken: string | null;
  escrow: string | null;
  usdc: string | null;
}

export const useContractAddresses = (network: string) => {
  const [addresses, setAddresses] = useState<ContractAddresses>({
    ghettoToken: null,
    escrow: null,
    usdc: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContractAddresses = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('contract_deployments')
          .select('contract_name, contract_address')
          .eq('network', network)
          .eq('is_active', true);

        if (fetchError) throw fetchError;

        const addressMap: ContractAddresses = {
          ghettoToken: import.meta.env.VITE_GHETTO_TOKEN_ADDRESS || null,
          escrow: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || null,
          usdc: import.meta.env.VITE_USDC_CONTRACT_ADDRESS || null,
        };

        if (data) {
          data.forEach((deployment) => {
            if (deployment.contract_name === 'GhettoToken') {
              addressMap.ghettoToken = deployment.contract_address;
            } else if (deployment.contract_name === 'EscrowContract') {
              addressMap.escrow = deployment.contract_address;
            } else if (deployment.contract_name === 'USDC') {
              addressMap.usdc = deployment.contract_address;
            }
          });
        }

        setAddresses(addressMap);
      } catch (err) {
        console.error('Error fetching contract addresses:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch contract addresses');

        setAddresses({
          ghettoToken: import.meta.env.VITE_GHETTO_TOKEN_ADDRESS || null,
          escrow: import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || null,
          usdc: import.meta.env.VITE_USDC_CONTRACT_ADDRESS || null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContractAddresses();
  }, [network]);

  return { addresses, loading, error };
};
