import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (category?: string, search?: string) => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .eq('in_stock', true)
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProducts((data as Product[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
