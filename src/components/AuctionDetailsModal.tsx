import React, { useState, useEffect } from 'react';
import { X, Gavel, Clock, Eye, TrendingUp, User, ShieldCheck, Package, DollarSign } from 'lucide-react';
import { Auction, AuctionBid } from '../types';
import { useAuctionBids } from '../hooks/useAuctionBids';
import { formatDistanceToNow } from 'date-fns';

interface AuctionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction | null;
  onPlaceBid: () => void;
}

export function AuctionDetailsModal({ isOpen, onClose, auction, onPlaceBid }: AuctionDetailsModalProps) {
  const { bids, loadBidHistory, subscribeToBids } = useAuctionBids(auction?.id);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!auction || !isOpen) return;

    loadBidHistory(auction.id);

    const unsubscribe = subscribeToBids(auction.id, (newBid) => {
      loadBidHistory(auction.id);
    });

    return () => unsubscribe();
  }, [auction?.id, isOpen]);

  useEffect(() => {
    if (!auction) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = auction.endTime.getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('ENDED');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  if (!isOpen || !auction) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="luxe-glass-strong rounded-3xl border border-white/10 w-full max-w-4xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Gavel className="h-5 w-5 text-luxe-gold" />
            <h2 className="text-xl font-black text-gray-200 uppercase">AUCTION DETAILS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:luxe-glass rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <img
                src={auction.product?.image || ''}
                alt={auction.product?.title}
                className="w-full h-64 object-cover rounded-2xl"
              />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-gray-200 uppercase mb-2">
                  {auction.product?.title}
                </h3>
                <p className="text-gray-400 font-bold uppercase text-sm">
                  {auction.product?.description}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 font-bold uppercase text-sm">
                  {auction.seller?.name}
                </span>
                {auction.seller?.verified && (
                  <ShieldCheck className="w-4 h-4 text-luxe-gold" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="luxe-glass rounded-xl p-4 border border-white/10">
                  <div className="text-gray-400 text-xs font-bold uppercase mb-1">CURRENT BID</div>
                  <div className="text-2xl font-black text-luxe-gold uppercase">
                    ${auction.currentPrice.toFixed(2)}
                  </div>
                </div>

                <div className="luxe-glass rounded-xl p-4 border border-white/10">
                  <div className="text-gray-400 text-xs font-bold uppercase mb-1">TIME LEFT</div>
                  <div className="text-2xl font-black text-yellow-400 uppercase">
                    {timeRemaining}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Gavel className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 font-bold uppercase">{auction.totalBids} BIDS</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 font-bold uppercase">{auction.viewCount} VIEWS</span>
                </div>
              </div>

              {auction.status === 'active' && (
                <button
                  onClick={onPlaceBid}
                  className="w-full py-4 bg-luxe-gold hover:shadow-neon-blue text-black font-black rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 uppercase active:btn-neon-active"
                >
                  <Gavel className="h-4 w-4" />
                  <span>PLACE BID</span>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h4 className="text-lg font-black text-gray-200 uppercase mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-luxe-gold" />
              <span>BID HISTORY ({bids.length})</span>
            </h4>

            {bids.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-bold uppercase">
                NO BIDS YET - BE THE FIRST!
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bids.map((bid, index) => (
                  <div
                    key={bid.id}
                    className={`p-4 rounded-xl border ${
                      bid.isWinning
                        ? 'bg-luxe-gold/10 border-luxe-gold/50'
                        : 'luxe-glass opacity-50 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                          bid.isWinning ? 'bg-luxe-gold text-black' : 'luxe-glass text-gray-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-gray-200 uppercase text-sm">
                              {bid.bidder?.name || 'Anonymous'}
                            </span>
                            {bid.bidder?.verified && (
                              <ShieldCheck className="w-3 h-3 text-luxe-gold" />
                            )}
                            {bid.isWinning && (
                              <span className="px-2 py-0.5 bg-luxe-gold text-black text-xs font-black rounded uppercase">
                                WINNING
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-bold uppercase">
                            {formatDistanceToNow(bid.createdAt, { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-luxe-gold uppercase">
                          ${bid.amount.toFixed(2)}
                        </div>
                        {bid.bidType === 'auto' && (
                          <div className="text-xs text-gray-500 font-bold uppercase">AUTO-BID</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-6 mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 font-bold uppercase mb-1">AUCTION TYPE</div>
              <div className="font-black text-gray-200 uppercase">{auction.auctionType}</div>
            </div>
            {auction.reservePrice && (
              <div>
                <div className="text-gray-400 font-bold uppercase mb-1">RESERVE PRICE</div>
                <div className="font-black text-gray-200 uppercase">${auction.reservePrice.toFixed(2)}</div>
              </div>
            )}
            {auction.buyNowPrice && (
              <div>
                <div className="text-gray-400 font-bold uppercase mb-1">BUY NOW PRICE</div>
                <div className="font-black text-yellow-400 uppercase">${auction.buyNowPrice.toFixed(2)}</div>
              </div>
            )}
            <div>
              <div className="text-gray-400 font-bold uppercase mb-1">STARTED</div>
              <div className="font-black text-gray-200 uppercase">
                {formatDistanceToNow(auction.startTime, { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
