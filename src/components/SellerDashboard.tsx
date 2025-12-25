import React, { useState } from 'react';
import { Plus, Package, DollarSign, Eye, CreditCard as Edit, Trash2, Camera, Star, Shield, X, Minus } from 'lucide-react';
import { useSellerProducts } from '../hooks/useSellerProducts';
import { useWeb3 } from '../hooks/useWeb3';
import { useEscrow } from '../hooks/useEscrow';
import { useAuth } from '../hooks/useAuth';
import { useTerms } from '../hooks/useTerms';
import { PhotoUpload } from './PhotoUpload';
import { SellerProduct, ProductImage } from '../types';

interface SellerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SellerDashboard({ isOpen, onClose }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'create' | 'edit'>('products');
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    tags: '',
    inStock: true,
    status: 'draft' as SellerProduct['status'],
  });
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  const { account } = useWeb3();
  const { user } = useAuth();
  const { needsTermsAcceptance } = useTerms();
  const { getSellerCollateralInfo, depositGhettoCollateral } = useEscrow();
  const {
    products,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductImages,
    getProductStats
  } = useSellerProducts();

  const stats = getProductStats();
  const [collateralInfo, setCollateralInfo] = useState({
    totalCollateral: 0,
    availableCollateral: 0,
    heldCollateral: 0,
    maxOrderValue: 0,
  });
  const [showCollateralDeposit, setShowCollateralDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');

  // Load seller collateral info
  React.useEffect(() => {
    const loadCollateralInfo = async () => {
      if (account) {
        try {
          const info = await getSellerCollateralInfo();
          setCollateralInfo(info);
        } catch (error) {
          console.error('Failed to load collateral info:', error);
        }
      }
    };

    loadCollateralInfo();
  }, [account, getSellerCollateralInfo]);

  const categories = [
    'Hardware', 'Digital Assets', 'Services', 'Software', 
    'Education', 'Domains', 'NFTs', 'Tools', 'Other'
  ];

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      tags: '',
      inStock: true,
      status: 'draft',
    });
    setProductImages([]);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (needsTermsAcceptance) {
      alert('You must accept the Terms of Service before creating or editing listings.');
      return;
    }

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        currency: 'GHETTO' as const,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        images: productImages,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }

      resetForm();
      setActiveTab('products');
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product: SellerProduct) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      tags: product.tags.join(', '),
      inStock: product.inStock,
      status: product.status,
    });
    setProductImages(product.images);
    setActiveTab('edit');
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleDepositCollateral = async () => {
    try {
      await depositGhettoCollateral(parseFloat(depositAmount));
      setShowCollateralDeposit(false);
      setDepositAmount('100');
      // Reload collateral info
      const info = await getSellerCollateralInfo();
      setCollateralInfo(info);
    } catch (error) {
      console.error('Failed to deposit collateral:', error);
      alert('Failed to deposit collateral. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Seller Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-400 rotate-45" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-700">
          {/* GHETTO Collateral Status */}
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="w-6 h-6 text-neon-blue" />
              <span className="text-neon-blue font-black text-sm">GHETTO</span>
            </div>
            <p className="text-2xl font-black text-white">{collateralInfo.totalCollateral}</p>
            <p className="text-gray-400 text-sm">Collateral</p>
            <p className="text-xs text-gray-500 mt-1">
              Available: {collateralInfo.availableCollateral} | Held: {collateralInfo.heldCollateral}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <Package className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-gray-400 text-sm">Total Products</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <Eye className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.active}</p>
            <p className="text-gray-400 text-sm">Active</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <Edit className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.draft}</p>
            <p className="text-gray-400 text-sm">Drafts</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <DollarSign className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.sold}</p>
            <p className="text-gray-400 text-sm">Sold</p>
          </div>
        </div>

        {/* Collateral Warning */}
        {collateralInfo.totalCollateral < 100 && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-red-400 font-black text-sm">COLLATERAL REQUIRED</p>
                  <p className="text-gray-400 text-xs">Deposit 100 GHETTO to start selling</p>
                </div>
              </div>
              <button
                onClick={() => setShowCollateralDeposit(true)}
                className="px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg font-medium"
              >
                Deposit GHETTO
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'products'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            My Products
          </button>
          <button
            onClick={() => {
              resetForm();
              setActiveTab('create');
            }}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'create'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
            }`}
          >
            Create Product
          </button>
          {activeTab === 'edit' && (
            <button
              onClick={() => setActiveTab('edit')}
              className="flex-1 px-6 py-4 font-medium text-blue-400 border-b-2 border-blue-400 bg-gray-800/50"
            >
              Edit Product
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Products List */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No products yet</p>
                  <p className="text-gray-500 mb-4">Create your first product to start selling</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                      <div className="relative">
                        {product.images.length > 0 ? (
                          <img
                            src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                            alt={product.title}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                            <Camera className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            product.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            product.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                            product.status === 'sold' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {product.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                          {product.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xl font-bold text-white">
                            {product.price} GHETTO
                          </span>
                          <span className="text-sm text-gray-400">
                            {product.category}
                          </span>
                        </div>
                        
                        {/* Product Stats */}
                        <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                          <span>Created: {product.createdAt.toLocaleDateString()}</span>
                          <span>Status: {product.status}</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create/Edit Product Form */}
          {(activeTab === 'create' || activeTab === 'edit') && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">Product Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Enter product title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="0.00 GHETTO"
                    required
                  />
                  <p className="text-gray-400 text-xs mt-1">Price in GHETTO (1 GHETTO = 1 USDC)</p>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                  placeholder="Describe your product in detail"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SellerProduct['status'] })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="crypto, nft, blockchain"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={formData.inStock}
                  onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="inStock" className="text-white font-medium">
                  In Stock
                </label>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-white font-medium mb-4">Product Photos</label>
                <PhotoUpload
                  images={productImages}
                  onImagesChange={setProductImages}
                  maxImages={10}
                />
              </div>

              <div className="flex space-x-4 pt-6 border-t border-gray-700">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {isLoading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('products');
                  }}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* GHETTO Collateral Deposit Modal */}
        {showCollateralDeposit && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase">Deposit GHETTO Collateral</h3>
                  <button
                    onClick={() => setShowCollateralDeposit(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-neon-blue/10 border border-neon-blue/20 rounded-lg p-4">
                  <h4 className="text-neon-blue font-black mb-2 text-sm">SELLER COLLATERAL SYSTEM</h4>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>• Minimum 100 GHETTO required to start selling</li>
                    <li>• Your collateral = maximum order value you can accept</li>
                    <li>• Collateral is held during active orders</li>
                    <li>• Released when orders complete successfully</li>
                  </ul>
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Deposit Amount (GHETTO)</label>
                  <input
                    type="number"
                    min="100"
                    step="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                    placeholder="100"
                    required
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    This will be your maximum order value limit
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleDepositCollateral}
                    disabled={isLoading || parseFloat(depositAmount) < 100}
                    className="flex-1 py-3 bg-neon-blue hover:bg-neon-blue/80 disabled:bg-gray-600 text-black rounded-lg transition-colors font-black uppercase"
                  >
                    {isLoading ? 'Depositing...' : 'Deposit GHETTO'}
                  </button>
                  <button
                    onClick={() => setShowCollateralDeposit(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}