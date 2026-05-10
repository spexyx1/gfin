import { useState, useEffect } from 'react';
import { Fuel, CreditCard, Plus, CreditCard as Edit2, AlertTriangle, CheckCircle, Package, Truck, MapPin, X } from 'lucide-react';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Merchant {
  id: string;
  business_name: string;
  mcc: string;
  is_gas_station: boolean;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  station_brand: string;
  contact_name: string;
  contact_email: string;
  negotiated_rate: number;
  promotional_rate: number | null;
  promotional_rate_expiry: string | null;
  decal_fulfillment_status: string;
  acceptance_status: string;
  enrolled_at: string;
  notes: string;
}

interface CardConfig {
  program_name: string;
  program_status: string;
  bin_sponsor_bank: string;
  card_network: string;
  processor_name: string;
  processor_environment: string;
  merchant_fee_cap: number;
  gas_station_rate: number;
  gas_station_promo_duration_months: number;
  daily_load_limit_usd: number;
  monthly_load_limit_usd: number;
  kyc_provider_name: string;
  kyc_environment: string;
  physical_card_lead_time_days: number;
  chargeback_ratio_alert_threshold: number;
}

const emptyMerchant = {
  business_name: '',
  mcc: '5541',
  is_gas_station: true,
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  zip: '',
  latitude: '',
  longitude: '',
  station_brand: '',
  contact_name: '',
  contact_email: '',
  negotiated_rate: '0.0090',
  promotional_rate: '',
  promotional_rate_expiry: '',
  acceptance_status: 'active',
  notes: '',
};

export function CardNetworkTab() {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<'enrollment' | 'settings'>('enrollment');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [config, setConfig] = useState<CardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [merchantForm, setMerchantForm] = useState<typeof emptyMerchant>({ ...emptyMerchant });
  const [configForm, setConfigForm] = useState<Partial<CardConfig>>({});
  const [saving, setSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const db = requireSupabase();
    const { data: merchantData } = await db
      .from('merchant_card_enrollment')
      .select('*')
      .order('enrolled_at', { ascending: false });
    setMerchants((merchantData ?? []) as Merchant[]);

    const { data: configData } = await db
      .from('card_program_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (configData) {
      setConfig(configData as CardConfig);
      setConfigForm(configData as CardConfig);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnrollSubmit = async () => {
    if (!merchantForm.business_name || !merchantForm.city) return;
    setSaving(true);
    try {
      const rate = parseFloat(merchantForm.negotiated_rate || '0.015');
      const cappedRate = Math.min(rate, 0.015);

      const db = requireSupabase();
      if (editingMerchant) {
        await db
          .from('merchant_card_enrollment')
          .update({
            business_name: merchantForm.business_name,
            mcc: merchantForm.mcc,
            is_gas_station: merchantForm.is_gas_station,
            address_line1: merchantForm.address_line1,
            city: merchantForm.city,
            state: merchantForm.state,
            zip: merchantForm.zip,
            station_brand: merchantForm.station_brand,
            contact_name: merchantForm.contact_name,
            contact_email: merchantForm.contact_email,
            negotiated_rate: cappedRate,
            promotional_rate: merchantForm.promotional_rate ? parseFloat(merchantForm.promotional_rate) : null,
            promotional_rate_expiry: merchantForm.promotional_rate_expiry || null,
            acceptance_status: merchantForm.acceptance_status,
            notes: merchantForm.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingMerchant.id);
      } else {
        await db
          .from('merchant_card_enrollment')
          .insert({
            business_name: merchantForm.business_name,
            mcc: merchantForm.mcc,
            is_gas_station: merchantForm.is_gas_station,
            address_line1: merchantForm.address_line1,
            city: merchantForm.city,
            state: merchantForm.state,
            zip: merchantForm.zip,
            station_brand: merchantForm.station_brand,
            contact_name: merchantForm.contact_name,
            contact_email: merchantForm.contact_email,
            negotiated_rate: cappedRate,
            promotional_rate: merchantForm.promotional_rate ? parseFloat(merchantForm.promotional_rate) : null,
            promotional_rate_expiry: merchantForm.promotional_rate_expiry || null,
            acceptance_status: merchantForm.acceptance_status,
            notes: merchantForm.notes,
            enrolled_by: user?.id,
          });
      }
      setShowEnrollForm(false);
      setEditingMerchant(null);
      setMerchantForm({ ...emptyMerchant });
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDecalUpdate = async (id: string, status: string) => {
    await requireSupabase()
      .from('merchant_card_enrollment')
      .update({ decal_fulfillment_status: status, updated_at: new Date().toISOString() })
      .eq('id', id);
    await fetchData();
  };

  const handleSuspend = async (id: string, currentStatus: string) => {
    await requireSupabase()
      .from('merchant_card_enrollment')
      .update({ acceptance_status: currentStatus === 'active' ? 'suspended' : 'active', updated_at: new Date().toISOString() })
      .eq('id', id);
    await fetchData();
  };

  const handleSaveConfig = async () => {
    if (!configForm) return;
    setSaving(true);
    const cappedFee = Math.min(Number(configForm.merchant_fee_cap ?? 0.015), 0.015);
    await requireSupabase()
      .from('card_program_config')
      .update({
        ...configForm,
        merchant_fee_cap: cappedFee,
        updated_at: new Date().toISOString(),
      });
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
    await fetchData();
    setSaving(false);
  };

  const openEdit = (m: Merchant) => {
    setEditingMerchant(m);
    setMerchantForm({
      business_name: m.business_name,
      mcc: m.mcc,
      is_gas_station: m.is_gas_station,
      address_line1: m.address_line1,
      address_line2: '',
      city: m.city,
      state: m.state,
      zip: m.zip,
      latitude: '',
      longitude: '',
      station_brand: m.station_brand,
      contact_name: m.contact_name,
      contact_email: m.contact_email,
      negotiated_rate: String(m.negotiated_rate),
      promotional_rate: m.promotional_rate != null ? String(m.promotional_rate) : '',
      promotional_rate_expiry: m.promotional_rate_expiry ?? '',
      acceptance_status: m.acceptance_status,
      notes: m.notes,
    });
    setShowEnrollForm(true);
  };

  const decalIcon = (status: string) => {
    if (status === 'delivered') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'shipped') return <Truck className="h-4 w-4 text-blue-500" />;
    if (status === 'ordered') return <Package className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-gray-400" />;
  };

  const needsDecalReminder = (m: Merchant) =>
    m.acceptance_status === 'active' &&
    m.decal_fulfillment_status === 'not_sent' &&
    (Date.now() - new Date(m.enrolled_at).getTime()) > 7 * 24 * 60 * 60 * 1000;

  if (loading) return <div className="text-center py-12 text-gray-400">Loading card network...</div>;

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setSubTab('enrollment')}
          className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 ${
            subTab === 'enrollment' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Fuel className="h-4 w-4" /> Gas Station Enrollment
        </button>
        <button
          onClick={() => setSubTab('settings')}
          className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 ${
            subTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="h-4 w-4" /> Card Program Settings
        </button>
      </div>

      {/* ---- ENROLLMENT TAB ---- */}
      {subTab === 'enrollment' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Enrolled Merchants</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {merchants.filter(m => m.acceptance_status === 'active').length} active ·{' '}
                {merchants.filter(m => m.is_gas_station && m.acceptance_status === 'active').length} gas stations
              </p>
            </div>
            <button
              onClick={() => { setEditingMerchant(null); setMerchantForm({ ...emptyMerchant }); setShowEnrollForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Enroll Merchant
            </button>
          </div>

          {showEnrollForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">{editingMerchant ? 'Edit Merchant' : 'Enroll New Merchant'}</h4>
                <button onClick={() => { setShowEnrollForm(false); setEditingMerchant(null); }}>
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Business Name *</label>
                  <input type="text" value={merchantForm.business_name} onChange={e => setMerchantForm({ ...merchantForm, business_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">MCC Code</label>
                  <select value={merchantForm.mcc} onChange={e => setMerchantForm({ ...merchantForm, mcc: e.target.value, is_gas_station: ['5541','5542','5983'].includes(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="5541">5541 — Service Stations</option>
                    <option value="5542">5542 — Automated Fuel Dispensers</option>
                    <option value="5983">5983 — Fuel Dealers</option>
                    <option value="5411">5411 — Grocery Stores</option>
                    <option value="5812">5812 — Restaurants</option>
                    <option value="5999">5999 — Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Station Brand</label>
                  <select value={merchantForm.station_brand} onChange={e => setMerchantForm({ ...merchantForm, station_brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                    <option value="">Select brand...</option>
                    {['Shell', 'BP', 'Chevron', 'ExxonMobil', 'Valero', 'Citgo', 'Marathon', 'Sunoco', 'Speedway', 'Wawa', 'QuikTrip', 'Independent'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address *</label>
                  <input type="text" value={merchantForm.address_line1} onChange={e => setMerchantForm({ ...merchantForm, address_line1: e.target.value })}
                    placeholder="Street address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
                  <input type="text" value={merchantForm.city} onChange={e => setMerchantForm({ ...merchantForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                    <input type="text" value={merchantForm.state} onChange={e => setMerchantForm({ ...merchantForm, state: e.target.value })}
                      maxLength={2} placeholder="TX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ZIP</label>
                    <input type="text" value={merchantForm.zip} onChange={e => setMerchantForm({ ...merchantForm, zip: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
                  <input type="text" value={merchantForm.contact_name} onChange={e => setMerchantForm({ ...merchantForm, contact_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contact Email</label>
                  <input type="email" value={merchantForm.contact_email} onChange={e => setMerchantForm({ ...merchantForm, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Negotiated Rate (max 1.5%)</label>
                  <div className="relative">
                    <input type="number" step="0.0001" min="0" max="0.015" value={merchantForm.negotiated_rate}
                      onChange={e => setMerchantForm({ ...merchantForm, negotiated_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      = {(parseFloat(merchantForm.negotiated_rate || '0') * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Promo Rate Expiry</label>
                  <input type="date" value={merchantForm.promotional_rate_expiry} onChange={e => setMerchantForm({ ...merchantForm, promotional_rate_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea value={merchantForm.notes} onChange={e => setMerchantForm({ ...merchantForm, notes: e.target.value })}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={handleEnrollSubmit} disabled={saving || !merchantForm.business_name || !merchantForm.city}
                  className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editingMerchant ? 'Update Merchant' : 'Enroll Merchant'}
                </button>
                <button onClick={() => { setShowEnrollForm(false); setEditingMerchant(null); }}
                  className="px-5 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Merchants table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            {merchants.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Fuel className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No merchants enrolled yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Business</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Location</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Rate</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Decal</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchants.map(m => (
                      <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {needsDecalReminder(m) && (
                              <span title="Decal not sent — 7+ days active"><AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" /></span>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{m.business_name}</p>
                              <p className="text-xs text-gray-400">{m.station_brand || m.mcc}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {m.city}, {m.state}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-800">{(m.negotiated_rate * 100).toFixed(2)}%</span>
                          {m.promotional_rate && (
                            <span className="ml-1 text-xs text-green-600">({(m.promotional_rate * 100).toFixed(2)}% promo)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {decalIcon(m.decal_fulfillment_status)}
                            <select
                              value={m.decal_fulfillment_status}
                              onChange={e => handleDecalUpdate(m.id, e.target.value)}
                              className="text-xs border-0 bg-transparent text-gray-600 cursor-pointer"
                            >
                              <option value="not_sent">Not Sent</option>
                              <option value="ordered">Ordered</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            m.acceptance_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {m.acceptance_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(m)} className="text-blue-600 hover:text-blue-700">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleSuspend(m.id, m.acceptance_status)}
                              className={`text-xs font-medium ${m.acceptance_status === 'active' ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}
                            >
                              {m.acceptance_status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- SETTINGS TAB ---- */}
      {subTab === 'settings' && config && (
        <div className="max-w-2xl">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Program Status</label>
                <select value={configForm.program_status} onChange={e => setConfigForm({ ...configForm, program_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="staging">Staging</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Card Network</label>
                <select value={configForm.card_network} onChange={e => setConfigForm({ ...configForm, card_network: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">BIN Sponsor Bank</label>
                <input type="text" value={configForm.bin_sponsor_bank ?? ''} onChange={e => setConfigForm({ ...configForm, bin_sponsor_bank: e.target.value })}
                  placeholder="Bank name (after contract is signed)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Card Processor Name</label>
                <input type="text" value={configForm.processor_name ?? ''} onChange={e => setConfigForm({ ...configForm, processor_name: e.target.value })}
                  placeholder="e.g. Marqeta, Lithic, Galileo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Processor Environment</label>
                <select value={configForm.processor_environment} onChange={e => setConfigForm({ ...configForm, processor_environment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Merchant Fee Cap (max 1.5%)</label>
                <div className="relative">
                  <input type="number" step="0.0001" min="0" max="0.015"
                    value={configForm.merchant_fee_cap ?? 0.015}
                    onChange={e => setConfigForm({ ...configForm, merchant_fee_cap: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    = {((configForm.merchant_fee_cap ?? 0.015) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Gas Station Rate</label>
                <div className="relative">
                  <input type="number" step="0.0001" min="0" max="0.015"
                    value={configForm.gas_station_rate ?? 0.009}
                    onChange={e => setConfigForm({ ...configForm, gas_station_rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    = {((configForm.gas_station_rate ?? 0.009) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Daily Load Limit (USD)</label>
                <input type="number" value={configForm.daily_load_limit_usd ?? 5000}
                  onChange={e => setConfigForm({ ...configForm, daily_load_limit_usd: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Monthly Load Limit (USD)</label>
                <input type="number" value={configForm.monthly_load_limit_usd ?? 10000}
                  onChange={e => setConfigForm({ ...configForm, monthly_load_limit_usd: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">KYC Provider</label>
                <input type="text" value={configForm.kyc_provider_name ?? ''} onChange={e => setConfigForm({ ...configForm, kyc_provider_name: e.target.value })}
                  placeholder="e.g. Persona, Onfido, Stripe Identity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">KYC Environment</label>
                <select value={configForm.kyc_environment} onChange={e => setConfigForm({ ...configForm, kyc_environment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Physical Card Lead Time (days)</label>
                <input type="number" value={configForm.physical_card_lead_time_days ?? 7}
                  onChange={e => setConfigForm({ ...configForm, physical_card_lead_time_days: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Chargeback Alert Threshold</label>
                <div className="relative">
                  <input type="number" step="0.0001" min="0" max="0.02"
                    value={configForm.chargeback_ratio_alert_threshold ?? 0.009}
                    onChange={e => setConfigForm({ ...configForm, chargeback_ratio_alert_threshold: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    = {((configForm.chargeback_ratio_alert_threshold ?? 0.009) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSaveConfig} disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              {configSaved && (
                <div className="flex items-center gap-1.5 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" /> Settings saved
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
