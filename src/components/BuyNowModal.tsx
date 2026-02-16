import React, { useState } from 'react';
import { X, Zap, Shield, CreditCard, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Product } from '../types';
import { useWeb3 } from '../hooks/useWeb3';
import { useEscrow } from '../hooks/useEscrow';
import { useAuth } from '../hooks/useAuth';
import { useTerms } from '../hooks/useTerms';
import { useContractAddresses } from '../hooks/useContractAddresses';
import { PaymentOption } from '../types';
import { logger } from '../utils/logger';
import { EscrowNetworkWarning } from './EscrowNetworkWarning';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function BuyNowModal({ isOpen, onClose, product }: BuyNowModalProps) {
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'creating' | 'funding' | 'complete'>('review');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [selectedPaymentToken, setSelectedPaymentToken] = useState('GHETTO');
  const [estimatedFee, setEstimatedFee] = useState(0);
  const { account, connectWallet, networkName } = useWeb3();
  const { user } = useAuth();
  const { needsTermsAcceptance } = useTerms();
  const { createEscrow, fundOrder, checkTokenBalance, calculateTotalFee, isLoading } = useEscrow();
  const { addresses, loading: loadingAddresses } = useContractAddresses(networkName?.toLowerCase().replace(' ', '') || 'polygon');

  const paymentOptions: PaymentOption[] = [
    { token: 'GHETTO', symbol: 'GHETTO', name: 'Ghetto Finance', feePercent: 2.5, isPreferred: true },
    { token: 'USDC', symbol: 'USDC', name: 'USD Coin', feePercent: 3.75, isPreferred: false },
    { token: 'ETH', symbol: 'ETH', name: 'Ethereum', feePercent: 3.75, isPreferred: false },
    { token: 'BTC', symbol: 'BTC', name: 'Bitcoin', feePercent: 3.75, isPreferred: false },
  ];

  const selectedPaymentOption = paymentOptions.find(option => option.token === selectedPaymentToken) || paymentOptions[0];
  const totalWithFees = product ? product.price + estimatedFee : 0;

  // Calculate fee when payment token or product changes
  React.useEffect(() => {
    if (product && !loadingAddresses && addresses.ghettoToken && addresses.usdc) {
      const calculateFee = async () => {
        const tokenAddress = selectedPaymentToken === 'GHETTO'
          ? addresses.ghettoToken
          : selectedPaymentToken === 'USDC'
          ? addresses.usdc
          : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

        if (!tokenAddress) {
          setEstimatedFee(product.price * (selectedPaymentOption.feePercent / 100));
          return;
        }

        try {
          const fee = await calculateTotalFee(product.price, tokenAddress);
          setEstimatedFee(fee);
        } catch (error) {
          logger.error('Failed to calculate fee', 'BuyNowModal', error);
          setEstimatedFee(product.price * (selectedPaymentOption.feePercent / 100));
        }
      };

      calculateFee();
    }
  }, [product, selectedPaymentToken, selectedPaymentOption, calculateTotalFee, loadingAddresses, addresses]);

  const handleBuyNow = async () => {
    if (!product || !account) {
      await connectWallet();
      return;
    }

    if (needsTermsAcceptance) {
      alert('You must accept the Terms of Service before making purchases.');
      return;
    }

    const tokenAddress = selectedPaymentToken === 'GHETTO' 
      ? '0xB0b86a33E6417c4c4c4c4c4c4c4c4c4c4c4c4c4c' 
      : selectedPaymentToken === 'USDC'
      ? '0xA0b86a33E6417c4c4c4c4c4c4c4c4c4c4c4c4c4c'
      : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

    // Check token balance
    const hasBalance = await checkTokenBalance(totalWithFees, tokenAddress);
    if (!hasBalance) {
      alert(`Insufficient ${selectedPaymentToken} balance. Please add funds to your wallet.`);
      return;
    }

    setCheckoutStep('creating');
    
    try {
      // Create escrow order
      const newOrderId = await createEscrow(
        product.seller.id,
        product.price,
        `Buy Now: ${product.title}`,
        tokenAddress,
        selectedPaymentToken,
        product.id
      );
      
      setOrderId(newOrderId);
      setCheckoutStep('funding');
      
      // Fund the order
      await fundOrder(newOrderId, product.price);
      
      setCheckoutStep('complete');
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCheckoutStep('review');
        setOrderId(null);
      }, 2000);
    } catch (error) {
      logger.error('Buy now failed', 'BuyNowModal', error);
      alert(error instanceof Error ? error.message : 'Purchase failed. Please try again.');
      setCheckoutStep('review');
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-neon-red" />
            <h2 className="text-xl font-black text-gray-200 uppercase">BUY NOW</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-green-400 mb-2 uppercase">ORDER PLACED!</h3>
              <p className="text-gray-400 font-bold uppercase">
                Order #{orderId?.slice(0, 8)} funded successfully
              </p>
            </div>
          ) : (
            <>
              {/* Escrow Network Warning */}
              <EscrowNetworkWarning feature="marketplace purchases" />

              {/* Product Summary */}
              <div className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
                <div className="flex items-start space-x-4">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h3 className="text-gray-200 font-black uppercase line-clamp-2 mb-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-bold uppercase">
                        BY {product.seller.name}
                      </span>
                      <span className="text-xl font-black text-neon-red uppercase">
                        {product.price} GHETTO
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-gray-800/50 rounded-2xl p-4 mb-6 border border-gray-700">
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
                        className="w-4 h-4 text-neon-blue bg-gray-700 border-gray-600"
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

              {/* Gasless Transaction Info for GHETTO */}
              {selectedPaymentToken === 'GHETTO' && (
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 mb-6 border border-purple-500/30">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-white font-bold uppercase text-sm">Gasless Transaction</h4>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full font-semibold">
                          GHETTO EXCLUSIVE
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed font-medium mb-3">
                        Pay zero gas fees when using GHETTO tokens! All blockchain transaction costs are covered by the platform, including order confirmations, delivery confirmations, and fund releases.
                      </p>
                      <div className="space-y-1.5 text-xs font-bold uppercase">
                        <div className="flex items-center space-x-2 text-purple-300">
                          <CheckCircle className="w-4 h-4" />
                          <span>No gas costs for any transaction</span>
                        </div>
                        <div className="flex items-center space-x-2 text-purple-300">
                          <CheckCircle className="w-4 h-4" />
                          <span>Lower platform fees (2.5% vs 3.75%)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-purple-300">
                          <CheckCircle className="w-4 h-4" />
                          <span>Seamless escrow experience</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="bg-gray-800/50 rounded-2xl p-4 mb-6 border border-gray-700">
                <h4 className="text-gray-200 font-black mb-3 uppercase text-sm">Price Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Item Price:</span>
                    <span className="text-gray-200">{product.price} GHETTO</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Platform Fee ({selectedPaymentOption.feePercent}%):</span>
                    <span className="text-gray-200">{estimatedFee.toFixed(2)} {selectedPaymentToken}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 flex items-center justify-between font-medium">
                    <span className="text-white">Total:</span>
                    <span className="text-white">{totalWithFees.toFixed(2)} {selectedPaymentToken}</span>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-gray-800/50 rounded-2xl p-4 mb-6 border border-gray-700">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <span className="text-gray-200 font-black uppercase">SECURE PAYMENT</span>
                </div>
                <ul className="space-y-2 text-gray-400 text-sm font-bold uppercase">
                  <li>• FUNDS HELD IN ESCROW UNTIL DELIVERY</li>
                  <li>• SELLER SECURITY DEPOSIT REQUIRED</li>
                  <li>• DISPUTE PROTECTION INCLUDED</li>
                </ul>
              </div>

              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-400 font-black uppercase text-sm">INSTANT PURCHASE</span>
                </div>
                <p className="text-gray-400 text-sm font-bold uppercase">
                  THIS WILL IMMEDIATELY CREATE AN ORDER AT THE LISTED PRICE
                </p>
              </div>

              {/* Buy Button */}
              <button
                onClick={handleBuyNow}
                disabled={isLoading || checkoutStep !== 'review'}
                className="w-full py-4 bg-neon-red hover:shadow-neon-red disabled:bg-gray-700 text-black font-black rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 uppercase active:neon-red-glow"
              >
                {checkoutStep === 'creating' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>CREATING ORDER...</span>
                  </>
                ) : checkoutStep === 'funding' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>FUNDING ORDER...</span>
                  </>
                ) : isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>{account ? `BUY FOR ${totalWithFees.toFixed(2)} ${selectedPaymentToken}` : 'CONNECT WALLET'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}