import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, CheckCircle, Clock, AlertCircle, Snowflake, Zap,
  Upload, Plus, ChevronRight, Eye, EyeOff, RefreshCw, Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface KycVerification {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'manual_review' | 'expired';
  document_type: string;
  submitted_at: string | null;
  reviewed_at: string | null;
}

interface IssuedCard {
  id: string;
  card_type: 'virtual' | 'physical';
  card_status: 'pending' | 'active' | 'frozen' | 'cancelled' | 'expired';
  last_four: string;
  expiry_month: number;
  expiry_year: number;
  card_program_tier: string;
  is_activated: boolean;
  physical_card_fulfillment_status: string;
}

interface CardAccount {
  id: string;
  available_balance: number;
  pending_balance: number;
  account_status: string;
}

interface CardTransaction {
  id: string;
  merchant_name: string;
  merchant_mcc: string;
  authorization_amount: number;
  transaction_status: string;
  is_gas_station: boolean;
  authorized_at: string;
}

interface CardLoad {
  id: string;
  source_type: string;
  usd_amount: number;
  status: string;
  created_at: string;
}

type CardView = 'no_application' | 'kyc_form' | 'kyc_pending' | 'card_active' | 'physical_ordered';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function CardProgramTab() {
  const { user } = useAuth();

  const [view, setView] = useState<CardView>('no_application');
  const [kyc, setKyc] = useState<KycVerification | null>(null);
  const [card, setCard] = useState<IssuedCard | null>(null);
  const [account, setAccount] = useState<CardAccount | null>(null);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [loads, setLoads] = useState<CardLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPan, setShowPan] = useState(false);
  const [panData, setPanData] = useState<{ pan: string; cvv: string; expiry_month: number; expiry_year: number } | null>(null);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showPhysicalModal, setShowPhysicalModal] = useState(false);
  const [kycForm, setKycForm] = useState({ document_type: 'government_id' });
  const [loadForm, setLoadForm] = useState({ source_type: 'crypto_wallet', source_asset: 'USDC', usd_amount: '' });
  const [physicalForm, setPhysicalForm] = useState({
    line1: '', line2: '', city: '', state: '', zip: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const authHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const fetchCardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const headers = await authHeaders();

    const kycRes = await fetch(`${SUPABASE_URL}/functions/v1/card-kyc-submit`, { headers });
    const kycData = await kycRes.json();
    const kycRecord: KycVerification | null = kycData.data ?? null;
    setKyc(kycRecord);

    if (!kycRecord || kycRecord.status === 'rejected' || kycRecord.status === 'expired') {
      setView('no_application');
      setLoading(false);
      return;
    }

    if (kycRecord.status === 'pending' || kycRecord.status === 'manual_review') {
      setView('kyc_pending');
      setLoading(false);
      return;
    }

    const { data: cardData } = await supabase
      .from('issued_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cardData) {
      setView('kyc_pending');
      setLoading(false);
      return;
    }

    setCard(cardData as IssuedCard);

    const { data: accountData } = await supabase
      .from('card_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_status', 'active')
      .maybeSingle();

    if (accountData) {
      setAccount(accountData as CardAccount);

      const { data: txData } = await supabase
        .from('card_transactions')
        .select('*')
        .eq('card_id', cardData.id)
        .neq('transaction_status', 'declined')
        .order('authorized_at', { ascending: false })
        .limit(10);

      setTransactions((txData ?? []) as CardTransaction[]);

      const loadRes = await fetch(`${SUPABASE_URL}/functions/v1/card-load-initiate`, { headers });
      const loadData = await loadRes.json();
      setLoads((loadData.data ?? []) as CardLoad[]);
    }

    if (cardData.physical_card_fulfillment_status !== 'not_requested') {
      setView('physical_ordered');
    } else {
      setView('card_active');
    }

    setLoading(false);
  }, [user, authHeaders]);

  useEffect(() => {
    fetchCardData();
  }, [fetchCardData]);

  const handleKycSubmit = async () => {
    setActionLoading(true);
    try {
      const headers = await authHeaders();
      await fetch(`${SUPABASE_URL}/functions/v1/card-kyc-submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify(kycForm),
      });
      await fetchCardData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFreeze = async () => {
    if (!card) return;
    setFreezeLoading(true);
    try {
      const headers = await authHeaders();
      const action = card.card_status === 'frozen' ? 'unfreeze_card' : 'freeze_card';
      await fetch(`${SUPABASE_URL}/functions/v1/card-processor-adapter?action=${action}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ card_token: card.id }),
      });

      await supabase
        .from('issued_cards')
        .update({ card_status: card.card_status === 'frozen' ? 'active' : 'frozen' })
        .eq('id', card.id);

      setCard(prev => prev ? { ...prev, card_status: prev.card_status === 'frozen' ? 'active' : 'frozen' } : prev);
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleShowPan = async () => {
    if (showPan) {
      setShowPan(false);
      setPanData(null);
      return;
    }
    if (!card) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/card-processor-adapter?action=get_pan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ card_token: card.id }),
      });
      const data = await res.json();
      if (data.success) {
        setPanData(data.data);
        setShowPan(true);
      }
    } catch {}
  };

  const handleLoadCard = async () => {
    if (!account || !loadForm.usd_amount) return;
    setActionLoading(true);
    try {
      const headers = await authHeaders();
      await fetch(`${SUPABASE_URL}/functions/v1/card-load-initiate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          account_id: account.id,
          source_type: loadForm.source_type,
          source_asset: loadForm.source_asset,
          usd_amount: parseFloat(loadForm.usd_amount),
        }),
      });
      setShowLoadModal(false);
      setLoadForm({ source_type: 'crypto_wallet', source_asset: 'USDC', usd_amount: '' });
      await fetchCardData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPhysical = async () => {
    if (!card) return;
    setActionLoading(true);
    try {
      await supabase
        .from('issued_cards')
        .update({
          physical_card_fulfillment_status: 'ordered',
          shipping_address_line1: physicalForm.line1,
          shipping_address_line2: physicalForm.line2,
          shipping_city: physicalForm.city,
          shipping_state: physicalForm.state,
          shipping_zip: physicalForm.zip,
        })
        .eq('id', card.id);
      setShowPhysicalModal(false);
      setView('physical_ordered');
      await fetchCardData();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-luxe-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading card program...</p>
        </div>
      </div>
    );
  }

  if (view === 'no_application' || view === 'kyc_form') {
    return (
      <div className="max-w-2xl mx-auto">
        {view === 'no_application' && (
          <>
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-luxe-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-10 h-10 text-luxe-gold" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3 uppercase">GHETTO Finance Debit Card</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Spend your balance anywhere Visa is accepted. Low fees, gas station network, instant virtual card.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                { icon: Zap, title: 'Instant Virtual Card', desc: 'Active immediately after KYC approval' },
                { icon: CreditCard, title: 'Max 1.5% Fees', desc: 'Capped merchant processing rate' },
                { icon: CheckCircle, title: 'Gas Station Network', desc: '0.9% rate at enrolled gas stations' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="luxe-glass rounded-2xl p-5 border border-white/10 text-center">
                  <Icon className="w-7 h-7 text-luxe-gold mx-auto mb-3" />
                  <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
                  <p className="text-gray-400 text-xs">{desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setView('kyc_form')}
              className="w-full py-4 bg-luxe-gold hover:bg-luxe-gold/80 text-black font-black rounded-2xl uppercase transition-colors flex items-center justify-center gap-2"
            >
              Apply Now <ChevronRight className="w-5 h-5" />
            </button>

            {kyc?.status === 'rejected' && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm font-medium">Your previous application was not approved. You may reapply.</p>
              </div>
            )}
          </>
        )}

        {view === 'kyc_form' && (
          <>
            <button
              onClick={() => setView('no_application')}
              className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-1"
            >
              ← Back
            </button>
            <h3 className="text-xl font-black text-white mb-6 uppercase">Identity Verification</h3>

            <div className="luxe-glass rounded-2xl p-6 border border-white/10 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <Lock className="w-5 h-5 text-luxe-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm mb-1">Your data is secure</p>
                  <p className="text-gray-400 text-xs">
                    We submit your identity verification request directly to our KYC provider.
                    No sensitive documents are stored in our database.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Document Type</label>
                <select
                  value={kycForm.document_type}
                  onChange={(e) => setKycForm({ ...kycForm, document_type: e.target.value })}
                  className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-luxe-gold text-white"
                >
                  <option value="government_id">Government ID</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                </select>
              </div>

              <div className="luxe-glass border border-dashed border-gray-600 rounded-2xl p-8 text-center">
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-1">Document upload handled securely by KYC provider</p>
                <p className="text-gray-500 text-xs">You will be redirected to complete verification</p>
              </div>

              <button
                onClick={handleKycSubmit}
                disabled={actionLoading}
                className="w-full py-4 bg-luxe-gold hover:bg-luxe-gold/80 disabled:luxe-glass text-black font-black rounded-2xl uppercase transition-colors"
              >
                {actionLoading ? 'Submitting...' : 'Submit Verification'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (view === 'kyc_pending') {
    const steps = [
      { label: 'Identity Submitted', done: true },
      { label: 'Under Review', done: kyc?.status === 'approved', active: kyc?.status === 'pending' || kyc?.status === 'manual_review' },
      { label: 'Approved', done: kyc?.status === 'approved' },
      { label: 'Card Issued', done: !!card },
      { label: 'Activate', done: card?.is_activated },
    ];

    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-yellow-400" />
        </div>
        <h3 className="text-xl font-black text-white mb-2 uppercase">Verification In Progress</h3>
        <p className="text-gray-400 text-sm mb-10">Typically completes within 1–2 business days.</p>

        <div className="flex items-start justify-between relative mb-10">
          <div className="absolute top-4 left-0 right-0 h-0.5 luxe-glass" />
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors ${
                step.done ? 'bg-luxe-gold' : step.active ? 'bg-yellow-500' : 'luxe-glass'
              }`}>
                {step.done
                  ? <CheckCircle className="w-4 h-4 text-black" />
                  : step.active
                    ? <Clock className="w-4 h-4 text-black" />
                    : <div className="w-2 h-2 rounded-full bg-gray-500" />
                }
              </div>
              <p className={`mt-2 text-xs text-center leading-tight ${
                step.done ? 'text-luxe-gold' : step.active ? 'text-yellow-400' : 'text-gray-500'
              }`}>{step.label}</p>
            </div>
          ))}
        </div>

        {kyc?.status === 'manual_review' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-400 text-sm">Your application is under manual review. We may contact you for additional information.</p>
          </div>
        )}
      </div>
    );
  }

  if ((view === 'card_active' || view === 'physical_ordered') && card && account) {
    const isFrozen = card.card_status === 'frozen';
    const expiryStr = `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Visual */}
          <div>
            <div className={`relative rounded-3xl p-6 h-48 overflow-hidden transition-all ${
              isFrozen
                ? 'bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600'
                : 'bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-luxe-gold/30'
            }`}>
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-luxe-gold transform translate-x-16 -translate-y-16" />
              </div>

              {isFrozen && (
                <div className="absolute inset-0 flex items-center justify-center luxe-glass-strong/60 rounded-3xl z-10">
                  <div className="text-center">
                    <Snowflake className="w-10 h-10 text-sky-400 mx-auto mb-1" />
                    <p className="text-sky-400 font-bold text-sm">Card Frozen</p>
                  </div>
                </div>
              )}

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-white font-black text-sm uppercase tracking-widest">GHETTO Finance</span>
                  <span className="text-gray-400 text-xs uppercase">{card.card_type}</span>
                </div>

                <div>
                  <p className="text-white font-mono text-lg tracking-widest mb-1">
                    {showPan && panData
                      ? panData.pan.replace(/(.{4})/g, '$1 ').trim()
                      : `•••• •••• •••• ${card.last_four}`
                    }
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-xs">EXPIRES</p>
                      <p className="text-gray-300 text-sm font-mono">
                        {showPan && panData ? `${String(panData.expiry_month).padStart(2,'0')}/${String(panData.expiry_year).slice(-2)}` : expiryStr}
                      </p>
                    </div>
                    {showPan && panData && (
                      <div className="text-right">
                        <p className="text-gray-500 text-xs">CVV</p>
                        <p className="text-gray-300 text-sm font-mono">{panData.cvv}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">TIER</p>
                      <p className="text-luxe-gold text-xs font-bold uppercase">{card.card_program_tier}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleShowPan}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 luxe-glass hover:luxe-glass border border-white/10 text-white text-sm rounded-xl transition-colors"
              >
                {showPan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPan ? 'Hide Details' : 'Show Details'}
              </button>
              <button
                onClick={handleToggleFreeze}
                disabled={freezeLoading}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 border text-sm rounded-xl transition-colors ${
                  isFrozen
                    ? 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-400'
                    : 'luxe-glass hover:luxe-glass border-white/10 text-white'
                }`}
              >
                <Snowflake className="w-4 h-4" />
                {isFrozen ? 'Unfreeze' : 'Freeze'}
              </button>
            </div>
          </div>

          {/* Balance & Actions */}
          <div className="space-y-4">
            <div className="luxe-glass rounded-2xl p-5 border border-white/10">
              <p className="text-gray-400 text-xs mb-1 uppercase tracking-wide">Available Balance</p>
              <p className="text-3xl font-black text-white">${Number(account.available_balance).toFixed(2)}</p>
              {account.pending_balance > 0 && (
                <p className="text-gray-500 text-xs mt-1">${Number(account.pending_balance).toFixed(2)} pending</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLoadModal(true)}
                className="flex items-center justify-center gap-2 py-3 bg-luxe-gold hover:bg-luxe-gold/80 text-black font-bold text-sm rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Load Card
              </button>
              {card.physical_card_fulfillment_status === 'not_requested' ? (
                <button
                  onClick={() => setShowPhysicalModal(true)}
                  className="flex items-center justify-center gap-2 py-3 luxe-glass hover:luxe-glass border border-white/10 text-white text-sm rounded-xl transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> Physical Card
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 luxe-glass border border-white/10 text-gray-400 text-sm rounded-xl">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="capitalize">{card.physical_card_fulfillment_status}</span>
                </div>
              )}
            </div>

            {view === 'physical_ordered' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Physical Card Ordered</span>
                </div>
                <p className="text-gray-400 text-xs">
                  Status: <span className="capitalize text-white">{card.physical_card_fulfillment_status}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h4 className="text-white font-black uppercase text-sm mb-3">Recent Transactions</h4>
          {transactions.length === 0 ? (
            <div className="luxe-glass rounded-2xl p-8 border border-white/10 text-center">
              <CreditCard className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between luxe-glass rounded-xl px-4 py-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                      tx.is_gas_station ? 'bg-green-500/20' : 'luxe-glass'
                    }`}>
                      {tx.is_gas_station ? '⛽' : '🛒'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{tx.merchant_name || 'Merchant'}</p>
                      <p className="text-gray-500 text-xs">{new Date(tx.authorized_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">-${Number(tx.authorization_amount).toFixed(2)}</p>
                    <p className={`text-xs ${tx.transaction_status === 'settled' ? 'text-green-400' : 'text-gray-400'}`}>
                      {tx.transaction_status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Loads */}
        {loads.length > 0 && (
          <div>
            <h4 className="text-white font-black uppercase text-sm mb-3">Recent Loads</h4>
            <div className="space-y-2">
              {loads.map((load) => (
                <div key={load.id} className="flex items-center justify-between luxe-glass rounded-xl px-4 py-3 border border-white/10">
                  <div>
                    <p className="text-white text-sm font-medium capitalize">{load.source_type.replace('_', ' ')}</p>
                    <p className="text-gray-500 text-xs">{new Date(load.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm font-medium">+${Number(load.usd_amount).toFixed(2)}</p>
                    <p className="text-gray-400 text-xs capitalize">{load.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Load Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-md p-6">
              <h3 className="text-lg font-black text-white mb-5 uppercase">Load Card</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Source</label>
                  <select
                    value={loadForm.source_type}
                    onChange={(e) => setLoadForm({ ...loadForm, source_type: e.target.value })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                  >
                    <option value="crypto_wallet">Crypto Wallet</option>
                    <option value="bank_transfer">Bank Transfer (ACH)</option>
                  </select>
                </div>

                {loadForm.source_type === 'crypto_wallet' && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Asset</label>
                    <select
                      value={loadForm.source_asset}
                      onChange={(e) => setLoadForm({ ...loadForm, source_asset: e.target.value })}
                      className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                    >
                      <option value="USDC">USDC</option>
                      <option value="ETH">ETH</option>
                      <option value="GHETTO">GHETTO</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Amount (USD)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={loadForm.usd_amount}
                    onChange={(e) => setLoadForm({ ...loadForm, usd_amount: e.target.value })}
                    className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                    placeholder="50.00"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowLoadModal(false)}
                    className="flex-1 py-3 luxe-glass hover:luxe-glass border border-white/10 text-white rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLoadCard}
                    disabled={actionLoading || !loadForm.usd_amount}
                    className="flex-1 py-3 bg-luxe-gold hover:bg-luxe-gold/80 disabled:luxe-glass text-black font-bold rounded-xl transition-colors"
                  >
                    {actionLoading ? 'Loading...' : 'Load Funds'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Physical Card Modal */}
        {showPhysicalModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="luxe-glass-strong rounded-2xl border border-white/10 w-full max-w-md p-6">
              <h3 className="text-lg font-black text-white mb-1 uppercase">Request Physical Card</h3>
              <p className="text-gray-400 text-sm mb-5">Estimated delivery: 7–10 business days</p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={physicalForm.line1}
                  onChange={(e) => setPhysicalForm({ ...physicalForm, line1: e.target.value })}
                  placeholder="Address Line 1"
                  className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                />
                <input
                  type="text"
                  value={physicalForm.line2}
                  onChange={(e) => setPhysicalForm({ ...physicalForm, line2: e.target.value })}
                  placeholder="Address Line 2 (optional)"
                  className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={physicalForm.city}
                    onChange={(e) => setPhysicalForm({ ...physicalForm, city: e.target.value })}
                    placeholder="City"
                    className="px-4 py-3 luxe-glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                  />
                  <input
                    type="text"
                    value={physicalForm.state}
                    onChange={(e) => setPhysicalForm({ ...physicalForm, state: e.target.value })}
                    placeholder="State"
                    className="px-4 py-3 luxe-glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                  />
                </div>
                <input
                  type="text"
                  value={physicalForm.zip}
                  onChange={(e) => setPhysicalForm({ ...physicalForm, zip: e.target.value })}
                  placeholder="ZIP Code"
                  className="w-full px-4 py-3 luxe-glass border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                />
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowPhysicalModal(false)}
                    className="flex-1 py-3 luxe-glass hover:luxe-glass border border-white/10 text-white rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestPhysical}
                    disabled={actionLoading || !physicalForm.line1 || !physicalForm.city}
                    className="flex-1 py-3 bg-luxe-gold hover:bg-luxe-gold/80 disabled:luxe-glass text-black font-bold rounded-xl transition-colors"
                  >
                    {actionLoading ? 'Ordering...' : 'Order Card'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16 text-gray-400">
      <AlertCircle className="w-10 h-10 mx-auto mb-3" />
      <p>Unable to load card program.</p>
    </div>
  );
}
