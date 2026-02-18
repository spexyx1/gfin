import React, { useState, useEffect } from 'react';
import { useMediator, DisputeCase } from '../hooks/useMediator';
import { Scale, FileText, MessageSquare, Award, AlertCircle, UserPlus, TrendingUp, TrendingDown, Eye, EyeOff, CreditCard, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CardDisputeRow {
  id: string;
  user_id: string;
  dispute_reason: string;
  cardholder_description: string;
  status: string;
  resolution_amount: number | null;
  resolution_notes: string;
  opened_at: string;
  resolved_at: string | null;
  card_id: string;
  transaction_id: string | null;
  card_transactions: {
    merchant_name: string;
    authorization_amount: number;
    merchant_mcc: string;
    authorized_at: string;
    authorization_code: string;
  } | null;
  profiles?: { username?: string; email?: string } | null;
}

export function MediatorDashboard() {
  const {
    cases,
    appeals,
    loading,
    error,
    isMediator,
    createCase,
    updateCase,
    resolveCase,
    getCaseEvidence,
    addEvidence,
    getCaseComments,
    addComment,
    assignModerator,
    rewardUser,
    fineUser,
    reviewAppeal,
    refresh
  } = useMediator();

  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'cases' | 'appeals' | 'card_disputes'>('cases');
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [cardDisputes, setCardDisputes] = useState<CardDisputeRow[]>([]);
  const [cardDisputeFilter, setCardDisputeFilter] = useState<string>('all');
  const [cardDisputeLoading, setCardDisputeLoading] = useState(false);
  const [expandedDisputeId, setExpandedDisputeId] = useState<string | null>(null);
  const [chargebackRatio, setChargebackRatio] = useState<number>(0);
  const [resolutionForm, setResolutionForm] = useState<{ id: string; notes: string; amount: string } | null>(null);

  useEffect(() => {
    isMediator().then(setHasAccess);
  }, []);

  const fetchCardDisputes = async () => {
    setCardDisputeLoading(true);
    const { data } = await supabase
      .from('card_disputes')
      .select('*, card_transactions(merchant_name, authorization_amount, merchant_mcc, authorized_at, authorization_code)')
      .order('opened_at', { ascending: false });
    setCardDisputes((data ?? []) as CardDisputeRow[]);

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { count: totalTx } = await supabase
      .from('card_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('transaction_status', 'settled')
      .gte('settled_at', sixtyDaysAgo);
    const { count: disputedTx } = await supabase
      .from('card_disputes')
      .select('*', { count: 'exact', head: true })
      .gte('opened_at', sixtyDaysAgo);
    if (totalTx && totalTx > 0) {
      setChargebackRatio((disputedTx ?? 0) / totalTx);
    }
    setCardDisputeLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'card_disputes') fetchCardDisputes();
  }, [activeTab]);

  const handleUpdateCardDispute = async (id: string, status: string, notes: string, amount?: string) => {
    const updates: Record<string, unknown> = {
      status,
      resolution_notes: notes,
      updated_at: new Date().toISOString(),
    };
    if (status.startsWith('resolved')) {
      updates.resolved_at = new Date().toISOString();
      if (amount) updates.resolution_amount = parseFloat(amount);
    }
    await supabase.from('card_disputes').update(updates).eq('id', id);
    setResolutionForm(null);
    fetchCardDisputes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Mediator Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <Scale className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have Mediator permissions.</p>
        </div>
      </div>
    );
  }

  const filteredCases = filterStatus === 'all'
    ? cases
    : cases.filter(c => c.status === filterStatus);

  const CaseCard = ({ disputeCase }: { disputeCase: DisputeCase }) => {
    const statusColors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      awaiting_evidence: 'bg-orange-100 text-orange-800',
      under_review: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      appealed: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800'
    };

    return (
      <div
        className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setSelectedCase(disputeCase)}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">{disputeCase.case_number}</h3>
            </div>
            <h4 className="text-lg font-medium text-gray-800">{disputeCase.title}</h4>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[disputeCase.status]}`}>
            {disputeCase.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{disputeCase.description}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              {disputeCase.visibility === 'hidden' ? (
                <EyeOff className="h-4 w-4 inline mr-1" />
              ) : (
                <Eye className="h-4 w-4 inline mr-1" />
              )}
              {disputeCase.visibility}
            </span>
            {disputeCase.escrow_amount && (
              <span className="text-green-600 font-semibold">
                ${disputeCase.escrow_amount.toLocaleString()}
              </span>
            )}
          </div>
          <span className="text-gray-400">
            {new Date(disputeCase.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  const CaseDetailModal = () => {
    if (!selectedCase) return null;

    const [comments, setComments] = useState<any[]>([]);
    const [evidence, setEvidence] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [resolution, setResolution] = useState('');
    const [awardedParty, setAwardedParty] = useState<'plaintiff' | 'defendant' | null>(null);

    useEffect(() => {
      if (selectedCase) {
        getCaseComments(selectedCase.id).then(setComments);
        getCaseEvidence(selectedCase.id).then(setEvidence);
      }
    }, [selectedCase]);

    const handleAddComment = async () => {
      if (!newComment.trim()) return;
      await addComment(selectedCase.id, newComment, isInternal);
      setNewComment('');
      const updatedComments = await getCaseComments(selectedCase.id);
      setComments(updatedComments);
    };

    const handleResolveCase = async () => {
      if (!resolution.trim()) {
        alert('Please provide a resolution');
        return;
      }
      const awardedTo = awardedParty === 'plaintiff' ? selectedCase.plaintiff_id :
                        awardedParty === 'defendant' ? selectedCase.defendant_id :
                        undefined;

      await resolveCase(selectedCase.id, resolution, awardedTo);
      setSelectedCase(null);
      refresh();
      alert('Case resolved successfully');
    };

    const handleChangeVisibility = async (visibility: string) => {
      await updateCase(selectedCase.id, { visibility: visibility as any });
      setSelectedCase({ ...selectedCase, visibility: visibility as any });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedCase.case_number}
                </h2>
                <h3 className="text-lg text-gray-700">{selectedCase.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Case Information</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-600">Status</dt>
                    <dd className="font-medium text-gray-900">{selectedCase.status}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Visibility</dt>
                    <dd className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{selectedCase.visibility}</span>
                      <select
                        value={selectedCase.visibility}
                        onChange={(e) => handleChangeVisibility(e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="public">Public</option>
                        <option value="parties_only">Parties Only</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </dd>
                  </div>
                  {selectedCase.escrow_amount && (
                    <div>
                      <dt className="text-gray-600">Escrow Amount</dt>
                      <dd className="font-medium text-green-600">
                        ${selectedCase.escrow_amount.toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-700">{selectedCase.description}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Evidence ({evidence.length})</h4>
              <div className="space-y-2">
                {evidence.map((e) => (
                  <div key={e.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-gray-500 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{e.evidence_type}</p>
                        {e.description && (
                          <p className="text-sm text-gray-600">{e.description}</p>
                        )}
                        {e.file_url && (
                          <a
                            href={e.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View File
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(e.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {evidence.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No evidence submitted</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Comments ({comments.length})</h4>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-lg ${
                      c.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-500 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{c.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                          {c.is_internal && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                              Internal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    Internal comment (not visible to parties)
                  </label>
                  <button
                    onClick={handleAddComment}
                    className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>

            {selectedCase.status !== 'resolved' && selectedCase.status !== 'closed' && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Resolve Case</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resolution
                    </label>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Enter resolution details..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Award Escrow To
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setAwardedParty('plaintiff')}
                        className={`flex-1 px-4 py-2 rounded-lg border ${
                          awardedParty === 'plaintiff'
                            ? 'bg-green-100 border-green-500 text-green-800'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Plaintiff
                      </button>
                      <button
                        onClick={() => setAwardedParty('defendant')}
                        className={`flex-1 px-4 py-2 rounded-lg border ${
                          awardedParty === 'defendant'
                            ? 'bg-green-100 border-green-500 text-green-800'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Defendant
                      </button>
                      <button
                        onClick={() => setAwardedParty(null)}
                        className={`flex-1 px-4 py-2 rounded-lg border ${
                          awardedParty === null
                            ? 'bg-green-100 border-green-500 text-green-800'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Split/None
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleResolveCase}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium"
                  >
                    Resolve Case
                  </button>
                </div>
              </div>
            )}

            {selectedCase.resolution && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-2">Resolution</h4>
                <p className="text-sm text-gray-700 bg-green-50 p-4 rounded-lg">
                  {selectedCase.resolution}
                </p>
                {selectedCase.resolved_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Resolved on {new Date(selectedCase.resolved_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Scale className="h-8 w-8 text-blue-600" />
            Mediator Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Resolve disputes and manage case files</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'cases'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cases ({cases.length})
          </button>
          <button
            onClick={() => setActiveTab('appeals')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'appeals'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Appeals ({appeals.length})
          </button>
          <button
            onClick={() => setActiveTab('card_disputes')}
            className={`px-4 py-2 font-medium flex items-center gap-2 ${
              activeTab === 'card_disputes'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Card Disputes {cardDisputes.length > 0 && `(${cardDisputes.length})`}
          </button>
        </div>

        {activeTab === 'cases' && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Cases</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="awaiting_evidence">Awaiting Evidence</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="appealed">Appealed</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredCases.map((disputeCase) => (
                <CaseCard key={disputeCase.id} disputeCase={disputeCase} />
              ))}
              {filteredCases.length === 0 && (
                <div className="col-span-2 bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
                  No cases found
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'appeals' && (
          <div className="grid gap-6">
            {appeals.map((appeal) => (
              <div key={appeal.id} className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Appeal for {appeal.case_id}
                    </h3>
                    <p className="text-sm text-gray-600">{appeal.reason}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    {appeal.status}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      const decision = prompt('Enter decision for approval:');
                      if (decision) {
                        await reviewAppeal(appeal.id, decision, true);
                        alert('Appeal approved');
                      }
                    }}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      const decision = prompt('Enter reason for denial:');
                      if (decision) {
                        await reviewAppeal(appeal.id, decision, false);
                        alert('Appeal denied');
                      }
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
            {appeals.length === 0 && (
              <div className="bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
                No pending appeals
              </div>
            )}
          </div>
        )}
      </div>

      {selectedCase && <CaseDetailModal />}

      {activeTab === 'card_disputes' && (
        <div>
          {/* Chargeback ratio monitor */}
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            chargebackRatio >= 0.009
              ? 'bg-red-50 border border-red-200'
              : 'bg-green-50 border border-green-200'
          }`}>
            <CreditCard className={`h-5 w-5 ${chargebackRatio >= 0.009 ? 'text-red-500' : 'text-green-500'}`} />
            <div>
              <span className="font-semibold text-gray-800 text-sm">60-Day Chargeback Ratio: </span>
              <span className={`font-bold text-sm ${chargebackRatio >= 0.009 ? 'text-red-600' : 'text-green-600'}`}>
                {(chargebackRatio * 100).toFixed(3)}%
              </span>
              {chargebackRatio >= 0.009 && (
                <span className="ml-2 text-red-600 text-xs font-medium">Approaching Visa warning threshold (1.0%)</span>
              )}
            </div>
          </div>

          {/* Status filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            {['all', 'open', 'investigating', 'evidence_requested', 'resolved_approved', 'resolved_denied', 'escalated'].map(s => (
              <button
                key={s}
                onClick={() => setCardDisputeFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  cardDisputeFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>

          {cardDisputeLoading ? (
            <div className="text-center py-12 text-gray-400">Loading card disputes...</div>
          ) : (
            <div className="space-y-3">
              {cardDisputes
                .filter(d => cardDisputeFilter === 'all' || d.status === cardDisputeFilter)
                .map((dispute) => {
                  const isExpanded = expandedDisputeId === dispute.id;
                  const tx = dispute.card_transactions;
                  const statusColors: Record<string, string> = {
                    open: 'bg-blue-100 text-blue-800',
                    investigating: 'bg-yellow-100 text-yellow-800',
                    evidence_requested: 'bg-orange-100 text-orange-800',
                    resolved_approved: 'bg-green-100 text-green-800',
                    resolved_denied: 'bg-gray-100 text-gray-800',
                    escalated: 'bg-red-100 text-red-800',
                  };
                  const daysOpen = Math.floor((Date.now() - new Date(dispute.opened_at).getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={dispute.id} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedDisputeId(isExpanded ? null : dispute.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 mr-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[dispute.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {dispute.status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-400">{daysOpen} day{daysOpen !== 1 ? 's' : ''} open</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-medium text-gray-900 text-sm">{tx?.merchant_name || 'Unknown Merchant'}</p>
                              {tx && (
                                <span className="text-green-700 font-semibold text-sm">${Number(tx.authorization_amount).toFixed(2)}</span>
                              )}
                            </div>
                            <p className="text-gray-500 text-xs mt-0.5">
                              Reason: {dispute.dispute_reason.replace(/_/g, ' ')}
                              {tx && ` · ${new Date(tx.authorized_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                          {/* Transaction details */}
                          {tx && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Transaction Details</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-gray-500">Merchant:</span> <span className="text-gray-800">{tx.merchant_name}</span></div>
                                <div><span className="text-gray-500">Amount:</span> <span className="text-gray-800">${Number(tx.authorization_amount).toFixed(2)}</span></div>
                                <div><span className="text-gray-500">MCC:</span> <span className="text-gray-800">{tx.merchant_mcc}</span></div>
                                <div><span className="text-gray-500">Auth Code:</span> <span className="text-gray-800 font-mono">{tx.authorization_code || '—'}</span></div>
                              </div>
                            </div>
                          )}

                          {/* Cardholder description */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Cardholder Statement</h4>
                            <p className="text-sm text-gray-700 bg-white rounded p-3 border border-gray-200">
                              {dispute.cardholder_description || 'No description provided.'}
                            </p>
                          </div>

                          {/* Resolution notes (if resolved) */}
                          {dispute.resolution_notes && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Resolution Notes</h4>
                              <p className="text-sm text-gray-700 bg-white rounded p-3 border border-gray-200">{dispute.resolution_notes}</p>
                            </div>
                          )}

                          {/* Action buttons */}
                          {!dispute.status.startsWith('resolved') && dispute.status !== 'escalated' && (
                            resolutionForm?.id === dispute.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={resolutionForm.notes}
                                  onChange={(e) => setResolutionForm({ ...resolutionForm, notes: e.target.value })}
                                  placeholder="Resolution notes..."
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="number"
                                  value={resolutionForm.amount}
                                  onChange={(e) => setResolutionForm({ ...resolutionForm, amount: e.target.value })}
                                  placeholder="Refund amount (leave blank for full amount)"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateCardDispute(dispute.id, 'resolved_approved', resolutionForm.notes, resolutionForm.amount || String(tx?.authorization_amount ?? 0))}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" /> Approve Refund
                                  </button>
                                  <button
                                    onClick={() => handleUpdateCardDispute(dispute.id, 'resolved_denied', resolutionForm.notes)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                  >
                                    <XCircle className="h-4 w-4" /> Deny Claim
                                  </button>
                                  <button
                                    onClick={() => handleUpdateCardDispute(dispute.id, 'escalated', resolutionForm.notes)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
                                  >
                                    Escalate to Bank
                                  </button>
                                  <button
                                    onClick={() => setResolutionForm(null)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {dispute.status === 'open' && (
                                  <button
                                    onClick={() => handleUpdateCardDispute(dispute.id, 'investigating', '')}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600"
                                  >
                                    <Clock className="h-3.5 w-3.5" /> Begin Investigation
                                  </button>
                                )}
                                {dispute.status !== 'evidence_requested' && (
                                  <button
                                    onClick={() => handleUpdateCardDispute(dispute.id, 'evidence_requested', '')}
                                    className="px-3 py-2 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600"
                                  >
                                    Request Evidence
                                  </button>
                                )}
                                <button
                                  onClick={() => setResolutionForm({ id: dispute.id, notes: '', amount: '' })}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" /> Resolve
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              {cardDisputes.filter(d => cardDisputeFilter === 'all' || d.status === cardDisputeFilter).length === 0 && (
                <div className="bg-white shadow-sm rounded-lg p-12 text-center text-gray-400">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  No card disputes found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
