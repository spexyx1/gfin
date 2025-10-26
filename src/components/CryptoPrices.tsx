import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { mockCryptoPrices } from '../data/mockData';

export const CryptoPrices: React.FC = () => {
  return (
    <div className="bg-gray-900/50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 overflow-x-auto">
          <div className="flex space-x-8 min-w-max">
            {mockCryptoPrices.map((crypto) => (
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