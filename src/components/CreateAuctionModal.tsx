import React, { useState } from 'react';
import { X, Gavel, TrendingUp, TrendingDown, Clock, DollarSign, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { SellerProduct, AuctionFormData } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useTerms } from '../hooks/useTerms';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: SellerProduct | null;
  onCreateAuction: (formData: AuctionFormData) => Promise<boolean>;
}

export function CreateAuctionModal({ isOpen, onClose, product, onCreateAuction }: CreateAuctionModalProps) {
  const { user } = useAuth();
  const { needsTermsAcceptance } = useTerms();
  const [auctionType, setAuctionType] = useState<'english' | 'dutch'>('english');
  const [startPrice, setStartPrice] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [durationDays, setDurationDays] = useState('3');
  const [durationHours, setDurationHours] = useState('0');
  const [dutchDecrementHours, setDutchDecrementHours] = useState('24');
  const [dutchDecrementPercent, setDutchDecrementPercent] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (needsTermsAcceptance) {
      setError('You must accept the Terms of Service before creating auctions.');
      return;
    }

    const startPriceNum = parseFloat(startPrice);
    const reservePriceNum = reservePrice ? parseFloat(reservePrice) : undefined;
    const buyNowPriceNum = buyNowPrice ? parseFloat(buyNowPrice) : undefined;
    const durationMinutes = parseInt(durationDays) * 24 * 60 + parseInt(durationHours) * 60;

    if (isNaN(startPriceNum) || startPriceNum <= 0) {
      setError('Please enter a valid starting price');
      return;
    }

    if (reservePriceNum && reservePriceNum < startPriceNum) {
      setError('Reserve price must be greater than or equal to starting price');
      return;
    }

    if (buyNowPriceNum && buyNowPriceNum < startPriceNum * 1.5) {
      setError('Buy now price must be at least 150% of starting price');
      return;
    }

    if (durationMinutes < 60) {
      setError('Auction duration must be at least 1 hour');
      return;
    }

    if (durationMinutes > 30 * 24 * 60) {
      setError('Auction duration cannot exceed 30 days');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const formData: AuctionFormData = {
      productId: product.id,
      auctionType,
      startPrice: startPriceNum,
      reservePrice: reservePriceNum,
      buyNowPrice: buyNowPriceNum,
      durationMinutes,
      dutchDecrementHours: auctionType === 'dutch' ? parseInt(dutchDecrementHours) : undefined,
      dutchDecrementPercent: auctionType === 'dutch' ? parseFloat(dutchDecrementPercent) : undefined,
    };

    const result = await onCreateAuction(formData);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } else {
      setError('Failed to create auction. Please try again.');
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setAuctionType('english');
    setStartPrice('');
    setReservePrice('');
    setBuyNowPrice('');
    setDurationDays('3');
    setDurationHours('0');
    setDutchDecrementHours('24');
    setDutchDecrementPercent('10');
    setSuccess(false);
    setError('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-2xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Gavel className="h-5 w-5 text-neon-blue" />
            <h2 className="text-xl font-black text-gray-200 uppercase">CREATE AUCTION</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-green-400 mb-2 uppercase">AUCTION CREATED!</h3>
              <p className="text-gray-400 font-bold uppercase">Your auction is now live</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
                <div className="flex items-start space-x-4">
                  <img
                    src={product.images[0]?.url || 'https://images.pexels.com/photos/7567482/pexels-photo-7567482.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h3 className="text-gray-200 font-black uppercase mb-1">{product.title}</h3>
                    <p className="text-gray-400 text-sm font-bold uppercase line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-200 font-black mb-3 uppercase">AUCTION TYPE</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAuctionType('english')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        auctionType === 'english'
                          ? 'border-neon-blue bg-neon-blue/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${auctionType === 'english' ? 'text-neon-blue' : 'text-gray-400'}`} />
                      <div className="text-center">
                        <div className="font-black text-gray-200 uppercase">ENGLISH</div>
                        <div className="text-xs text-gray-400 font-bold uppercase mt-1">Ascending Bids</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuctionType('dutch')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        auctionType === 'dutch'
                          ? 'border-neon-blue bg-neon-blue/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <TrendingDown className={`w-8 h-8 mx-auto mb-2 ${auctionType === 'dutch' ? 'text-neon-blue' : 'text-gray-400'}`} />
                      <div className="text-center">
                        <div className="font-black text-gray-200 uppercase">DUTCH</div>
                        <div className="text-xs text-gray-400 font-bold uppercase mt-1">Descending Price</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-200 font-black mb-2 uppercase">
                      {auctionType === 'english' ? 'STARTING PRICE' : 'STARTING PRICE'}
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={startPrice}
                        onChange={(e) => setStartPrice(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent text-gray-200 font-bold"
                        placeholder="100.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-200 font-black mb-2 uppercase">RESERVE PRICE (Optional)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={reservePrice}
                        onChange={(e) => setReservePrice(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent text-gray-200 font-bold"
                        placeholder="150.00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-200 font-black mb-2 uppercase">BUY NOW PRICE (Optional)</label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={buyNowPrice}
                      onChange={(e) => setBuyNowPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent text-gray-200 font-bold"
                      placeholder="200.00"
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1 font-bold uppercase">Instant purchase option</p>
                </div>

                <div>
                  <label className="block text-gray-200 font-black mb-2 uppercase">AUCTION DURATION</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={durationDays}
                          onChange={(e) => setDurationDays(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent text-gray-200 font-bold"
                        />
                      </div>
                      <p className="text-gray-500 text-xs mt-1 font-bold uppercase text-center">Days</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent text-gray-200 font-bold"
                      />
                      <p className="text-gray-500 text-xs mt-1 font-bold uppercase text-center">Hours</p>
                    </div>
                  </div>
                </div>

                {auctionType === 'dutch' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div>
                      <label className="block text-gray-200 font-black mb-2 uppercase text-sm">Price Drop Every</label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={dutchDecrementHours}
                        onChange={(e) => setDutchDecrementHours(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent text-gray-200 font-bold"
                      />
                      <p className="text-gray-500 text-xs mt-1 font-bold uppercase">Hours</p>
                    </div>
                    <div>
                      <label className="block text-gray-200 font-black mb-2 uppercase text-sm">Drop Percentage</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={dutchDecrementPercent}
                        onChange={(e) => setDutchDecrementPercent(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent text-gray-200 font-bold"
                      />
                      <p className="text-gray-500 text-xs mt-1 font-bold uppercase">Percent</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                  </div>
                )}

                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-gray-200 font-black mb-2 uppercase text-sm">Auction Details:</h4>
                  <ul className="space-y-1 text-gray-400 text-xs font-bold uppercase">
                    <li>• 5-MINUTE AUTO-EXTENSION IF BID IN LAST 5 MINUTES</li>
                    <li>• MAXIMUM 3 EXTENSIONS PER AUCTION</li>
                    <li>• MINIMUM BID INCREMENT: 5% OF CURRENT PRICE</li>
                    <li>• WINNER HAS 24 HOURS TO COMPLETE PAYMENT</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-neon-blue hover:shadow-neon-blue disabled:bg-gray-700 text-black font-black rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 uppercase active:btn-neon-active"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Gavel className="h-4 w-4" />
                      <span>CREATE AUCTION</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
