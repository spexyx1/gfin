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
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/10 transition-all duration-300 group">
      <div className="relative">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-56 object-cover transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-cyan-400">
            {product.category}
          </span>
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-black text-gray-200 transition-colors line-clamp-2 uppercase">
            {product.title}
          </h3>
        </div>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed font-bold">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black text-gray-200 uppercase">
              {product.price} GHETTO
            </span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <Star className="w-4 h-4 fill-current text-cyan-400" />
            <span className="text-sm font-black text-gray-200">{product.seller.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 font-bold uppercase">BY</span>
            <span className="text-sm font-black text-gray-200 uppercase">
              {product.seller.name}
            </span>
            {product.seller.verified && (
              <Shield className="w-4 h-4 text-cyan-400" />
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Buy Now Button */}
          <button
            onClick={() => onBuyNow(product)}
            disabled={!product.inStock}
            className={`w-full py-3 rounded-lg font-black uppercase transition-all duration-200 flex items-center justify-center space-x-2 active:btn-neon-active ${
              product.inStock
                ? 'bg-neon-red text-black hover:shadow-neon-red neon-red-glow'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {product.inStock ? (
              <>
                <Zap className="w-4 h-4" />
                <span>BUY NOW</span>
              </>
            ) : (
              <span>OUT OF STOCK</span>
            )}
          </button>
          
          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
            className={`w-full py-3 rounded-lg font-black uppercase transition-all duration-200 flex items-center justify-center space-x-2 active:btn-neon-active ${
              product.inStock
                ? 'bg-neon-blue text-black hover:shadow-neon-blue'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {product.inStock ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>ADD TO CART</span>
              </>
            ) : (
              <span>OUT OF STOCK</span>
            )}
          </button>
          
          {/* Make Offer and Contact Seller Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onMakeOffer(product)}
              disabled={!product.inStock}
              className={`py-2 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-black uppercase ${
                product.inStock
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-neon-blue hover:shadow-neon-blue active:btn-neon-active'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              <span>MAKE OFFER</span>
            </button>
            
            <button
              onClick={() => onContactSeller(product.seller.id)}
              className="py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-neon-red hover:shadow-neon-red rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm font-black uppercase active:neon-red-glow"
            >
              <MessageCircle className="w-4 h-4" />
              <span>CONTACT</span>
            </button>
          </div>
          
          {/* Report Listing Button */}
          <button
            onClick={() => onReportListing(product)}
            className="w-full py-2 bg-gray-800/50 hover:bg-red-900/30 text-gray-500 hover:text-red-400 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-xs font-medium uppercase border border-gray-700 hover:border-red-500/30"
          >
            <Flag className="w-3 h-3" />
            <span>REPORT LISTING</span>
          </button>
        </div>
      </div>
    </div>
  );
};