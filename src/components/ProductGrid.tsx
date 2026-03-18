import React from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';
import { Package } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onContactSeller: (sellerId: string) => void;
  onBuyNow: (product: Product) => void;
  onMakeOffer: (product: Product) => void;
  onReportListing: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  onAddToCart, 
  onContactSeller, 
  onBuyNow, 
  onMakeOffer, 
  onReportListing,
}) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 luxe-glass opacity-50 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No products found</h3>
        <p className="text-sm sm:text-base text-gray-400 text-center max-w-md">
          Try adjusting your search terms or browse different categories to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onContactSeller={onContactSeller}
          onBuyNow={onBuyNow}
          onMakeOffer={onMakeOffer}
          onReportListing={onReportListing}
        />
      ))}
    </div>
  );
};