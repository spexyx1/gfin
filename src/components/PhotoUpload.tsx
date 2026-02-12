import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Star, RotateCcw, Move, Trash2, Image as ImageIcon } from 'lucide-react';
import { ProductImage } from '../types';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { logger } from '../utils/logger';

interface PhotoUploadProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export function PhotoUpload({ images, onImagesChange, maxImages = 10 }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { isUploading, uploadProgress, uploadPhoto, deletePhoto, setPrimaryPhoto, reorderPhotos } = usePhotoUpload();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    try {
      for (const file of filesToUpload) {
        const newImage = await uploadPhoto(file);
        const updatedImages = [...images, newImage];
        
        // Set as primary if it's the first image
        if (images.length === 0) {
          newImage.isPrimary = true;
        }
        
        onImagesChange(updatedImages);
      }
    } catch (error) {
      logger.error('Upload failed', 'PhotoUpload', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDeleteImage = (imageId: string) => {
    const updatedImages = deletePhoto(imageId, images);
    
    // If deleted image was primary, set first remaining image as primary
    if (updatedImages.length > 0 && !updatedImages.some(img => img.isPrimary)) {
      updatedImages[0].isPrimary = true;
    }
    
    onImagesChange(updatedImages);
  };

  const handleSetPrimary = (imageId: string) => {
    const updatedImages = setPrimaryPhoto(imageId, images);
    onImagesChange(updatedImages);
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    const updatedImages = reorderPhotos(images, startIndex, endIndex);
    onImagesChange(updatedImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Add Product Photos</h3>
              <p className="text-gray-400 text-sm mb-4">
                Upload up to {maxImages} high-quality images ({images.length}/{maxImages} used)
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </button>
              
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo</span>
              </button>
            </div>

            {isUploading && (
              <div className="w-full max-w-xs">
                <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">Product Images</h4>
            <p className="text-sm text-gray-400">
              Drag to reorder • Star to set as primary
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', index.toString());
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const startIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  handleReorder(startIndex, index);
                }}
              >
                <div className="aspect-square">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                    PRIMARY
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex space-x-2">
                    {!image.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(image.id)}
                        className="p-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-full transition-colors"
                        title="Set as primary"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      title="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs truncate">{image.filename}</p>
                  <p className="text-gray-300 text-xs">
                    {(image.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>

                {/* Drag Handle */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Move className="w-4 h-4 text-white cursor-move" />
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h5 className="text-white font-medium mb-2">Photo Tips</h5>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Use high-resolution images (at least 1000x1000 pixels)</li>
              <li>• Show your product from multiple angles</li>
              <li>• Ensure good lighting and clear focus</li>
              <li>• The primary image will be shown in search results</li>
              <li>• Supported formats: JPG, PNG, WebP (max 10MB each)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}