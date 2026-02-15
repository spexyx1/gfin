import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Key, Copy, Check, Plus, Trash2, Eye, EyeOff, ExternalLink, AlertCircle } from 'lucide-react';

interface MerchantAccount {
  id: string;
  business_name: string;
  business_email: string;
  business_website: string;
  is_verified: boolean;
  is_sandbox_mode: boolean;
  fee_percentage: number;
  daily_request_limit: number;
  created_at: string;
}

interface ApiKey {
  id: string;
  key_name: string;
  key_prefix: string;
  is_sandbox: boolean;
  status: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function MerchantDashboard() {
  const { user } = useAuth();
  const [merchantAccount, setMerchantAccount] = useState<MerchantAccount | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyIsSandbox, setNewKeyIsSandbox] = useState(true);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadMerchantData();
    }
  }, [user]);

  const loadMerchantData = async () => {
    try {
      const { data: account, error: accountError } = await supabase
        .from('merchant_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (accountError) throw accountError;

      if (account) {
        setMerchantAccount(account);

        const { data: keys, error: keysError } = await supabase
          .from('merchant_api_keys')
          .select('*')
          .eq('merchant_id', account.id)
          .order('created_at', { ascending: false });

        if (keysError) throw keysError;
        setApiKeys(keys || []);
      }
    } catch (error) {
      console.error('Error loading merchant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMerchantAccount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('merchant_accounts')
        .insert({
          user_id: user.id,
          business_name: user.username || 'My Business',
          business_email: user.email || '',
          is_sandbox_mode: true
        })
        .select()
        .single();

      if (error) throw error;
      setMerchantAccount(data);
    } catch (error) {
      console.error('Error creating merchant account:', error);
    }
  };

  const generateApiKey = async () => {
    if (!merchantAccount || !newKeyName.trim()) return;

    try {
      const { data: keyString } = await supabase.rpc('generate_api_key', {
        is_sandbox: newKeyIsSandbox
      });

      if (!keyString) throw new Error('Failed to generate key');

      const keyPrefix = keyString.substring(0, 8);
      const { data: hashedKey } = await supabase.rpc('hash_api_key', {
        api_key: keyString
      });

      const { data: apiKey, error } = await supabase
        .from('merchant_api_keys')
        .insert({
          merchant_id: merchantAccount.id,
          key_name: newKeyName,
          key_hash: hashedKey,
          key_prefix: keyPrefix,
          is_sandbox: newKeyIsSandbox,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setGeneratedKey(keyString);
      setApiKeys([apiKey, ...apiKeys]);
      setNewKeyName('');
    } catch (error) {
      console.error('Error generating API key:', error);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('merchant_api_keys')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: user?.id
        })
        .eq('id', keyId);

      if (error) throw error;

      setApiKeys(apiKeys.map(key =>
        key.id === keyId ? { ...key, status: 'revoked' } : key
      ));
    } catch (error) {
      console.error('Error revoking API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!merchantAccount) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Key className="w-16 h-16 mx-auto mb-4 text-orange-600" />
          <h2 className="text-2xl font-bold mb-4">Merchant API Access</h2>
          <p className="text-gray-600 mb-6">
            Create a merchant account to access the Natively Merchant API and integrate
            our escrow system into your external applications.
          </p>
          <button
            onClick={createMerchantAccount}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
          >
            Create Merchant Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Merchant API Dashboard</h1>
        <p className="text-gray-600">Manage your API keys and integration settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Account Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${merchantAccount.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                {merchantAccount.is_verified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Mode:</span>
              <span className="font-semibold">
                {merchantAccount.is_sandbox_mode ? 'Sandbox' : 'Production'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Fee Rate:</span>
              <span className="font-semibold">{merchantAccount.fee_percentage}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">API Keys</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Keys:</span>
              <span className="font-semibold">{apiKeys.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active:</span>
              <span className="font-semibold text-green-600">
                {apiKeys.filter(k => k.status === 'active').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Revoked:</span>
              <span className="font-semibold text-red-600">
                {apiKeys.filter(k => k.status === 'revoked').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Rate Limits</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Daily Limit:</span>
              <span className="font-semibold">{merchantAccount.daily_request_limit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Hourly Limit:</span>
              <span className="font-semibold">
                {Math.floor(merchantAccount.daily_request_limit / 24).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">API Keys</h2>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            <Plus className="w-5 h-5" />
            <span>Create API Key</span>
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No API keys yet. Create one to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className={`border rounded-lg p-4 ${
                  key.status === 'revoked' ? 'bg-gray-50 opacity-60' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{key.key_name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          key.is_sandbox ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {key.is_sandbox ? 'Sandbox' : 'Production'}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          key.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {key.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {visibleKeys.has(key.id) ? key.key_prefix : `${key.key_prefix}${'•'.repeat(32)}`}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(key.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {visibleKeys.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Scopes: {key.scopes.join(', ')}</p>
                      <p>Created: {new Date(key.created_at).toLocaleDateString()}</p>
                      {key.last_used_at && (
                        <p>Last used: {new Date(key.last_used_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  {key.status === 'active' && (
                    <button
                      onClick={() => revokeApiKey(key.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Revoke API Key"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">API Documentation</h3>
            <p className="text-blue-800 mb-3">
              View the complete API documentation and integration guides to get started.
            </p>
            <a
              href="/api-docs"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>View Documentation</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            {generatedKey ? (
              <div>
                <h3 className="text-xl font-bold mb-4">API Key Generated</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                  <p className="text-yellow-800 text-sm mb-2">
                    <strong>Important:</strong> Copy this key now. You won't be able to see it again.
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded mb-4 break-all">
                  <code className="text-sm">{generatedKey}</code>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedKey(null);
                      setShowNewKeyModal(false);
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-4">Create API Key</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Key Name</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="My API Key"
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Environment</label>
                    <select
                      value={newKeyIsSandbox ? 'sandbox' : 'production'}
                      onChange={(e) => setNewKeyIsSandbox(e.target.value === 'sandbox')}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={generateApiKey}
                    disabled={!newKeyName.trim()}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Key
                  </button>
                  <button
                    onClick={() => {
                      setShowNewKeyModal(false);
                      setNewKeyName('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
