import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Package, DollarSign, Eye, Trash2, Camera, Star, Shield, X, Search, Filter, ChevronDown, ChevronUp, LayoutDashboard, ShoppingBag, Wallet, CreditCard as Edit, Menu, TrendingUp, Activity, Clock, CheckCircle } from 'lucide-react';
import { useSellerProducts } from '../hooks/useSellerProducts';
import { useWeb3 } from '../hooks/useWeb3';
import { useEscrow } from '../hooks/useEscrow';
import { useAuth } from '../hooks/useAuth';
import { useTerms } from '../hooks/useTerms';
import { PhotoUpload } from './PhotoUpload';
import { SellerProduct, ProductImage } from '../types';
import { logger } from '../utils/logger';

interface SellerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortField = 'title' | 'price' | 'category' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type DashboardSection = 'overview' | 'products' | 'collateral' | 'create' | 'edit';

export function SellerDashboard({ isOpen, onClose }: SellerDashboardProps) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);

  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Form state
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
  const { getSellerCollateralInfo, depositGhettoCollateral, withdrawGhettoCollateral } = useEscrow();
  const {
    products,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
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
  const [showCollateralWithdraw, setShowCollateralWithdraw] = useState(false);
  const [depositAmount, setDepositAmount] = useState('100');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  React.useEffect(() => {
    const loadCollateralInfo = async () => {
      if (account) {
        try {
          const info = await getSellerCollateralInfo();
          setCollateralInfo(info);
        } catch (error) {
          logger.error('Failed to load collateral info', 'SellerDashboard', error);
        }
      }
    };
    loadCollateralInfo();
  }, [account, getSellerCollateralInfo]);

  const categories = [
    'Hardware', 'Digital Assets', 'Services', 'Software',
    'Education', 'Domains', 'NFTs', 'Tools', 'Other'
  ];

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'createdAt') {
        aVal = a.createdAt.getTime();
        bVal = b.createdAt.getTime();
      } else if (sortField === 'price') {
        aVal = parseFloat(a.price.toString());
        bVal = parseFloat(b.price.toString());
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [products, searchQuery, statusFilter, categoryFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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
      setActiveSection('products');
    } catch (error) {
      logger.error('Failed to save product', 'SellerDashboard', error);
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
    setActiveSection('edit');
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        setSelectedProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } catch (error) {
        logger.error('Failed to delete product', 'SellerDashboard', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (confirm(`Delete ${selectedProducts.size} selected products?`)) {
      try {
        await Promise.all(
          Array.from(selectedProducts).map(id => deleteProduct(id))
        );
        setSelectedProducts(new Set());
      } catch (error) {
        logger.error('Failed to delete products', 'SellerDashboard', error);
        alert('Failed to delete some products. Please try again.');
      }
    }
  };

  const handleBulkStatusChange = async (newStatus: SellerProduct['status']) => {
    if (selectedProducts.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedProducts).map(id => updateProduct(id, { status: newStatus }))
      );
      setSelectedProducts(new Set());
    } catch (error) {
      logger.error('Failed to update products', 'SellerDashboard', error);
      alert('Failed to update some products. Please try again.');
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleAllProducts = () => {
    if (selectedProducts.size === filteredAndSortedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredAndSortedProducts.map(p => p.id)));
    }
  };

  const handleDepositCollateral = async () => {
    try {
      await depositGhettoCollateral(parseFloat(depositAmount));
      setShowCollateralDeposit(false);
      setDepositAmount('100');
      const info = await getSellerCollateralInfo();
      setCollateralInfo(info);
    } catch (error) {
      logger.error('Failed to deposit collateral', 'SellerDashboard', error);
      alert('Failed to deposit collateral. Please try again.');
    }
  };

  const handleWithdrawCollateral = async () => {
    try {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      await withdrawGhettoCollateral(amount);
      setShowCollateralWithdraw(false);
      setWithdrawAmount('');
      const info = await getSellerCollateralInfo();
      setCollateralInfo(info);
    } catch (error: any) {
      logger.error('Failed to withdraw collateral', 'SellerDashboard', error);
      alert(error.message || 'Failed to withdraw collateral. Please try again.');
    }
  };

  if (!isOpen) return null;

  const SidebarNav = () => (
    <div className={`${sidebarOpen ? 'w-64' : 'w-0'} luxe-glass-strong border-r border-white/10 transition-all duration-300 overflow-hidden flex-shrink-0`}>
      <div className="p-6 space-y-2">
        <NavItem
          icon={LayoutDashboard}
          label="Overview"
          active={activeSection === 'overview'}
          onClick={() => setActiveSection('overview')}
        />
        <NavItem
          icon={ShoppingBag}
          label="Products"
          active={activeSection === 'products'}
          onClick={() => setActiveSection('products')}
          badge={stats.total}
        />
        <NavItem
          icon={Wallet}
          label="Collateral"
          active={activeSection === 'collateral'}
          onClick={() => setActiveSection('collateral')}
        />
        <div className="pt-4 mt-4 border-t border-white/10">
          <button
            onClick={() => {
              resetForm();
              setActiveSection('create');
            }}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Create Product</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:luxe-glass rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6 text-gray-400" />
            </button>
            <h2 className="text-2xl font-bold text-white">{t('seller.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:luxe-glass rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          <SidebarNav />

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="p-6 space-y-6">
                <h3 className="text-xl font-bold text-white">Dashboard Overview</h3>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={Package}
                    label="Total Products"
                    value={stats.total}
                    color="blue"
                  />
                  <StatCard
                    icon={Eye}
                    label="Active Listings"
                    value={stats.active}
                    color="green"
                  />
                  <StatCard
                    icon={CheckCircle}
                    label="Sold"
                    value={stats.sold}
                    color="purple"
                  />
                  <StatCard
                    icon={Shield}
                    label="Collateral"
                    value={`${collateralInfo.totalCollateral} GHETTO`}
                    color="gold"
                  />
                </div>

                {/* Collateral Warning */}
                {collateralInfo.totalCollateral < 100 && (
                  <div className="bg-gradient-to-r from-red-500/20 via-red-500/10 to-red-500/20 border-2 border-red-500/50 rounded-xl p-8 shadow-lg shadow-red-500/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center space-x-4">
                        <div className="p-4 bg-red-500/30 rounded-xl shadow-lg">
                          <Shield className="w-8 h-8 text-red-400" />
                        </div>
                        <div>
                          <p className="text-red-400 font-bold text-xl mb-1">Collateral Required to Start Selling</p>
                          <p className="text-gray-300">You need to deposit at least 100 GHETTO tokens to activate your seller account</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCollateralDeposit(true)}
                        className="px-8 py-4 bg-gradient-to-r from-luxe-gold via-yellow-400 to-luxe-gold hover:from-yellow-400 hover:via-luxe-gold hover:to-yellow-400 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg shadow-luxe-gold/30 text-lg flex items-center space-x-2 whitespace-nowrap"
                      >
                        <Shield className="w-6 h-6" />
                        <span>Deposit Now</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="luxe-glass rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-bold text-white mb-4">Quick Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <QuickActionButton
                      icon={Plus}
                      label="Create Product"
                      onClick={() => {
                        resetForm();
                        setActiveSection('create');
                      }}
                    />
                    <QuickActionButton
                      icon={Shield}
                      label="Deposit Collateral"
                      onClick={() => setShowCollateralDeposit(true)}
                    />
                    <QuickActionButton
                      icon={ShoppingBag}
                      label="View Products"
                      onClick={() => setActiveSection('products')}
                    />
                  </div>
                </div>

                {/* Recent Products */}
                {products.length > 0 && (
                  <div className="luxe-glass rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-white">Recent Products</h4>
                      <button
                        onClick={() => setActiveSection('products')}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {products.slice(0, 5).map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 luxe-glass rounded-lg">
                          <div className="flex items-center space-x-3">
                            {product.images.length > 0 ? (
                              <img
                                src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                                alt={product.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 luxe-glass rounded-lg flex items-center justify-center">
                                <Camera className="w-6 h-6 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium">{product.title}</p>
                              <p className="text-gray-400 text-sm">{product.price} GHETTO</p>
                            </div>
                          </div>
                          <StatusBadge status={product.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Products Section */}
            {activeSection === 'products' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{t('seller.myProducts')}</h3>
                  <button
                    onClick={() => {
                      resetForm();
                      setActiveSection('create');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Product</span>
                  </button>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="sold">Sold</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Bulk Actions */}
                {selectedProducts.size > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <span className="text-white font-medium">
                      {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkStatusChange('active')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => handleBulkStatusChange('paused')}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
                      >
                        Pause
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Products Table */}
                {filteredAndSortedProducts.length === 0 ? (
                  <div className="text-center py-16 luxe-glass rounded-xl border border-white/10">
                    <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-2">No products found</p>
                    <p className="text-gray-500 mb-4">
                      {products.length === 0
                        ? 'Create your first product to start selling'
                        : 'Try adjusting your filters'}
                    </p>
                    {products.length === 0 && (
                      <button
                        onClick={() => {
                          resetForm();
                          setActiveSection('create');
                        }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Create Product
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="luxe-glass rounded-xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="px-4 py-3 text-left">
                              <input
                                type="checkbox"
                                checked={selectedProducts.size === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                                onChange={toggleAllProducts}
                                className="w-4 h-4 text-blue-600 luxe-glass border-gray-600 rounded focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Image</th>
                            <TableHeader
                              label="Title"
                              field="title"
                              currentField={sortField}
                              direction={sortDirection}
                              onSort={handleSort}
                            />
                            <TableHeader
                              label="Price"
                              field="price"
                              currentField={sortField}
                              direction={sortDirection}
                              onSort={handleSort}
                            />
                            <TableHeader
                              label="Category"
                              field="category"
                              currentField={sortField}
                              direction={sortDirection}
                              onSort={handleSort}
                            />
                            <TableHeader
                              label="Status"
                              field="status"
                              currentField={sortField}
                              direction={sortDirection}
                              onSort={handleSort}
                            />
                            <TableHeader
                              label="Created"
                              field="createdAt"
                              currentField={sortField}
                              direction={sortDirection}
                              onSort={handleSort}
                            />
                            <th className="px-4 py-3 text-left text-gray-400 text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {filteredAndSortedProducts.map(product => (
                            <tr key={product.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedProducts.has(product.id)}
                                  onChange={() => toggleProductSelection(product.id)}
                                  className="w-4 h-4 text-blue-600 luxe-glass border-gray-600 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                {product.images.length > 0 ? (
                                  <img
                                    src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                                    alt={product.title}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 luxe-glass rounded-lg flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-gray-500" />
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-white font-medium line-clamp-1">{product.title}</p>
                                <p className="text-gray-400 text-xs line-clamp-1">{product.description}</p>
                              </td>
                              <td className="px-4 py-3 text-white font-medium">{product.price} GHETTO</td>
                              <td className="px-4 py-3 text-gray-400 text-sm">{product.category}</td>
                              <td className="px-4 py-3">
                                <StatusBadge status={product.status} />
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-sm">
                                {product.createdAt.toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEdit(product)}
                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Collateral Section */}
            {activeSection === 'collateral' && (
              <div className="p-6 space-y-6">
                <h3 className="text-xl font-bold text-white">Collateral Management</h3>

                {/* Collateral Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="luxe-glass rounded-xl p-6 border border-white/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <Shield className="w-6 h-6 text-luxe-gold" />
                      <span className="text-gray-400 text-sm">Total Collateral</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{collateralInfo.totalCollateral}</p>
                    <p className="text-luxe-gold text-sm font-medium mt-1">GHETTO</p>
                  </div>

                  <div className="luxe-glass rounded-xl p-6 border border-white/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span className="text-gray-400 text-sm">Available</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{collateralInfo.availableCollateral}</p>
                    <p className="text-green-400 text-sm font-medium mt-1">GHETTO</p>
                  </div>

                  <div className="luxe-glass rounded-xl p-6 border border-white/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <Clock className="w-6 h-6 text-yellow-400" />
                      <span className="text-gray-400 text-sm">Held in Orders</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{collateralInfo.heldCollateral}</p>
                    <p className="text-yellow-400 text-sm font-medium mt-1">GHETTO</p>
                  </div>

                  <div className="luxe-glass rounded-xl p-6 border border-white/10">
                    <div className="flex items-center space-x-3 mb-3">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                      <span className="text-gray-400 text-sm">Selling Limit</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{collateralInfo.maxOrderValue}</p>
                    <p className="text-blue-400 text-sm font-medium mt-1">GHETTO</p>
                  </div>
                </div>

                {/* Deposit and Withdraw Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="luxe-glass rounded-xl p-6 border border-white/10">
                    <div className="flex flex-col space-y-4">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">Deposit Collateral</h4>
                        <p className="text-gray-400 text-sm">
                          Increase your collateral to accept larger orders
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCollateralDeposit(true)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-luxe-gold via-yellow-400 to-luxe-gold text-black font-bold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg shadow-luxe-gold/30"
                      >
                        <Shield className="w-5 h-5" />
                        <span>Deposit GHETTO</span>
                      </button>
                    </div>
                  </div>

                  <div className="luxe-glass rounded-xl p-6 border border-white/10">
                    <div className="flex flex-col space-y-4">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">Withdraw Collateral</h4>
                        <p className="text-gray-400 text-sm">
                          Withdraw available collateral (not held in orders)
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (collateralInfo.availableCollateral <= 0) {
                            alert('No collateral available for withdrawal. All collateral is currently held in active orders.');
                            return;
                          }
                          setWithdrawAmount(collateralInfo.availableCollateral.toString());
                          setShowCollateralWithdraw(true);
                        }}
                        disabled={collateralInfo.availableCollateral <= 0}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
                      >
                        <Package className="w-5 h-5" />
                        <span>Withdraw GHETTO</span>
                      </button>
                      {collateralInfo.availableCollateral > 0 && (
                        <p className="text-green-400 text-xs text-center">
                          {collateralInfo.availableCollateral} GHETTO available
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Collateral Info */}
                <div className="luxe-glass rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-bold text-white mb-4">How Collateral Works</h4>
                  <div className="space-y-3 text-gray-400">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-luxe-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-luxe-gold text-sm font-bold">1</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Minimum Requirement</p>
                        <p className="text-sm">Deposit at least 100 GHETTO to start selling on the marketplace</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-luxe-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-luxe-gold text-sm font-bold">2</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Order Limit</p>
                        <p className="text-sm">Your collateral determines the maximum order value you can accept</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-luxe-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-luxe-gold text-sm font-bold">3</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Protection</p>
                        <p className="text-sm">Collateral is held during active orders and released upon successful completion</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-luxe-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-luxe-gold text-sm font-bold">4</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Disputes</p>
                        <p className="text-sm">In case of disputes, collateral may be used to compensate buyers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create/Edit Product Form */}
            {(activeSection === 'create' || activeSection === 'edit') && (
              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-xl font-bold text-white mb-6">
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Section */}
                    <div className="luxe-glass rounded-xl p-6 border border-white/10 space-y-6">
                      <h4 className="text-lg font-bold text-white">Basic Information</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-medium mb-2">
                            Product Title <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            placeholder="Enter product title"
                            required
                          />
                          <p className="text-gray-500 text-xs mt-1">{formData.title.length}/100 characters</p>
                        </div>

                        <div>
                          <label className="block text-white font-medium mb-2">
                            Price (GHETTO) <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            placeholder="0.00"
                            required
                          />
                          <p className="text-gray-400 text-xs mt-1">1 GHETTO = 1 USDC</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={5}
                          className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                          placeholder="Describe your product in detail"
                          required
                        />
                        <p className="text-gray-500 text-xs mt-1">{formData.description.length}/1000 characters</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-white font-medium mb-2">
                            Category <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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
                            className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-white font-medium mb-2">Availability</label>
                          <div className="flex items-center space-x-3 h-12">
                            <input
                              type="checkbox"
                              id="inStock"
                              checked={formData.inStock}
                              onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                              className="w-4 h-4 text-blue-600 luxe-glass border-gray-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="inStock" className="text-white font-medium">
                              In Stock
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">Tags</label>
                        <input
                          type="text"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                          placeholder="crypto, nft, blockchain (comma-separated)"
                        />
                        <p className="text-gray-500 text-xs mt-1">Add tags to help buyers find your product</p>
                      </div>
                    </div>

                    {/* Images Section */}
                    <div className="luxe-glass rounded-xl p-6 border border-white/10 space-y-4">
                      <h4 className="text-lg font-bold text-white">Product Images</h4>
                      <PhotoUpload
                        images={productImages}
                        onImagesChange={setProductImages}
                        maxImages={10}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 font-semibold flex items-center space-x-2"
                      >
                        {isLoading ? (
                          <span>Saving...</span>
                        ) : editingProduct ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Update Product</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            <span>Create Product</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setActiveSection('products');
                        }}
                        className="px-8 py-3 luxe-glass hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collateral Deposit Modal */}
        {showCollateralDeposit && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-md">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Deposit GHETTO Collateral</h3>
                  <button
                    onClick={() => setShowCollateralDeposit(false)}
                    className="p-2 hover:luxe-glass rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-luxe-gold/10 border border-luxe-gold/20 rounded-lg p-4">
                  <h4 className="text-luxe-gold font-bold mb-2 text-sm">SELLER COLLATERAL SYSTEM</h4>
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
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
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
                    className="flex-1 py-3 bg-gradient-to-r from-luxe-gold via-yellow-400 to-luxe-gold disabled:from-gray-600 disabled:via-gray-600 disabled:to-gray-600 text-black font-bold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-luxe-gold/30 disabled:shadow-none"
                  >
                    {isLoading ? 'Depositing...' : 'Deposit GHETTO'}
                  </button>
                  <button
                    onClick={() => setShowCollateralDeposit(false)}
                    className="px-6 py-3 luxe-glass hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collateral Withdraw Modal */}
        {showCollateralWithdraw && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-md">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Withdraw GHETTO Collateral</h3>
                  <button
                    onClick={() => setShowCollateralWithdraw(false)}
                    className="p-2 hover:luxe-glass rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-blue-400 font-bold mb-2 text-sm">WITHDRAWAL INFORMATION</h4>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>• Only available collateral can be withdrawn</li>
                    <li>• Collateral held in active orders cannot be withdrawn</li>
                    <li>• Withdrawn funds will be returned to your wallet</li>
                    <li>• Your maximum order value will decrease accordingly</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Available for Withdrawal:</span>
                    <span className="text-green-400 font-bold">{collateralInfo.availableCollateral} GHETTO</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Held in Orders:</span>
                    <span className="text-yellow-400 font-bold">{collateralInfo.heldCollateral} GHETTO</span>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Withdraw Amount (GHETTO)</label>
                  <input
                    type="number"
                    min="0.01"
                    max={collateralInfo.availableCollateral}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder={`Max: ${collateralInfo.availableCollateral}`}
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-gray-500 text-xs">
                      Maximum: {collateralInfo.availableCollateral} GHETTO
                    </p>
                    <button
                      onClick={() => setWithdrawAmount(collateralInfo.availableCollateral.toString())}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                    >
                      Withdraw All
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleWithdrawCollateral}
                    disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > collateralInfo.availableCollateral}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-bold"
                  >
                    {isLoading ? 'Withdrawing...' : 'Withdraw GHETTO'}
                  </button>
                  <button
                    onClick={() => setShowCollateralWithdraw(false)}
                    className="px-6 py-3 luxe-glass hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
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

// Helper Components
interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function NavItem({ icon: Icon, label, active, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
          : 'text-gray-400 hover:text-white hover:luxe-glass'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          active ? 'bg-white/20' : 'bg-blue-600/20 text-blue-400'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'gold';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    gold: 'text-luxe-gold',
  };

  return (
    <div className="luxe-glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center space-x-3 mb-3">
        <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

function QuickActionButton({ icon: Icon, label, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-3 p-4 luxe-glass hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 hover:scale-105"
    >
      <div className="p-2 bg-blue-600/20 rounded-lg">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <span className="text-white font-medium">{label}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: SellerProduct['status'] }) {
  const statusConfig = {
    active: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Active' },
    draft: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Draft' },
    sold: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Sold' },
    paused: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Paused' },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

interface TableHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}

function TableHeader({ label, field, currentField, direction, onSort }: TableHeaderProps) {
  const isActive = currentField === field;

  return (
    <th
      className="px-4 py-3 text-left text-gray-400 text-sm font-medium cursor-pointer hover:text-white transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {isActive && (
          direction === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        )}
      </div>
    </th>
  );
}
