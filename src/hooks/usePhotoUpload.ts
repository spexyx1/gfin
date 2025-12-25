import { useState, useCallback } from 'react';
import { ProductImage } from '../types';
import { supabase, requireSupabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from './useAuth';
import { VALIDATION_CONFIG } from '../config/constants';
import { logger } from '../utils/logger';

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const uploadPhoto = useCallback(async (file: File): Promise<ProductImage> => {
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      if (file.size > VALIDATION_CONFIG.upload.maxImageSize) {
        throw new Error('Image size must be less than 10MB');
      }

      const supabaseClient = requireSupabase();

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      const productImage: ProductImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: urlData.publicUrl,
        filename: file.name,
        size: file.size,
        uploadedAt: new Date(),
        isPrimary: false,
      };

      return productImage;
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [user]);

  const uploadMultiplePhotos = useCallback(async (files: FileList): Promise<ProductImage[]> => {
    const uploadPromises = Array.from(files).map(file => uploadPhoto(file));
    return Promise.all(uploadPromises);
  }, [uploadPhoto]);

  const deletePhoto = useCallback((imageId: string, images: ProductImage[]): ProductImage[] => {
    const imageToDelete = images.find(img => img.id === imageId);
    if (imageToDelete) {
      // Delete from Supabase Storage
      deleteFromStorage(imageToDelete.url);
    }
    return images.filter(img => img.id !== imageId);
  }, []);

  const deleteFromStorage = useCallback(async (imageUrl: string) => {
    if (!user) return;

    try {
      const supabaseClient = requireSupabase();
      
      // Extract file path from public URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabaseClient.storage
        .from('product-images')
        .remove([filePath]);

      if (error) {
        logger.error('Failed to delete image from storage', 'usePhotoUpload', error);
      }
    } catch (error) {
      logger.error('Error deleting image', 'usePhotoUpload', error);
    }
  }, [user]);
  const setPrimaryPhoto = useCallback((imageId: string, images: ProductImage[]): ProductImage[] => {
    return images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
  }, []);

  const reorderPhotos = useCallback((images: ProductImage[], startIndex: number, endIndex: number): ProductImage[] => {
    const result = Array.from(images);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }, []);

  return {
    isUploading,
    uploadProgress,
    uploadPhoto,
    uploadMultiplePhotos,
    deletePhoto,
    setPrimaryPhoto,
    reorderPhotos,
  };
}