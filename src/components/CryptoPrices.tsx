import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMultipleTokenPrices } from '../services/priceService';

interface CryptoDisplay {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export const CryptoPrices: React.FC = () => {
  const [prices, setPrices] = useState<CryptoDisplay[]>([]);

  useEffect(() => {
    const loadPrices = async () => {
      const tokens = [
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'SOL', name: 'Solana' },
        { symbol: 'MATIC', name: 'Polygon' },
        { symbol: 'BNB', name: 'BNB' }
      ];

      const priceData = await fetchMultipleTokenPrices(tokens.map(t => t.symbol));

      const displayPrices: CryptoDisplay[] = [];
      for (const token of tokens) {
        const price = priceData.get(token.symbol);
        if (price) {
          displayPrices.push({
            symbol: token.symbol,
            name: token.name,
            price: price.usd,
            change24h: price.usd_24h_change
          });
        }
      }

      setPrices(displayPrices);
    };

    loadPrices();
    const interval = setInterval(loadPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (prices.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900/50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 overflow-x-auto">
          <div className="flex space-x-8 min-w-max">
            {prices.map((crypto) => (
              <div key={crypto.symbol} className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">{crypto.symbol}</span>
                  <span className="text-gray-400 text-sm">{crypto.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-mono">
                    ${crypto.price.toLocaleString()}
                  </span>
                  <div className={`flex items-center space-x-1 ${
                    crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {crypto.change24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {Math.abs(crypto.change24h).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};