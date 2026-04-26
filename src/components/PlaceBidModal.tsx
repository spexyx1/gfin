import React, { useState, useEffect } from 'react';
import { X, Gavel, DollarSign, TrendingUp, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Auction } from '../types';
import { useAuth } from '../hooks/useAuth';

interface PlaceBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction | null;
  onPlaceBid: (amount: number, autoBidMax?: number) => Promise<boolean>;
  calculateMinimumBid: (currentPrice: number) => number;
}

export function PlaceBidModal({ isOpen, onClose, auction, onPlaceBid, calculateMinimumBid }: PlaceBidModalProps) {
  const [bidAmount, setBidAmount] = useState('');
  const [useAutoBid, setUseAutoBid] = useState(false);
  const [autoBidMax, setAutoBidMax] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { user, needsTermsAcceptance } = useAuth();

  useEffect(() => {
    if (auction) {
      const minBid = calculateMinimumBid(auction.currentPrice);
      setBidAmount(minBid.toFixed(2));
    }
  }, [auction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction || !user) return;

    if (needsTermsAcceptance) {
      setError('You must accept the Terms of Service before placing bids.');
      return;
    }

    const bid = parseFloat(bidAmount);
    const maxBid = useAutoBid && autoBidMax ? parseFloat(autoBidMax) : undefined;

    if (isNaN(bid) || bid <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }

    const minBid = calculateMinimumBid(auction.currentPrice);
    if (bid < minBid) {
      setError(`Minimum bid is $${minBid.toFixed(2)}`);
      return;
    }

    if (useAutoBid && maxBid) {
      if (isNaN(maxBid) || maxBid < bid) {
        setError('Maximum auto-bid must be greater than or equal to your bid');
        return;
      }
    }

    if (auction.buyNowPrice && bid >= auction.buyNowPrice) {
      setError(`Bid exceeds buy now price. Use "Buy Now" instead.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await onPlaceBid(bid, maxBid);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } else {
      setError('Failed to place bid. Please try again.');
    }

    setIsSubmitting(false);
  };

  const resetForm = () => {
    setBidAmount('');
    setUseAutoBid(false);
    setAutoBidMax('');
    setSuccess(false);
    setError('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleQuickBid = () => {
    if (auction) {
      const minBid = calculateMinimumBid(auction.currentPrice);
      setBidAmount(minBid.toFixed(2));
    }
  };

  if (!isOpen || !auction) return null;

  const minBid = calculateMinimumBid(auction.currentPrice);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="luxe-glass-strong rounded-3xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Gavel className="h-5 w-5 text-luxe-gold" />
            <h2 className="text-xl font-black text-gray-200 uppercase">PLACE BID</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:luxe-glass rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-green-400 mb-2 uppercase">BID PLACED!</h3>
              <p className="text-gray-400 font-bold uppercase">Your bid has been submitted</p>
            </div>
          ) : (
            <>
              <div className="luxe-glass rounded-2xl p-4 mb-6 border border-white/10">
                <div className="flex items-start space-x-4">
                  <img
                    src={auction.product?.image || ''}
                    alt={auction.product?.title}
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h3 className="text-gray-200 font-black uppercase line-clamp-2 mb-2">
                      {auction.product?.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-bold uppercase">
                        CURRENT BID
                      </span>
                      <span className="text-xl font-black text-luxe-gold uppercase">
                        ${auction.currentPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-200 font-black mb-2 uppercase">YOUR BID (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min={minBid}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-gray-200 font-bold text-center text-xl"
                      placeholder={minBid.toFixed(2)}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-gray-500 text-xs font-bold uppercase">
                      MINIMUM: ${minBid.toFixed(2)}
                    </p>
                    <button
                      type="button"
                      onClick={handleQuickBid}
                      className="text-xs font-bold text-luxe-gold hover:text-luxe-gold/80 uppercase"
                    >
                      SET TO MIN
                    </button>
                  </div>
                </div>

                <div className="luxe-glass opacity-50 rounded-xl p-4 border border-white/10">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAutoBid}
                      onChange={(e) => setUseAutoBid(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 text-luxe-gold focus:ring-luxe-gold"
                    />
                    <span className="text-gray-200 font-black uppercase text-sm">ENABLE AUTO-BID</span>
                  </label>
                  <p className="text-gray-500 text-xs mt-2 font-bold uppercase">
                    System will automatically bid minimum needed up to your max
                  </p>

                  {useAutoBid && (
                    <div className="mt-3">
                      <label className="block text-gray-200 font-black mb-2 uppercase text-sm">
                        MAXIMUM BID
                      </label>
                      <div className="relative">
                        <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={autoBidMax}
                          onChange={(e) => setAutoBidMax(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-gray-200 font-bold"
                          placeholder={(minBid * 1.5).toFixed(2)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {auction.buyNowPrice && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-black uppercase text-sm">BUY NOW AVAILABLE</span>
                        </div>
                        <p className="text-gray-400 text-xs font-bold uppercase">
                          Instant purchase for ${auction.buyNowPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                  </div>
                )}

                <div className="luxe-glass opacity-50 rounded-xl p-4 border border-white/10">
                  <h4 className="text-gray-200 font-black mb-2 uppercase text-sm">Bid Details:</h4>
                  <ul className="space-y-1 text-gray-400 text-xs font-bold uppercase">
                    <li>• MINIMUM INCREMENT: 5% OF CURRENT PRICE</li>
                    <li>• BIDS WITHIN LAST 5 MIN EXTEND AUCTION</li>
                    <li>• BIDS ARE BINDING AND CANNOT BE CANCELLED</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !user}
                  className="w-full py-4 bg-luxe-gold hover:shadow-neon-blue disabled:luxe-glass text-black font-black rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 uppercase active:btn-neon-active"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Gavel className="h-4 w-4" />
                      <span>{user ? 'PLACE BID' : 'LOGIN TO BID'}</span>
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
