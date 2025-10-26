import React from 'react';
import { Shield, Clock, CheckCircle, AlertTriangle, Lock } from 'lucide-react';

export function EscrowInfo() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="h-6 w-6 text-green-400" />
        <h3 className="text-xl font-bold text-white">Escrow Protection</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Secure Payments</h4>
            <p className="text-gray-400 text-sm">
              Your USDC is held safely in smart contract escrow until delivery confirmation
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Buyer Protection</h4>
            <p className="text-gray-400 text-sm">
              Funds are only released when you confirm receipt of your order
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 text-yellow-400" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Auto-Release</h4>
            <p className="text-gray-400 text-sm">
              Funds automatically release to seller after 7 days if no disputes
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock className="h-4 w-4 text-orange-400" />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">Seller Hold</h4>
            <p className="text-gray-400 text-sm">
              10% of order value held from seller funds as security deposit
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium text-sm">Platform Fee: 2.5%</span>
          </div>
        </div>
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-orange-400" />
            <span className="text-orange-400 font-medium text-sm">Seller Security: 10%</span>
          </div>
        </div>
      </div>
    </div>
  );
}