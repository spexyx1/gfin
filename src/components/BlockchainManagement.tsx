import { useState } from 'react';
import { Coins, Shield, BarChart3, Activity, Settings } from 'lucide-react';
import { BlockchainTokenDashboard } from './BlockchainTokenDashboard';
import { BlockchainEscrowDashboard } from './BlockchainEscrowDashboard';
import { ContractDeploymentAdmin } from './ContractDeploymentAdmin';

export function BlockchainManagement() {
  const [activeView, setActiveView] = useState<'token' | 'escrow' | 'contracts' | 'analytics'>('token');

  return (
    <div className="min-h-screen luxe-glass-strong">
      {/* Navigation */}
      <div className="luxe-glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-4">
            <button
              onClick={() => setActiveView('token')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'token'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white hover:luxe-glass'
              }`}
            >
              <Coins className="h-5 w-5" />
              Token Management
            </button>
            <button
              onClick={() => setActiveView('escrow')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'escrow'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white hover:luxe-glass'
              }`}
            >
              <Shield className="h-5 w-5" />
              Escrow Management
            </button>
            <button
              onClick={() => setActiveView('contracts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'contracts'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white hover:luxe-glass'
              }`}
            >
              <Settings className="h-5 w-5" />
              Contract Deployments
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'analytics'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white hover:luxe-glass'
              }`}
              disabled
            >
              <BarChart3 className="h-5 w-5" />
              Analytics (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeView === 'token' && <BlockchainTokenDashboard />}
        {activeView === 'escrow' && <BlockchainEscrowDashboard />}
        {activeView === 'contracts' && <ContractDeploymentAdmin />}
        {activeView === 'analytics' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-white">
            <Activity className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-2xl font-bold mb-2">Analytics Dashboard Coming Soon</h3>
            <p className="text-gray-400">
              Advanced blockchain analytics and insights will be available here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
