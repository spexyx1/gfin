import React, { useState, useEffect } from 'react';
import { Clock, Gavel, TrendingUp, TrendingDown, Zap, Eye, User, ShieldCheck } from 'lucide-react';
import { Auction } from '../types';

interface AuctionCardProps {
  auction: Auction;
  onClick: () => void;
  onQuickBid?: () => void;
}

export function AuctionCard({ auction, onClick, onQuickBid }: AuctionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = auction.endTime.getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('ENDED');
        setUrgencyLevel('critical');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours < 1) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
        setUrgencyLevel('critical');
      } else if (hours < 24) {
        setTimeRemaining(`${hours}h ${minutes}m`);
        setUrgencyLevel('warning');
      } else {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days}d ${hours % 24}h`);
        setUrgencyLevel('normal');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction.endTime]);

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'critical':
        return 'text-red-400 border-red-500/50 bg-red-500/10';
      case 'warning':
        return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
      default:
        return 'text-luxe-gold border-luxe-gold/50 bg-luxe-gold/10';
    }
  };

  const getTypeIcon = () => {
    if (auction.auctionType === 'english') {
      return <TrendingUp className="w-4 h-4" />;
    }
    return <TrendingDown className="w-4 h-4" />;
  };

  const getTypeLabel = () => {
    return auction.auctionType === 'english' ? 'ENGLISH' : 'DUTCH';
  };

  const imageUrl = auction.product?.image || '';

  return (
    <div
      onClick={onClick}
      className="luxe-glass/50 rounded-2xl border border-white/10 overflow-hidden hover:border-luxe-gold/50 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-neon-blue/20"
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={auction.product?.title || 'Auction item'}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="px-3 py-1 bg-black/80 backdrop-blur-sm rounded-lg flex items-center space-x-1.5 border border-gray-600">
            {getTypeIcon()}
            <span className="text-xs font-black text-gray-200 uppercase">{getTypeLabel()}</span>
          </div>

          {auction.buyNowPrice && (
            <div className="px-3 py-1 bg-yellow-500/20 backdrop-blur-sm rounded-lg flex items-center space-x-1.5 border border-yellow-500/50">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-black text-yellow-400 uppercase">BUY NOW</span>
            </div>
          )}
        </div>

        <div className={`absolute top-3 right-3 px-3 py-1.5 backdrop-blur-sm rounded-lg border ${getUrgencyColor()} font-black text-xs uppercase flex items-center space-x-1.5`}>
          <Clock className="w-3 h-3" />
          <span>{timeRemaining}</span>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center space-x-3 text-xs">
          <div className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded-lg flex items-center space-x-1 border border-gray-600">
            <Gavel className="w-3 h-3 text-gray-400" />
            <span className="font-black text-gray-200 uppercase">{auction.totalBids}</span>
          </div>
          <div className="px-2 py-1 bg-black/80 backdrop-blur-sm rounded-lg flex items-center space-x-1 border border-gray-600">
            <Eye className="w-3 h-3 text-gray-400" />
            <span className="font-black text-gray-200 uppercase">{auction.viewCount}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-black text-gray-200 uppercase mb-2 line-clamp-2 group-hover:text-luxe-gold transition-colors">
          {auction.product?.title || 'Auction Item'}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <User className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-bold text-gray-400 uppercase">
              {auction.seller?.name || 'Unknown'}
            </span>
            {auction.seller?.verified && (
              <ShieldCheck className="w-3 h-3 text-luxe-gold" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">CURRENT BID</span>
            <div className="text-right">
              <div className="text-2xl font-black text-luxe-gold uppercase">
                ${auction.currentPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {auction.reservePrice && auction.currentPrice < auction.reservePrice && (
            <div className="text-xs font-bold text-yellow-400 uppercase text-center py-1 px-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              RESERVE NOT MET
            </div>
          )}

          {auction.buyNowPrice && (
            <div className="flex items-baseline justify-between pt-1 border-t border-white/10">
              <span className="text-xs font-bold text-gray-500 uppercase">BUY NOW</span>
              <span className="text-sm font-black text-yellow-400 uppercase">
                ${auction.buyNowPrice.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {onQuickBid && auction.status === 'active' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickBid();
            }}
            className="w-full mt-4 py-3 bg-luxe-gold hover:shadow-neon-blue text-black font-black rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 uppercase active:btn-neon-active"
          >
            <Gavel className="w-4 h-4" />
            <span>PLACE BID</span>
          </button>
        )}

        {auction.status === 'ended' && (
          <div className="mt-4 py-3 luxe-glass text-gray-400 font-black rounded-xl text-center uppercase">
            AUCTION ENDED
          </div>
        )}
      </div>
    </div>
  );
}
