import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Package, Clock, CheckCircle, AlertTriangle, Truck, DollarSign, ExternalLink, Calendar, MapPin, CreditCard as Edit3, Zap, Info } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { useEscrow } from '../hooks/useEscrow';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '../utils/logger';

interface OrderManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderManagement({ isOpen, onClose }: OrderManagementProps) {
  const { t } = useTranslation();
  const {
    orders,
    agreeToOrder,
    shipOrder,
    confirmDelivery,
    releaseFunds,
    disputeOrder,
    updateTrackingInfo,
    getSellerBalance,
    withdrawSellerBalance,
    isLoading
  } = useEscrow();
  const { account } = useWeb3();
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [showShippingForm, setShowShippingForm] = useState<string | null>(null);
  const [showTrackingForm, setShowTrackingForm] = useState<string | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState<string | null>(null);
  const [sellerBalance, setSellerBalance] = useState({ available: 0, held: 0 });
  const [shippingData, setShippingData] = useState({
    trackingNumber: '',
    carrier: '',
    estimatedDelivery: ''
  });
  const [disputeReason, setDisputeReason] = useState('');

  const carriers = [
    'UPS', 'FedEx', 'USPS', 'DHL', 'Amazon', 'Other'
  ];

  // Load seller balance when tab changes to seller
  React.useEffect(() => {
    if (activeTab === 'seller' && account) {
      loadSellerBalance();
    }
  }, [activeTab, account]);

  const loadSellerBalance = async () => {
    try {
      const balance = await getSellerBalance();
      setSellerBalance(balance);
    } catch (error) {
      logger.error('Failed to load seller balance', 'OrderManagement', error);
    }
  };

  const handleWithdrawFunds = async () => {
    try {
      await withdrawSellerBalance();
      await loadSellerBalance(); // Refresh balance
      alert('Funds withdrawn successfully!');
    } catch (error) {
      logger.error('Failed to withdraw funds', 'OrderManagement', error);
      alert(error instanceof Error ? error.message : 'Failed to withdraw funds');
    }
  };

  const handleReleaseFunds = async (orderId: string) => {
    if (!confirm('Are you sure you want to release funds to the seller? This action cannot be undone.')) {
      return;
    }
    try {
      await releaseFunds(orderId);
      alert('Funds released successfully!');
    } catch (error) {
      logger.error('Failed to release funds', 'OrderManagement', error);
      alert(error instanceof Error ? error.message : 'Failed to release funds');
    }
  };

  const handleShipOrder = async (orderId: string) => {
    try {
      const estimatedDelivery = shippingData.estimatedDelivery
        ? new Date(shippingData.estimatedDelivery)
        : undefined;

      await shipOrder(
        orderId,
        shippingData.trackingNumber || undefined,
        shippingData.carrier || undefined,
        estimatedDelivery
      );
      
      setShowShippingForm(null);
      setShippingData({ trackingNumber: '', carrier: '', estimatedDelivery: '' });
    } catch (error) {
      logger.error('Failed to ship order', 'OrderManagement', error);
      alert('Failed to ship order. Please try again.');
    }
  };

  const handleUpdateTracking = async (orderId: string) => {
    try {
      const estimatedDelivery = shippingData.estimatedDelivery 
        ? new Date(shippingData.estimatedDelivery) 
        : undefined;
        
      await updateTrackingInfo(
        orderId,
        shippingData.trackingNumber,
        shippingData.carrier || undefined,
        estimatedDelivery
      );
      
      setShowTrackingForm(null);
      setShippingData({ trackingNumber: '', carrier: '', estimatedDelivery: '' });
    } catch (error) {
      logger.error('Failed to update tracking', 'OrderManagement', error);
      alert('Failed to update tracking information. Please try again.');
    }
  };

  const handleDispute = async (orderId: string) => {
    if (!disputeReason.trim()) {
      alert('Please provide a reason for the dispute');
      return;
    }

    try {
      await disputeOrder(orderId, disputeReason);
      setShowDisputeForm(null);
      setDisputeReason('');
      alert('Dispute raised successfully. Our team will review it.');
    } catch (error) {
      logger.error('Failed to dispute order', 'OrderManagement', error);
      alert(error instanceof Error ? error.message : 'Failed to raise dispute');
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'text-yellow-400';
      case 'funded': return 'text-blue-400';
      case 'shipped': return 'text-purple-400';
      case 'delivered': return 'text-emerald-400';
      case 'awaiting_release': return 'text-orange-400';
      case 'funds_released': return 'text-cyan-400';
      case 'completed': return 'text-green-500';
      case 'disputed': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return <Clock className="w-4 h-4" />;
      case 'funded': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Package className="w-4 h-4" />;
      case 'awaiting_release': return <Clock className="w-4 h-4" />;
      case 'funds_released': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'awaiting_release': return 'Awaiting Fund Release';
      case 'funds_released': return 'Funds Released';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const buyerOrders = orders.filter(order => order.buyer === account);
  const sellerOrders = orders.filter(order => order.seller === account);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">{t('orders.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:luxe-glass rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('buyer')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'buyer'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            My Purchases ({buyerOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('seller')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'seller'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            My Sales ({sellerOrders.length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'buyer' && (
            <div className="space-y-4">
              {buyerOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">{t('orders.noOrders')}</p>
                  <p className="text-gray-500">Your orders will appear here</p>
                </div>
              ) : (
                buyerOrders.map((order) => (
                  <div key={order.id} className="luxe-glass rounded-xl p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{t('orders.orderNumber')} #{order.id}</h3>
                        <div className={`flex items-center gap-2 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="font-medium">{getStatusDisplayText(order.status)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{order.amount} USDC</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={order.productImage || ''}
                        alt={order.productName || 'Product'}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="text-white font-medium">{order.productName || 'Product'}</h4>
                        <p className="text-gray-400">Quantity: {order.quantity || 1}</p>
                      </div>
                    </div>

                    {/* Gasless Transaction Info for GHETTO */}
                    {order.paymentToken === 'GHETTO' && (
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 mb-4 border border-purple-500/30">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <Zap className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h5 className="text-white font-medium">Gasless Transaction</h5>
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full font-semibold">
                                GHETTO Token
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                              This order uses GHETTO tokens with gasless transactions. You won't pay any network fees (gas) for confirmations and fund releases. The platform covers all transaction costs, making your experience seamless and cost-effective.
                            </p>
                            <div className="mt-3 flex items-center space-x-2 text-xs text-purple-300">
                              <Info className="w-4 h-4" />
                              <span>Lower fees + No gas costs = Maximum savings</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tracking Information for Buyers */}
                    {order.status === 'shipped' && order.trackingNumber && (
                      <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                        <div className="flex items-center space-x-2 mb-3">
                          <Truck className="w-5 h-5 text-blue-400" />
                          <h5 className="text-white font-medium">Tracking Information</h5>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Tracking Number:</span>
                            <span className="text-white font-mono">{order.trackingNumber}</span>
                          </div>
                          {order.carrier && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Carrier:</span>
                              <span className="text-white">{order.carrier}</span>
                            </div>
                          )}
                          {order.estimatedDelivery && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Estimated Delivery:</span>
                              <span className="text-white">{order.estimatedDelivery.toLocaleDateString()}</span>
                            </div>
                          )}
                          {order.trackingUrl && (
                            <div className="mt-3">
                              <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>Track Package</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fund Release Information */}
                    {order.status === 'awaiting_release' && order.fundsReleaseDeadline && (
                      <div className="bg-orange-500/10 rounded-xl p-4 mb-4 border border-orange-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-5 h-5 text-orange-400" />
                          <h5 className="text-white font-medium">Action Required: Release Funds</h5>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">
                          You have confirmed delivery. Please release funds to the seller or raise a dispute within{' '}
                          <span className="font-semibold text-orange-400">
                            {formatDistanceToNow(new Date(order.fundsReleaseDeadline), { addSuffix: true })}
                          </span>
                          . Funds will be automatically released after this deadline.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReleaseFunds(order.id)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                          >
                            {isLoading ? 'Processing...' : 'Release Funds to Seller'}
                          </button>
                          <button
                            onClick={() => setShowDisputeForm(order.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            Dispute Order
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Funds Released Confirmation */}
                    {order.status === 'funds_released' && order.fundsReleasedAt && (
                      <div className="bg-cyan-500/10 rounded-xl p-4 mb-4 border border-cyan-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-cyan-400" />
                          <h5 className="text-white font-medium">Funds Released</h5>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Funds were released to the seller{' '}
                          <span className="font-semibold text-cyan-400">
                            {formatDistanceToNow(new Date(order.fundsReleasedAt), { addSuffix: true })}
                          </span>
                          . The order will be completed shortly.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => confirmDelivery(order.id)}
                          disabled={isLoading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          {isLoading ? 'Processing...' : 'Confirm Delivery'}
                        </button>
                      )}
                      {(order.status === 'funded' || order.status === 'shipped') && (
                        <button
                          onClick={() => setShowDisputeForm(order.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          Dispute Order
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'seller' && (
            <div className="space-y-4">
              {sellerOrders.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">{t('orders.noOrders')}</p>
                  <p className="text-gray-500">Your sales will appear here</p>
                </div>
              ) : (
                <>
                  <div className="luxe-glass rounded-xl p-4 border border-white/10 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Seller Balance</h3>
                        <p className="text-gray-400">Available for withdrawal</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">{sellerBalance.available.toFixed(2)} USDC</p>
                        <p className="text-sm text-gray-400">Held: {sellerBalance.held.toFixed(2)} USDC</p>
                      </div>
                    </div>
                    <button
                      onClick={handleWithdrawFunds}
                      disabled={isLoading || sellerBalance.available <= 0}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      {isLoading ? 'Processing...' : 'Withdraw Available Funds'}
                    </button>
                  </div>

                  {sellerOrders.map((order) => (
                    <div key={order.id} className="luxe-glass rounded-xl p-6 border border-white/10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">{t('orders.orderNumber')} #{order.id}</h3>
                          <div className={`flex items-center gap-2 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="font-medium">{getStatusDisplayText(order.status)}</span>
                          </div>
                          {order.sellerHoldAmount && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="px-2 py-1 bg-orange-600/20 text-orange-400 text-xs rounded-full">
                                Security Hold: {order.sellerHoldAmount} USDC
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">{order.amount} USDC</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <img
                          src={order.productImage || ''}
                          alt={order.productName || 'Product'}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="text-white font-medium">{order.productName || 'Product'}</h4>
                          <p className="text-gray-400">Quantity: {order.quantity || 1}</p>
                        </div>
                      </div>

                      {/* Gasless Transaction Info for GHETTO (Seller View) */}
                      {order.paymentToken === 'GHETTO' && (
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 mb-4 border border-purple-500/30">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <Zap className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="text-white font-medium">Gasless Transaction</h5>
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full font-semibold">
                                  GHETTO Token
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm leading-relaxed">
                                This sale uses GHETTO tokens with gasless transactions. Your buyer benefits from zero network fees, making it easier for them to complete the purchase and release funds without worrying about gas costs.
                              </p>
                              <div className="mt-3 flex items-center space-x-2 text-xs text-purple-300">
                                <Info className="w-4 h-4" />
                                <span>Reduced platform fees when using GHETTO</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tracking Information for Sellers */}
                      {(order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') && order.trackingNumber && (
                        <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Truck className="w-5 h-5 text-blue-400" />
                              <h5 className="text-white font-medium">Tracking Information</h5>
                            </div>
                            {order.status === 'shipped' && (
                              <button
                                onClick={() => {
                                  setShippingData({
                                    trackingNumber: order.trackingNumber || '',
                                    carrier: order.carrier || '',
                                    estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toISOString().split('T')[0] : ''
                                  });
                                  setShowTrackingForm(order.id);
                                }}
                                className="p-1 hover:luxe-glass rounded text-gray-400 hover:text-white transition-colors"
                                title="Edit tracking info"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Tracking Number:</span>
                              <span className="text-white font-mono">{order.trackingNumber}</span>
                            </div>
                            {order.carrier && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">Carrier:</span>
                                <span className="text-white">{order.carrier}</span>
                              </div>
                            )}
                            {order.estimatedDelivery && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">Estimated Delivery:</span>
                                <span className="text-white">{order.estimatedDelivery.toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Seller notification for awaiting release */}
                      {order.status === 'awaiting_release' && order.fundsReleaseDeadline && (
                        <div className="bg-blue-500/10 rounded-xl p-4 mb-4 border border-blue-500/30">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-5 h-5 text-blue-400" />
                            <h5 className="text-white font-medium">Awaiting Buyer Action</h5>
                          </div>
                          <p className="text-gray-300 text-sm">
                            The buyer has confirmed delivery and has{' '}
                            <span className="font-semibold text-blue-400">
                              {formatDistanceToNow(new Date(order.fundsReleaseDeadline), { addSuffix: true })}
                            </span>
                            {' '}to release funds or raise a dispute. After this deadline, funds will be automatically released to your account.
                          </p>
                        </div>
                      )}

                      {/* Seller notification for funds released */}
                      {order.status === 'funds_released' && order.fundsReleasedAt && (
                        <div className="bg-green-500/10 rounded-xl p-4 mb-4 border border-green-500/30">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <h5 className="text-white font-medium">Funds Released!</h5>
                          </div>
                          <p className="text-gray-300 text-sm">
                            Funds were released{' '}
                            <span className="font-semibold text-green-400">
                              {formatDistanceToNow(new Date(order.fundsReleasedAt), { addSuffix: true })}
                            </span>
                            . You can now withdraw these funds from your seller balance.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {order.status === 'created' && (
                          <button
                            onClick={() => agreeToOrder(order.id)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            {isLoading ? 'Processing...' : 'Agree to Order'}
                          </button>
                        )}
                        {order.status === 'funded' && (
                          <button
                            onClick={() => {
                              setShippingData({ trackingNumber: '', carrier: '', estimatedDelivery: '' });
                              setShowShippingForm(order.id);
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          >
                            Mark as Shipped
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Dispute Form Modal */}
        {showDisputeForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-md">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase">Dispute Order</h3>
                  <button
                    onClick={() => {
                      setShowDisputeForm(null);
                      setDisputeReason('');
                    }}
                    className="p-2 hover:luxe-glass rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium text-sm">Important</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Disputes are reviewed by our Site Master team. Please provide detailed information about the issue.
                  </p>
                </div>
                
                <div>
                  <label className="block text-white font-medium mb-2">Reason for Dispute</label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white resize-none"
                    placeholder="Describe the issue with your order..."
                    required
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDispute(showDisputeForm)}
                    disabled={isLoading || !disputeReason.trim()}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDisputeForm(null);
                      setDisputeReason('');
                    }}
                    className="px-6 py-3 luxe-glass hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Form Modal */}
        {showShippingForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-md">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase">Ship Order</h3>
                  <button
                    onClick={() => setShowShippingForm(null)}
                    className="p-2 hover:luxe-glass rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Tracking Number (Optional)</label>
                  <input
                    type="text"
                    value={shippingData.trackingNumber}
                    onChange={(e) => setShippingData({ ...shippingData, trackingNumber: e.target.value })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Carrier (Optional)</label>
                  <select
                    value={shippingData.carrier}
                    onChange={(e) => setShippingData({ ...shippingData, carrier: e.target.value })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="">Select carrier</option>
                    {carriers.map(carrier => (
                      <option key={carrier} value={carrier}>{carrier}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Estimated Delivery (Optional)</label>
                  <input
                    type="date"
                    value={shippingData.estimatedDelivery}
                    onChange={(e) => setShippingData({ ...shippingData, estimatedDelivery: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-gray-400 text-sm">
                    Adding tracking information helps buyers track their packages and builds trust. 
                    You can also add or update this information later.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleShipOrder(showShippingForm)}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Mark as Shipped
                  </button>
                  <button
                    onClick={() => setShowShippingForm(null)}
                    className="px-6 py-3 luxe-glass hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Tracking Form Modal */}
        {showTrackingForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-md">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase">Update Tracking</h3>
                  <button
                    onClick={() => setShowTrackingForm(null)}
                    className="p-2 hover:luxe-glass rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Tracking Number</label>
                  <input
                    type="text"
                    value={shippingData.trackingNumber}
                    onChange={(e) => setShippingData({ ...shippingData, trackingNumber: e.target.value })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="Enter tracking number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Carrier</label>
                  <select
                    value={shippingData.carrier}
                    onChange={(e) => setShippingData({ ...shippingData, carrier: e.target.value })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">Select carrier</option>
                    {carriers.map(carrier => (
                      <option key={carrier} value={carrier}>{carrier}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Estimated Delivery</label>
                  <input
                    type="date"
                    value={shippingData.estimatedDelivery}
                    onChange={(e) => setShippingData({ ...shippingData, estimatedDelivery: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleUpdateTracking(showTrackingForm)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Update Tracking
                  </button>
                  <button
                    onClick={() => setShowTrackingForm(null)}
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