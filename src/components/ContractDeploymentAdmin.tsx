import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, CheckCircle, XCircle, ExternalLink, Copy, Plus, Trash2 } from 'lucide-react';
import { logger } from '../utils/logger';

interface ContractDeployment {
  id: string;
  contract_name: string;
  contract_address: string;
  network: string;
  chain_id: number;
  deployer_address: string;
  transaction_hash: string | null;
  block_number: number | null;
  verified: boolean;
  is_active: boolean;
  deployed_at: string;
  metadata: any;
}

export const ContractDeploymentAdmin: React.FC = () => {
  const [deployments, setDeployments] = useState<ContractDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    contract_name: 'GhettoToken',
    contract_address: '',
    network: 'polygon',
    chain_id: 137,
    deployer_address: '',
    transaction_hash: '',
    block_number: '',
    verified: false,
  });

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_deployments')
        .select('*')
        .order('deployed_at', { ascending: false });

      if (error) throw error;
      setDeployments(data || []);
    } catch (error) {
      logger.error('Error fetching deployments', 'ContractDeploymentAdmin', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeployment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('contract_deployments').insert({
        contract_name: formData.contract_name,
        contract_address: formData.contract_address.toLowerCase(),
        network: formData.network,
        chain_id: formData.chain_id,
        deployer_address: formData.deployer_address.toLowerCase(),
        transaction_hash: formData.transaction_hash || null,
        block_number: formData.block_number ? parseInt(formData.block_number) : null,
        verified: formData.verified,
        is_active: false,
      });

      if (error) throw error;

      alert('Contract deployment added successfully!');
      setShowAddForm(false);
      setFormData({
        contract_name: 'GhettoToken',
        contract_address: '',
        network: 'polygon',
        chain_id: 137,
        deployer_address: '',
        transaction_hash: '',
        block_number: '',
        verified: false,
      });
      fetchDeployments();
    } catch (error) {
      logger.error('Error adding deployment', 'ContractDeploymentAdmin', error);
      alert('Failed to add deployment. Check console for details.');
    }
  };

  const activateDeployment = async (deploymentId: string) => {
    try {
      const { error } = await supabase.rpc('activate_contract_deployment', {
        p_deployment_id: deploymentId,
      });

      if (error) throw error;

      alert('Deployment activated successfully!');
      fetchDeployments();
    } catch (error) {
      logger.error('Error activating deployment', 'ContractDeploymentAdmin', error);
      alert('Failed to activate deployment. Check console for details.');
    }
  };

  const deleteDeployment = async (deploymentId: string) => {
    if (!confirm('Are you sure you want to delete this deployment?')) return;

    try {
      const { error } = await supabase
        .from('contract_deployments')
        .delete()
        .eq('id', deploymentId);

      if (error) throw error;

      alert('Deployment deleted successfully!');
      fetchDeployments();
    } catch (error) {
      logger.error('Error deleting deployment', 'ContractDeploymentAdmin', error);
      alert('Failed to delete deployment. Check console for details.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getExplorerUrl = (deployment: ContractDeployment) => {
    const baseUrl = deployment.chain_id === 137
      ? 'https://polygonscan.com'
      : 'https://mumbai.polygonscan.com';
    return `${baseUrl}/address/${deployment.contract_address}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Contract Deployments</h1>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-300 transition"
        >
          <Plus className="w-5 h-5" />
          Add Deployment
        </button>
      </div>

      {showAddForm && (
        <div className="luxe-glass rounded-lg p-6 mb-8 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Add New Deployment</h2>
          <form onSubmit={handleAddDeployment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contract Name
                </label>
                <select
                  value={formData.contract_name}
                  onChange={(e) => setFormData({ ...formData, contract_name: e.target.value })}
                  className="w-full px-4 py-2 luxe-glass border border-gray-600 rounded-lg text-white"
                >
                  <option value="GhettoToken">GhettoToken</option>
                  <option value="EscrowContract">EscrowContract</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Network
                </label>
                <select
                  value={formData.network}
                  onChange={(e) => {
                    const network = e.target.value;
                    setFormData({
                      ...formData,
                      network,
                      chain_id: network === 'polygon' ? 137 : 80001,
                    });
                  }}
                  className="w-full px-4 py-2 luxe-glass border border-gray-600 rounded-lg text-white"
                >
                  <option value="polygon">Polygon Mainnet</option>
                  <option value="polygonMumbai">Polygon Mumbai Testnet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contract Address *
                </label>
                <input
                  type="text"
                  value={formData.contract_address}
                  onChange={(e) => setFormData({ ...formData, contract_address: e.target.value })}
                  placeholder="0x..."
                  required
                  className="w-full px-4 py-2 luxe-glass border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deployer Address *
                </label>
                <input
                  type="text"
                  value={formData.deployer_address}
                  onChange={(e) => setFormData({ ...formData, deployer_address: e.target.value })}
                  placeholder="0x..."
                  required
                  className="w-full px-4 py-2 luxe-glass border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transaction Hash
                </label>
                <input
                  type="text"
                  value={formData.transaction_hash}
                  onChange={(e) => setFormData({ ...formData, transaction_hash: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-4 py-2 luxe-glass border border-gray-600 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Block Number
                </label>
                <input
                  type="number"
                  value={formData.block_number}
                  onChange={(e) => setFormData({ ...formData, block_number: e.target.value })}
                  placeholder="12345678"
                  className="w-full px-4 py-2 luxe-glass border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verified"
                checked={formData.verified}
                onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="verified" className="text-sm text-gray-300">
                Contract is verified on block explorer
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-300 transition font-medium"
              >
                Add Deployment
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 luxe-glass text-white rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {deployments.map((deployment) => (
          <div
            key={deployment.id}
            className={`luxe-glass rounded-lg p-6 border-2 transition ${
              deployment.is_active ? 'border-green-500' : 'border-white/10'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{deployment.contract_name}</h3>
                  {deployment.is_active && (
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      ACTIVE
                    </span>
                  )}
                  {deployment.verified && (
                    <CheckCircle className="w-5 h-5 text-blue-400" title="Verified" />
                  )}
                </div>
                <p className="text-gray-400 text-sm">
                  {deployment.network === 'polygon' ? 'Polygon Mainnet' : 'Polygon Mumbai Testnet'}{' '}
                  (Chain ID: {deployment.chain_id})
                </p>
              </div>

              <div className="flex gap-2">
                {!deployment.is_active && (
                  <button
                    onClick={() => activateDeployment(deployment.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition text-sm"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => deleteDeployment(deployment.id)}
                  className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-32">Contract:</span>
                <code className="text-yellow-400 flex-1">{deployment.contract_address}</code>
                <button
                  onClick={() => copyToClipboard(deployment.contract_address)}
                  className="p-1 hover:luxe-glass rounded"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
                <a
                  href={getExplorerUrl(deployment)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:luxe-glass rounded"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-32">Deployer:</span>
                <code className="text-gray-300">{deployment.deployer_address}</code>
                <button
                  onClick={() => copyToClipboard(deployment.deployer_address)}
                  className="p-1 hover:luxe-glass rounded"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {deployment.transaction_hash && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-32">TX Hash:</span>
                  <code className="text-gray-300 text-xs">{deployment.transaction_hash}</code>
                  <button
                    onClick={() => copyToClipboard(deployment.transaction_hash!)}
                    className="p-1 hover:luxe-glass rounded"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}

              {deployment.block_number && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-32">Block:</span>
                  <code className="text-gray-300">{deployment.block_number}</code>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-32">Deployed:</span>
                <span className="text-gray-300">
                  {new Date(deployment.deployed_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {deployments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No contract deployments found. Add one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
