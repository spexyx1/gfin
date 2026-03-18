import React from 'react';
import { Star, Shield, ShoppingCart, Zap, MessageCircle, Flag } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onContactSeller: (sellerId: string) => void;
  onBuyNow: (product: Product) => void;
  onMakeOffer: (product: Product) => void;
  onReportListing: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onContactSeller, 
  onBuyNow, 
  onMakeOffer, 
  onReportListing,
}) => {

  return (
    <div className="luxe-card overflow-hidden group">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-44 sm:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
          <span className="luxe-glass px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs luxe-subtitle text-[#d4af37]">
            {product.category}
          </span>
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-sm sm:text-base font-bold uppercase tracking-wider">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <h3 className="text-base sm:text-lg luxe-title text-white line-clamp-2 group-hover:text-[#d4af37] transition-colors">
            {product.title}
          </h3>
        </div>

        <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed font-light">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span className="text-xl sm:text-2xl luxe-title text-white">
              {product.price} <span className="text-[#d4af37]">GHETTO</span>
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-[#d4af37]" />
            <span className="text-xs sm:text-sm font-bold text-white">{product.seller.rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 luxe-subtitle">BY</span>
            <span className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wide">
              {product.seller.name}
            </span>
            {product.seller.verified && (
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00ff88]" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          {/* Buy Now Button */}
          <button
            onClick={() => onBuyNow(product)}
            disabled={!product.inStock}
            className={`w-full py-2.5 sm:py-3 rounded-lg luxe-subtitle transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base touch-friendly ${
              product.inStock
                ? 'luxe-btn-primary'
                : 'luxe-glass text-gray-600 cursor-not-allowed'
            }`}
          >
            {product.inStock ? (
              <>
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </>
            ) : (
              <span>Out of Stock</span>
            )}
          </button>

          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
            className={`w-full py-2.5 sm:py-3 rounded-lg luxe-subtitle transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base touch-friendly ${
              product.inStock
                ? 'luxe-btn-neon'
                : 'luxe-glass text-gray-600 cursor-not-allowed'
            }`}
          >
            {product.inStock ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            ) : (
              <span>Out of Stock</span>
            )}
          </button>

          {/* Make Offer and Contact Seller Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onMakeOffer(product)}
              disabled={!product.inStock}
              className={`py-2 sm:py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm luxe-subtitle touch-friendly ${
                product.inStock
                  ? 'luxe-btn-secondary'
                  : 'luxe-glass text-gray-600 cursor-not-allowed'
              }`}
            >
              <span>Make Offer</span>
            </button>

            <button
              onClick={() => onContactSeller(product.seller.id)}
              className="py-2 sm:py-2.5 luxe-btn-secondary rounded-lg transition-all duration-300 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm luxe-subtitle touch-friendly"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Contact</span>
            </button>
          </div>

          {/* Report Listing Button */}
          <button
            onClick={() => onReportListing(product)}
            className="w-full py-2 luxe-glass hover:bg-red-900/20 text-gray-500 hover:text-red-400 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-xs luxe-subtitle border border-white/10/50 hover:border-red-500/50"
          >
            <Flag className="w-3 h-3" />
            <span>Report Listing</span>
          </button>
        </div>
      </div>
    </div>
  );
};