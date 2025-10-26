import React, { useState } from 'react';
import { Search, Filter, X, DollarSign, MapPin, Calendar, Star, Shield } from 'lucide-react';
import { Product } from '../types';
import { useProducts } from '../hooks/useProducts';

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query: string;
  category: string;
  priceMin: number;
  priceMax: number;
  location: string;
  seller: string;
  verifiedOnly: boolean;
  inStockOnly: boolean;
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'newest' | 'rating';
  tags: string[];
}

export function AdvancedSearch({ isOpen, onClose, onSearch }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    priceMin: 0,
    priceMax: 10000,
    location: '',
    seller: '',
    verifiedOnly: false,
    inStockOnly: true,
    sortBy: 'relevance',
    tags: [],
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { products, getCategories, getTags } = useProducts();

  // Extract unique values from products for filters
  const categories = getCategories();
  const allTags = getTags();
  const sellers = Array.from(new Set(products.map(p => p.seller.name)));
  const maxPrice = Math.max(...products.map(p => p.price));

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    setFilters({ ...filters, tags: newTags });
  };

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      query: '',
      category: 'all',
      priceMin: 0,
      priceMax: maxPrice,
      location: '',
      seller: '',
      verifiedOnly: false,
      inStockOnly: true,
      sortBy: 'relevance',
      tags: [],
    };
    setFilters(resetFilters);
    setSelectedTags([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-morphism-strong rounded-apple-lg w-full max-w-4xl max-h-[90vh] overflow-hidden apple-card">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Filter className="h-6 w-6 text-apple-blue" />
            <h2 className="text-2xl apple-title text-white">Advanced Search</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg apple-hover"
          >
            <X className="w-6 h-6 text-apple-gray-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Search Query */}
              <div>
                <label className="block text-white apple-title mb-3">Search Terms</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-apple-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 glass-morphism rounded-apple apple-focus text-white placeholder-apple-gray-500 apple-font"
                    placeholder="Search products, descriptions, sellers..."
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-white apple-title mb-3">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-4 py-3 glass-morphism rounded-apple apple-focus text-white apple-font"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-white apple-title mb-3">Price Range (USDC)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-apple-gray-500 w-4 h-4" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={filters.priceMin}
                      onChange={(e) => setFilters({ ...filters, priceMin: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 glass-morphism rounded-apple apple-focus text-white placeholder-apple-gray-500 apple-font"
                      placeholder="Min"
                    />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-apple-gray-500 w-4 h-4" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={filters.priceMax}
                      onChange={(e) => setFilters({ ...filters, priceMax: parseFloat(e.target.value) || maxPrice })}
                      className="w-full pl-10 pr-4 py-3 glass-morphism rounded-apple apple-focus text-white placeholder-apple-gray-500 apple-font"
                      placeholder="Max"
                    />
                  </div>
                </div>
                <div className="mt-2 text-apple-gray-400 text-sm apple-font text-center">
                  Range: $0 - ${maxPrice.toLocaleString()}
                </div>
              </div>

              {/* Seller Filter */}
              <div>
                <label className="block text-white apple-title mb-3">Seller</label>
                <select
                  value={filters.seller}
                  onChange={(e) => setFilters({ ...filters, seller: e.target.value })}
                  className="w-full px-4 py-3 glass-morphism rounded-apple apple-focus text-white apple-font"
                >
                  <option value="">All Sellers</option>
                  {sellers.map(seller => (
                    <option key={seller} value={seller}>{seller}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Sort Options */}
              <div>
                <label className="block text-white apple-title mb-3">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="w-full px-4 py-3 glass-morphism rounded-apple apple-focus text-white apple-font"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              {/* Filter Options */}
              <div>
                <label className="block text-white apple-title mb-3">Filter Options</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="verifiedOnly"
                      checked={filters.verifiedOnly}
                      onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                      className="w-4 h-4 text-apple-blue bg-apple-gray-800 border-apple-gray-600 rounded focus:ring-apple-blue"
                    />
                    <label htmlFor="verifiedOnly" className="text-white font-medium flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-apple-blue" />
                      <span>Verified Sellers Only</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="inStockOnly"
                      checked={filters.inStockOnly}
                      onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked })}
                      className="w-4 h-4 text-apple-blue bg-apple-gray-800 border-apple-gray-600 rounded focus:ring-apple-blue"
                    />
                    <label htmlFor="inStockOnly" className="text-white font-medium">
                      In Stock Only
                    </label>
                  </div>
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-white apple-title mb-3">Tags</label>
                <div className="max-h-48 overflow-y-auto glass-morphism rounded-apple p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium apple-hover ${
                          selectedTags.includes(tag)
                            ? 'bg-apple-blue text-white'
                            : 'bg-white/10 text-apple-gray-300 hover:bg-white/20'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-2 text-sm text-apple-gray-400 apple-font">
                    Selected: {selectedTags.join(', ')}
                  </div>
                )}
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-white apple-title mb-3">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-apple-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 glass-morphism rounded-apple apple-focus text-white placeholder-apple-gray-500 apple-font"
                    placeholder="City, State, Country..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Preview */}
          <div className="mt-8 glass-morphism rounded-apple p-6">
            <h4 className="text-white apple-title mb-3">Search Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl apple-title text-apple-blue">{products.length}</p>
                <p className="text-apple-gray-400 text-sm apple-font">Total Products</p>
              </div>
              <div>
                <p className="text-2xl apple-title text-apple-green">
                  {products.filter(p => p.seller.verified).length}
                </p>
                <p className="text-apple-gray-400 text-sm apple-font">Verified Sellers</p>
              </div>
              <div>
                <p className="text-2xl apple-title text-apple-yellow">
                  {products.filter(p => p.inStock).length}
                </p>
                <p className="text-apple-gray-400 text-sm apple-font">In Stock</p>
              </div>
              <div>
                <p className="text-2xl apple-title text-apple-purple">
                  ${Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length || 0)}
                </p>
                <p className="text-apple-gray-400 text-sm apple-font">Avg Price</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 flex space-x-4">
          <button
            onClick={handleReset}
            className="btn-apple-secondary px-6 py-3 apple-font"
          >
            Reset Filters
          </button>
          <button
            onClick={handleSearch}
            className="btn-apple-primary flex-1 py-3 apple-font font-medium"
          >
            Apply Search
          </button>
        </div>
      </div>
    </div>
  );
}