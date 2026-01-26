import { useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase, requireSupabase, handleSupabaseError, isSupabaseConfigured } from '../lib/supabase';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    if (!isSupabaseConfigured()) {
      setProducts([]);
      setIsLoading(false);
      setError('Database not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabaseClient = requireSupabase();

      const { data: productsData, error } = await supabaseClient
        .from('products')
        .select(`
          *,
          seller:seller_id(
            id,
            username,
            display_name,
            verified,
            rating
          )
        `)
        .eq('status', 'active')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setError(error.message);
        return;
      }

      const formattedProducts: Product[] = productsData?.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: parseFloat(product.price_usdc),
        currency: 'GHETTO',
        image: product.images && product.images.length > 0
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
      })) || [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
      setError(error instanceof Error ? error.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Increment view count for a product
  const incrementViewCount = async (productId: string) => {
    if (!isSupabaseConfigured()) return;
    
    try {
      const supabaseClient = requireSupabase();
      
      const { error } = await supabaseClient.rpc('increment_product_views', {
        product_id: productId
      });

      if (error) {
        console.error('Failed to increment view count:', error);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  // Toggle favorite for a product
  const toggleFavorite = async (productId: string, isFavorited: boolean) => {
    if (!isSupabaseConfigured()) return;
    
    try {
      const supabaseClient = requireSupabase();
      
      const { error } = await supabaseClient.rpc('toggle_product_favorite', {
        product_id: productId,
        increment: isFavorited
      });

      if (error) {
        console.error('Failed to toggle favorite:', error);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const searchProducts = async (query: string, filters?: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    tags?: string[];
  }) => {
    if (!isSupabaseConfigured()) {
      setProducts([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabaseClient = requireSupabase();

      let queryBuilder = supabaseClient
        .from('products')
        .select(`
          *,
          seller:seller_id(
            id,
            username,
            display_name,
            verified,
            rating
          )
        `)
        .eq('status', 'active')
        .eq('in_stock', true);

      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (filters?.category && filters.category !== 'all') {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }

      if (filters?.priceMin !== undefined) {
        queryBuilder = queryBuilder.gte('price', filters.priceMin);
      }
      if (filters?.priceMax !== undefined) {
        queryBuilder = queryBuilder.lte('price', filters.priceMax);
      }

      if (filters?.tags && filters.tags.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', filters.tags);
      }

      const { data: productsData, error } = await queryBuilder
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedProducts: Product[] = productsData?.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: parseFloat(product.price_usdc),
        currency: 'GHETTO',
        image: product.images && product.images.length > 0
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
      })) || [];

      setProducts(formattedProducts);
      return formattedProducts;
    } catch (error) {
      console.error('Failed to search products:', error);
      setError(error instanceof Error ? error.message : 'Failed to search products');
      handleSupabaseError(error);
      setProducts([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get products by category
  const getProductsByCategory = (category: string) => {
    if (category === 'all') return products;
    return products.filter(product => product.category === category);
  };

  // Get product by ID
  const getProductById = (productId: string) => {
    return products.find(product => product.id === productId);
  };

  // Get unique categories
  const getCategories = () => {
    const categories = Array.from(new Set(products.map(product => product.category)));
    return ['all', ...categories];
  };

  // Get unique tags
  const getTags = () => {
    const allTags = products.flatMap(product => product.tags);
    return Array.from(new Set(allTags));
  };

  return {
    products,
    isLoading,
    error,
    loadProducts,
    searchProducts,
    getProductsByCategory,
    getProductById,
    getCategories,
    getTags,
    incrementViewCount,
    toggleFavorite,
  };
}