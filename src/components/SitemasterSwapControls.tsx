import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard as Edit2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

interface Token {
  id: string;
  chain_id: number;
  chain_name: string;
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_decimals: number;
  is_gasless_enabled: boolean;
  is_active: boolean;
  icon_url: string | null;
  created_at: string;
}

export function SitemasterSwapControls() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddToken, setShowAddToken] = useState(false);
  const [editingToken, setEditingToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    chain_id: '',
    chain_name: '',
    token_address: '',
    token_symbol: '',
    token_name: '',
    token_decimals: '18',
    is_gasless_enabled: false,
    is_active: true,
    icon_url: ''
  });

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from('supported_swap_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      logger.error('Error loading tokens', 'SitemasterSwapControls', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToken = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return;

      const { error } = await supabase
        .from('supported_swap_tokens')
        .insert({
          chain_id: parseInt(formData.chain_id),
          chain_name: formData.chain_name,
          token_address: formData.token_address,
          token_symbol: formData.token_symbol.toUpperCase(),
          token_name: formData.token_name,
          token_decimals: parseInt(formData.token_decimals),
          is_gasless_enabled: formData.is_gasless_enabled,
          is_active: formData.is_active,
          icon_url: formData.icon_url || null,
          added_by: session.session.user.id
        });

      if (error) throw error;

      setShowAddToken(false);
      resetForm();
      loadTokens();
    } catch (error) {
      logger.error('Error adding token', 'SitemasterSwapControls', error);
      alert('Failed to add token');
    }
  };

  const handleUpdateToken = async (tokenId: string) => {
    try {
      const token = tokens.find(t => t.id === tokenId);
      if (!token) return;

      const { error } = await supabase
        .from('supported_swap_tokens')
        .update({
          is_gasless_enabled: token.is_gasless_enabled,
          is_active: token.is_active
        })
        .eq('id', tokenId);

      if (error) throw error;

      setEditingToken(null);
      loadTokens();
    } catch (error) {
      logger.error('Error updating token', 'SitemasterSwapControls', error);
      alert('Failed to update token');
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this token?')) return;

    try {
      const { error } = await supabase
        .from('supported_swap_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;
      loadTokens();
    } catch (error) {
      logger.error('Error deleting token', 'SitemasterSwapControls', error);
      alert('Failed to delete token');
    }
  };

  const toggleTokenActive = (tokenId: string) => {
    setTokens(tokens.map(t =>
      t.id === tokenId ? { ...t, is_active: !t.is_active } : t
    ));
  };

  const toggleGasless = (tokenId: string) => {
    setTokens(tokens.map(t =>
      t.id === tokenId ? { ...t, is_gasless_enabled: !t.is_gasless_enabled } : t
    ));
  };

  const resetForm = () => {
    setFormData({
      chain_id: '',
      chain_name: '',
      token_address: '',
      token_symbol: '',
      token_name: '',
      token_decimals: '18',
      is_gasless_enabled: false,
      is_active: true,
      icon_url: ''
    });
  };

  const commonChains = [
    { id: 137, name: 'Polygon' },
    { id: 1, name: 'Ethereum' },
    { id: 56, name: 'BSC' },
    { id: 43114, name: 'Avalanche' },
    { id: 42161, name: 'Arbitrum' },
    { id: 10, name: 'Optimism' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-luxe-gold uppercase">Swap Token Management</h2>
        <button
          onClick={() => setShowAddToken(!showAddToken)}
          className="px-4 py-2 bg-luxe-gold hover:bg-luxe-gold/80 text-black rounded-lg transition-colors font-bold flex items-center space-x-2"
        >
          {showAddToken ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddToken ? 'Cancel' : 'Add Token'}</span>
        </button>
      </div>

      {/* Add Token Form */}
      {showAddToken && (
        <div className="luxe-glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Add New Token</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Chain</label>
              <select
                value={formData.chain_id}
                onChange={(e) => {
                  const chain = commonChains.find(c => c.id === parseInt(e.target.value));
                  setFormData({
                    ...formData,
                    chain_id: e.target.value,
                    chain_name: chain?.name || ''
                  });
                }}
                className="w-full luxe-glass border border-white/10 rounded-lg px-4 py-2 text-white"
              >
                <option value="">Select Chain</option>
                {commonChains.map(chain => (
                  <option key={chain.id} value={chain.id}>{chain.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Token Symbol</label>
              <input
                type="text"
                value={formData.token_symbol}
                onChange={(e) => setFormData({ ...formData, token_symbol: e.target.value })}
                placeholder="USDC"
                className="w-full luxe-glass border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Token Name</label>
              <input
                type="text"
                value={formData.token_name}
                onChange={(e) => setFormData({ ...formData, token_name: e.target.value })}
                placeholder="USD Coin"
                className="w-full luxe-glass border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Token Address</label>
              <input
                type="text"
                value={formData.token_address}
                onChange={(e) => setFormData({ ...formData, token_address: e.target.value })}
                placeholder="0x..."
                className="w-full luxe-glass border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Decimals</label>
              <input
                type="number"
                value={formData.token_decimals}
                onChange={(e) => setFormData({ ...formData, token_decimals: e.target.value })}
                className="w-full luxe-glass border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-400 mb-2">Icon URL (optional)</label>
              <input
                type="text"
                value={formData.icon_url}
                onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                placeholder="https://..."
                className="w-full luxe-glass border border-white/10 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div className="col-span-2 flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_gasless_enabled}
                  onChange={(e) => setFormData({ ...formData, is_gasless_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10"
                />
                <span className="text-sm text-white">Enable Gasless Transactions</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10"
                />
                <span className="text-sm text-white">Active</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleAddToken}
            className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-neon-yellow to-neon-orange text-black font-black rounded-xl hover:opacity-90 transition-opacity uppercase"
          >
            Add Token
          </button>
        </div>
      )}

      {/* Tokens List */}
      <div className="luxe-glass rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">Approved Tokens</h3>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No tokens configured yet</div>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="bg-black/40 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-white font-bold">{token.token_symbol}</h4>
                      <span className="text-sm text-gray-400">{token.token_name}</span>
                      <span className="text-xs px-2 py-1 luxe-glass rounded">{token.chain_name}</span>
                      {token.is_gasless_enabled && (
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Gasless</span>
                        </span>
                      )}
                      {!token.is_active && (
                        <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{token.token_address}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {editingToken === token.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateToken(token.id)}
                          className="p-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => setEditingToken(null)}
                          className="p-2 bg-gray-600 hover:luxe-glass rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingToken(token.id)}
                          className="p-2 luxe-glass hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => handleDeleteToken(token.id)}
                          className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingToken === token.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={token.is_gasless_enabled}
                        onChange={() => toggleGasless(token.id)}
                        className="w-4 h-4 rounded border-white/10"
                      />
                      <span className="text-sm text-white">Gasless</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={token.is_active}
                        onChange={() => toggleTokenActive(token.id)}
                        className="w-4 h-4 rounded border-white/10"
                      />
                      <span className="text-sm text-white">Active</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
