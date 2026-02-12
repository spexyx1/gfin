import { useState, useEffect } from 'react';
import { SellerProduct, ProductImage } from '../types';
import { useWeb3 } from './useWeb3';
import { supabase, requireSupabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from './useAuth';
import { logger } from '../utils/logger';

export function useSellerProducts() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load seller's products from Supabase
  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { data: productsData, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convert database records to SellerProduct format
      const sellerProducts: SellerProduct[] = productsData?.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: parseFloat(product.price_usdc),
        currency: 'GHETTO',
        category: product.category,
        tags: product.tags || [],
        inStock: product.in_stock,
        sellerId: product.seller_id,
        status: product.status as SellerProduct['status'],
        images: product.images || [],
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at),
      })) || [];

      setProducts(sellerProducts);
    } catch (error) {
      logger.error('Failed to load products', 'useSellerProducts', error);
      handleSupabaseError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProduct = async (productData: Omit<SellerProduct, 'id' | 'sellerId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      const { data: newProduct, error } = await supabaseClient
        .from('products')
        .insert({
          title: productData.title,
          description: productData.description,
          price_usdc: productData.price,
          category: productData.category,
          tags: productData.tags,
          in_stock: productData.inStock,
          seller_id: user.id,
          status: productData.status,
          images: productData.images,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Convert database record to SellerProduct format
      const sellerProduct: SellerProduct = {
        id: newProduct.id,
        title: newProduct.title,
        description: newProduct.description,
        price: parseFloat(newProduct.price_usdc),
        currency: 'GHETTO',
        category: newProduct.category,
        tags: newProduct.tags || [],
        inStock: newProduct.in_stock,
        sellerId: newProduct.seller_id,
        status: newProduct.status as SellerProduct['status'],
        images: newProduct.images || [],
        createdAt: new Date(newProduct.created_at),
        updatedAt: new Date(newProduct.updated_at),
      };

      setProducts(prev => [sellerProduct, ...prev]);
      return sellerProduct.id;
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (productId: string, updates: Partial<SellerProduct>) => {
    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      // Map SellerProduct fields to database fields
      const dbUpdates: any = {};
      
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.price !== undefined) dbUpdates.price_usdc = updates.price;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.tags) dbUpdates.tags = updates.tags;
      if (updates.inStock !== undefined) dbUpdates.in_stock = updates.inStock;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.images) dbUpdates.images = updates.images;

      const { data: updatedProduct, error } = await supabaseClient
        .from('products')
        .update(dbUpdates)
        .eq('id', productId)
        .eq('seller_id', user?.id) // Ensure user can only update their own products
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              ...updates, 
              updatedAt: new Date(updatedProduct.updated_at) 
            }
          : product
      ));
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    setIsLoading(true);
    try {
      const supabaseClient = requireSupabase();
      
      // Get product to clean up images
      const productToDelete = products.find(p => p.id === productId);
      
      // Delete from database
      const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('seller_id', user?.id); // Ensure user can only delete their own products

      if (error) {
        throw error;
      }

      // Clean up image storage
      if (productToDelete && productToDelete.images.length > 0) {
        const imagePaths = productToDelete.images
          .filter(img => img.url.includes('supabase'))
          .map(img => {
            // Extract file path from Supabase URL
            const urlParts = img.url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            return `${user?.id}/${fileName}`;
          });

        if (imagePaths.length > 0) {
          await supabaseClient.storage
            .from('product-images')
            .remove(imagePaths);
        }
      }

      // Update local state
      setProducts(prev => prev.filter(product => product.id !== productId));
    } catch (error) {
      handleSupabaseError(error);
      throw new Error('Failed to delete product');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProductImages = (productId: string, images: ProductImage[]) => {
    // Update images in database
    updateProduct(productId, { images });
  };

  const getProductsByStatus = (status: SellerProduct['status']) => {
    return products.filter(product => product.status === status);
  };

  const getProductStats = () => {
    return {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      draft: products.filter(p => p.status === 'draft').length,
      sold: products.filter(p => p.status === 'sold').length,
      paused: products.filter(p => p.status === 'paused').length,
    };
  };

  const incrementViewCount = async (productId: string) => {
    try {
      const supabaseClient = requireSupabase();
      
      // Call the database function to increment view count
      const { error } = await supabaseClient.rpc('increment_product_views', {
        product_id: productId
      });

      if (error) {
        logger.error('Failed to increment view count', 'useSellerProducts', error);
      }
    } catch (error) {
      logger.error('Error incrementing view count', 'useSellerProducts', error);
    }
  };

  const toggleFavorite = async (productId: string, isFavorited: boolean) => {
    try {
      const supabaseClient = requireSupabase();
      
      // Call the database function to toggle favorite count
      const { error } = await supabaseClient.rpc('toggle_product_favorite', {
        product_id: productId,
        increment: isFavorited
      });

      if (error) {
        logger.error('Failed to toggle favorite', 'useSellerProducts', error);
      }
    } catch (error) {
      logger.error('Error toggling favorite', 'useSellerProducts', error);
    }
  };
  return {
    products,
    isLoading,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductImages,
    getProductsByStatus,
    getProductStats,
    incrementViewCount,
    toggleFavorite,
  };
}