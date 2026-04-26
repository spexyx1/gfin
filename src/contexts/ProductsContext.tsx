import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types';
import { supabase, requireSupabase, handleSupabaseError, isSupabaseConfigured } from '../lib/supabase';
import { realtimeService } from '../services/realtimeService';
import { logger } from '../utils/logger';

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  loadProducts: () => Promise<void>;
  searchProducts: (query: string, filters?: ProductFilters) => Promise<Product[]>;
  getProductsByCategory: (category: string) => Product[];
  getProductById: (id: string) => Product | undefined;
  getCategories: () => string[];
  getTags: () => string[];
  incrementViewCount: (productId: string) => Promise<void>;
  toggleFavorite: (productId: string, isFavorited: boolean) => Promise<void>;
}

export interface ProductFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
}

const ProductsContext = createContext<ProductsContextType | null>(null);

function formatProduct(product: any): Product {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: parseFloat(product.price_usdc),
    currency: 'GHETTO',
    image: product.images?.length
      ? product.images.find((img: any) => img.isPrimary)?.url || product.images[0]?.url
      : '',
    category: product.category,
    seller: {
      id: product.seller.id,
      name: product.seller.display_name || product.seller.username,
      rating: product.seller.rating || 0,
      verified: product.seller.verified || false,
    },
    inStock: product.in_stock,
    tags: product.tags || [],
    createdAt: new Date(product.created_at),
  };
}

const PRODUCT_SELECT = `
  *,
  seller:seller_id(id, username, display_name, verified, rating)
`;

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setProducts([]);
      setIsLoading(false);
      setError('Database not configured');
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const client = requireSupabase();
      const { data, error: dbError } = await client
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'active')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (dbError) {
        logger.error('Error loading products', 'ProductsContext', dbError);
        setError(dbError.message);
        setProducts([]);
        return;
      }

      setProducts((data ?? []).map(formatProduct));
    } catch (err) {
      logger.error('Failed to load products', 'ProductsContext', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Subscribe to realtime product changes
  useEffect(() => {
    const sub = realtimeService.subscribeToProducts((payload) => {
      switch (payload.event) {
        case 'INSERT':
          setProducts(prev => [payload.product, ...prev]);
          break;
        case 'UPDATE':
          setProducts(prev => prev.map(p => p.id === payload.product.id ? payload.product : p));
          break;
        case 'DELETE':
          setProducts(prev => prev.filter(p => p.id !== payload.product.id));
          break;
      }
    });
    return () => sub.unsubscribe();
  }, []);

  const searchProducts = useCallback(async (query: string, filters?: ProductFilters): Promise<Product[]> => {
    if (!isSupabaseConfigured()) return [];
    setIsLoading(true);
    setError(null);
    try {
      const client = requireSupabase();
      let q = client
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'active')
        .eq('in_stock', true);

      if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      if (filters?.category && filters.category !== 'all') q = q.eq('category', filters.category);
      if (filters?.priceMin !== undefined) q = q.gte('price_usdc', filters.priceMin);
      if (filters?.priceMax !== undefined) q = q.lte('price_usdc', filters.priceMax);
      if (filters?.tags?.length) q = q.overlaps('tags', filters.tags);

      const { data, error: dbError } = await q.order('created_at', { ascending: false });
      if (dbError) throw dbError;

      const results = (data ?? []).map(formatProduct);
      setProducts(results);
      return results;
    } catch (err) {
      logger.error('Failed to search products', 'ProductsContext', err);
      setError(err instanceof Error ? err.message : 'Failed to search products');
      handleSupabaseError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProductsByCategory = useCallback((category: string) =>
    category === 'all' ? products : products.filter(p => p.category === category),
  [products]);

  const getProductById = useCallback((id: string) =>
    products.find(p => p.id === id),
  [products]);

  const getCategories = useCallback(() =>
    ['all', ...Array.from(new Set(products.map(p => p.category)))],
  [products]);

  const getTags = useCallback(() =>
    Array.from(new Set(products.flatMap(p => p.tags))),
  [products]);

  const incrementViewCount = useCallback(async (productId: string) => {
    if (!isSupabaseConfigured()) return;
    try {
      const client = requireSupabase();
      const { error: dbError } = await client.rpc('increment_product_views', { product_id: productId });
      if (dbError) logger.error('Failed to increment view count', 'ProductsContext', dbError);
    } catch (err) {
      logger.error('Error incrementing view count', 'ProductsContext', err);
    }
  }, []);

  const toggleFavorite = useCallback(async (productId: string, isFavorited: boolean) => {
    if (!isSupabaseConfigured()) return;
    try {
      const client = requireSupabase();
      const { error: dbError } = await client.rpc('toggle_product_favorite', {
        product_id: productId,
        increment: isFavorited,
      });
      if (dbError) logger.error('Failed to toggle favorite', 'ProductsContext', dbError);
    } catch (err) {
      logger.error('Error toggling favorite', 'ProductsContext', err);
    }
  }, []);

  return (
    <ProductsContext.Provider value={{
      products, isLoading, error,
      loadProducts, searchProducts,
      getProductsByCategory, getProductById,
      getCategories, getTags,
      incrementViewCount, toggleFavorite,
    }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}
