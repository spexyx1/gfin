import { X, Minus, Plus, ShoppingCart, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useWeb3 } from '../hooks/useWeb3';
import { useEscrow } from '../hooks/useEscrow';
import { useContractAddresses } from '../hooks/useContractAddresses';
import { useState, useMemo } from 'react';
import { PaymentOption } from '../types';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const { account, connectWallet, networkName } = useWeb3();
  const { createEscrow, fundOrder, checkTokenBalance, calculateTotalFee, isLoading } = useEscrow();
  const { addresses, loading: loadingAddresses } = useContractAddresses(networkName?.toLowerCase().replace(' ', '') || 'polygon');
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'funding' | 'complete'>('review');
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [selectedPaymentToken, setSelectedPaymentToken] = useState('GHETTO');

  const paymentOptions: PaymentOption[] = [
    { token: 'GHETTO', symbol: 'GHETTO', name: 'Ghetto Finance', feePercent: 2.5, isPreferred: true },
    { token: 'USDC', symbol: 'USDC', name: 'USD Coin', feePercent: 3.75, isPreferred: false },
    { token: 'ETH', symbol: 'ETH', name: 'Ethereum', feePercent: 3.75, isPreferred: false },
    { token: 'BTC', symbol: 'BTC', name: 'Bitcoin', feePercent: 3.75, isPreferred: false },
  ];

  const selectedPaymentOption = paymentOptions.find(option => option.token === selectedPaymentToken) || paymentOptions[0];

  const cartTotal = useMemo(() => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }, [items]);

  const estimatedFee = useMemo(() => {
    return cartTotal * (selectedPaymentOption.feePercent / 100);
  }, [cartTotal, selectedPaymentOption]);

  const totalWithFees = cartTotal + estimatedFee;

  const handleCheckout = async () => {
    if (!account) {
      await connectWallet();
      return;
    }

    if (loadingAddresses || !addresses.ghettoToken || !addresses.usdc) {
      alert('Contract addresses are still loading. Please wait a moment and try again.');
      return;
    }

    const tokenAddress = selectedPaymentToken === 'GHETTO'
      ? addresses.ghettoToken
      : selectedPaymentToken === 'USDC'
      ? addresses.usdc
      : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

    // Check inventory for all products
    const outOfStockItems: string[] = [];
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('in_stock, quantity')
        .eq('id', item.product.id)
        .single();

      if (!product || !product.in_stock) {
        outOfStockItems.push(item.product.title);
      }
    }

    if (outOfStockItems.length > 0) {
      alert(`The following items are no longer in stock: ${outOfStockItems.join(', ')}. Please remove them from your cart.`);
      return;
    }

    // Check token balance
    const hasBalance = await checkTokenBalance(totalWithFees, tokenAddress);
    if (!hasBalance) {
      alert(`Insufficient ${selectedPaymentToken} balance. Please add funds to your wallet.`);
      return;
    }

    setCheckoutStep('funding');
    const createdOrderIds: string[] = [];

    try {
      // Create escrow orders for each item
      for (const item of items) {
        const orderId = await createEscrow(
          item.product.seller,
          item.product.price * item.quantity,
          `Order for ${item.product.title} (Qty: ${item.quantity})`,
          tokenAddress,
          selectedPaymentToken,
          item.product.id
        );
        createdOrderIds.push(orderId);
      }
      
      setOrderIds(createdOrderIds);
      
      // Fund all orders
      for (let i = 0; i < createdOrderIds.length; i++) {
        const orderId = createdOrderIds[i];
        const item = items[i];
        await fundOrder(orderId, item.product.price * item.quantity);
      }
      
      setCheckoutStep('complete');
      clearCart();
      
      setTimeout(() => {
        onClose();
        setCheckoutStep('review');
        setOrderIds([]);
      }, 3000);
    } catch (error) {
      logger.error('Checkout failed', 'Cart', error);
      alert(error instanceof Error ? error.message : 'Checkout failed. Please try again.');
      setCheckoutStep('review');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md luxe-glass-strong shadow-2xl border-l border-white/10">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-luxe-gold" />
              <h2 className="text-xl font-black text-gray-200 uppercase">CART</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:luxe-glass hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {checkoutStep === 'complete' ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CheckCircle className="h-16 w-16 text-green-400 mb-4" />
                <p className="text-green-400 text-lg mb-2 font-black uppercase">ORDERS CREATED!</p>
                <p className="text-gray-500 text-sm font-bold uppercase">
                  {orderIds.length} order{orderIds.length !== 1 ? 's' : ''} funded successfully
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="h-16 w-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg mb-2 font-black uppercase">YOUR CART IS EMPTY</p>
                <p className="text-gray-500 text-sm font-bold uppercase">ADD PRODUCTS TO GET STARTED</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="luxe-glass rounded-2xl p-4 border border-white/10">
                    <div className="flex items-start space-x-4">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-xl"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-200 font-black truncate uppercase">{item.product.title}</h3>
                        <p className="text-gray-400 text-sm font-bold uppercase">{item.product.category}</p>
                        <p className="text-gray-200 font-black uppercase">{item.product.price} GHETTO</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1))}
                          className="w-8 h-8 rounded-full luxe-glass hover:bg-gray-600 flex items-center justify-center text-gray-200 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-gray-200 font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full luxe-glass hover:bg-gray-600 flex items-center justify-center text-gray-200 font-black transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-gray-200 font-black uppercase">
                        {(item.product.price * item.quantity).toFixed(2)} GHETTO
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-white/10 p-6 space-y-4">
              {/* Payment Method Selection */}
              <div className="luxe-glass rounded-2xl p-4 border border-white/10">
                <h4 className="text-gray-200 font-black mb-3 uppercase text-sm">Payment Method</h4>
                <div className="space-y-2">
                  {paymentOptions.map((option) => (
                    <label key={option.token} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentToken"
                        value={option.token}
                        checked={selectedPaymentToken === option.token}
                        onChange={(e) => setSelectedPaymentToken(e.target.value)}
                        className="w-4 h-4 text-luxe-gold luxe-glass border-gray-600"
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{option.symbol}</span>
                          {option.isPreferred && (
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                              PREFERRED
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm">{option.feePercent}% fee</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="text-gray-200">{cartTotal.toFixed(2)} GHETTO</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Platform Fee ({selectedPaymentOption.feePercent}%):</span>
                  <span className="text-gray-200">{estimatedFee.toFixed(2)} {selectedPaymentToken}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-lg font-black uppercase">
                <span className="text-gray-200">TOTAL:</span>
                <span className="text-gray-200">{totalWithFees.toFixed(2)} {selectedPaymentToken}</span>
              </div>
              
              {!selectedPaymentOption.isPreferred && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                  <p className="text-yellow-400 text-xs font-bold uppercase text-center">
                    💡 Save 1.25% by paying with GHETTO tokens!
                  </p>
                </div>
              )}
              
              <div className="luxe-glass rounded-2xl p-4 border border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-xs font-bold uppercase">Escrow Protected</span>
                </div>
                <p className="text-gray-400 text-xs">
                  Your payment is held securely until you confirm receipt of your order.
                </p>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={isLoading || checkoutStep !== 'review'}
                className="w-full bg-luxe-gold hover:shadow-neon-blue disabled:luxe-glass text-black font-black py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 uppercase active:btn-neon-active"
              >
                <CreditCard className="h-5 w-5" />
                <span>
                  {checkoutStep === 'funding' ? 'FUNDING ORDERS...' :
                   isLoading ? 'PROCESSING...' : 
                   account ? 'SECURE CHECKOUT' : 'CONNECT WALLET'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}