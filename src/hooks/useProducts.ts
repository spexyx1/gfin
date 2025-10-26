import { useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase, requireSupabase, handleSupabaseError, isSupabaseConfigured } from '../lib/supabase';
import { mockProducts } from '../data/mockData';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all active products from Supabase
  const loadProducts = async () => {
    // If Supabase is not configured, use mock data
    if (!isSupabaseConfigured()) {
      setProducts(mockProducts);
      setIsLoading(false);
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
        // If error, fall back to mock data
        setProducts(mockProducts);
        setIsLoading(false);
        return;
      }

      // Convert database records to Product format
      const formattedProducts: Product[] = productsData?.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: parseFloat(product.price_usdc),
        currency: 'GHETTO',
        image: product.images && product.images.length > 0
          ? product.images.find((img: any) => img.isPrimary)?.url || product.images[0]?.url
          : 'https://images.pexels.com/photos/7567482/pexels-photo-7567482.jpeg?auto=compress&cs=tinysrgb&w=400',
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

      // If no products in database, use mock data
      if (formattedProducts.length === 0) {
        console.log('No products in database, using mock data');
        setProducts(mockProducts);
      } else {
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      setError(error instanceof Error ? error.message : 'Failed to load products');
      // Fall back to mock data on error
      setProducts(mockProducts);
    } finally {
      setIsLoading(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      loadProducts();
    } else {
      // Use mock data when Supabase is not configured
      setProducts(mockProducts);
      setIsLoading(false);
    }
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

  // Search products
  const searchProducts = async (query: string, filters?: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    tags?: string[];
  }) => {
    // If Supabase is not configured, filter mock data
    if (!isSupabaseConfigured()) {
      const filtered = mockProducts.filter(product => {
        const matchesQuery = !query || 
          product.title.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase());
        
        const matchesCategory = !filters?.category || filters.category === 'all' || product.category === filters.category;
        const matchesPrice = (!filters?.priceMin || product.price >= filters.priceMin) &&
                            (!filters?.priceMax || product.price <= filters.priceMax);
        const matchesTags = !filters?.tags || filters.tags.length === 0 ||
                           filters.tags.some(tag => product.tags.includes(tag));
        
        return matchesQuery && matchesCategory && matchesPrice && matchesTags;
      });
      
      setProducts(filtered);
      return filtered;
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

      // Add search query if provided
      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // Add category filter
      if (filters?.category && filters.category !== 'all') {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }

      // Add price range filter
      if (filters?.priceMin !== undefined) {
        queryBuilder = queryBuilder.gte('price', filters.priceMin);
      }
      if (filters?.priceMax !== undefined) {
        queryBuilder = queryBuilder.lte('price', filters.priceMax);
      }

      // Add tags filter
      if (filters?.tags && filters.tags.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', filters.tags);
      }

      const { data: productsData, error } = await queryBuilder
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convert database records to Product format
      const formattedProducts: Product[] = productsData?.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: parseFloat(product.price_usdc),
        currency: 'GHETTO',
        image: product.images && product.images.length > 0 
          ? product.images.find((img: any) => img.isPrimary)?.url || product.images[0]?.url
          : 'https://images.pexels.com/photos/7567482/pexels-photo-7567482.jpeg?auto=compress&cs=tinysrgb&w=400',
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