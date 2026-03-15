import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle, Coins, Award, TrendingUp } from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useCommunityModeration } from '../hooks/useCommunityModeration';
import { PROHIBITED_CONTENT } from '../config/prohibitedContent';
import { logger } from '../utils/logger';

interface ReportListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ReportListingModal({ isOpen, onClose, product }: ReportListingModalProps) {
  const [prohibitedCategoryId, setProhibitedCategoryId] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [reason, setReason] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const {
    prohibitedCategories,
    reputation,
    submitReport,
    estimateReward
  } = useCommunityModeration();

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;

    if (!reason.trim()) {
      setError('Please provide a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const evidenceArray = evidenceUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      await submitReport({
        productId: product.id,
        prohibitedCategoryId: prohibitedCategoryId || undefined,
        severity,
        reason,
        evidenceUrls: evidenceArray,
        isAnonymous,
      });

      logger.debug('Report submitted', 'ReportListingModal', {
        productId: product.id,
        severity,
        prohibitedCategoryId,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2500);
    } catch (error) {
      logger.error('Failed to submit report', 'ReportListingModal', error);
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setProhibitedCategoryId('');
    setSeverity('medium');
    setReason('');
    setEvidenceUrls('');
    setIsAnonymous(false);
    setError('');
    setSuccess(false);
  };

  const rewardEstimate = estimateReward(severity);

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Flag className="h-5 w-5 text-red-400" />
            <h2 className="text-xl font-black text-gray-200 uppercase">REPORT LISTING</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-green-400 mb-2 uppercase">REPORT SUBMITTED!</h3>
              <p className="text-gray-400 font-bold uppercase">Our team will review this listing</p>
            </div>
          ) : (
            <>
              {/* Product Summary */}
              <div className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
                <div className="flex items-start space-x-4">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h3 className="text-gray-200 font-black uppercase line-clamp-2 mb-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-bold uppercase">
                        BY {product.seller.name}
                      </span>
                      <span className="text-lg font-black text-red-400 uppercase">
                        {product.price} {product.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 font-black uppercase text-sm">IMPORTANT</span>
                </div>
                <p className="text-gray-400 text-sm font-bold uppercase">
                  FALSE REPORTS MAY RESULT IN ACCOUNT SUSPENSION
                </p>
              </div>

              {/* Reputation Display */}
              {reputation && (
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-black uppercase text-sm">
                        {reputation.reputation_tier}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm font-bold">
                      {reputation.accuracy_rate.toFixed(1)}% Accuracy
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{reputation.reports_validated} Validated</span>
                    <span className="flex items-center space-x-1">
                      <Coins className="h-3 w-3" />
                      <span>{reputation.total_rewards_earned} GHETTO Earned</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Report Form */}
              <form onSubmit={handleSubmitReport} className="space-y-4">
                {/* Severity Selection */}
                <div>
                  <label className="block text-gray-200 font-black mb-3 uppercase text-sm">Severity Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(PROHIBITED_CONTENT.SEVERITY_LEVELS).map(([key, { label, color }]) => {
                      const severityKey = key.toLowerCase() as 'low' | 'medium' | 'high' | 'critical';
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSeverity(severityKey)}
                          className={`p-3 rounded-xl font-black text-sm uppercase transition-all ${
                            severity === severityKey
                              ? `bg-${color}-500/20 border-2 border-${color}-500 text-${color}-400`
                              : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prohibited Category Selection */}
                {prohibitedCategories.length > 0 && (
                  <div>
                    <label className="block text-gray-200 font-black mb-3 uppercase text-sm">
                      Prohibited Category (Optional)
                    </label>
                    <select
                      value={prohibitedCategoryId}
                      onChange={(e) => setProhibitedCategoryId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-200 font-medium"
                    >
                      <option value="">Select if applicable...</option>
                      {prohibitedCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Reason Text Area */}
                <div>
                  <label className="block text-gray-200 font-black mb-2 uppercase text-sm">
                    Description *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-gray-200 placeholder-gray-500 resize-none font-medium"
                    placeholder="Describe why this listing should be removed..."
                    required
                  />
                </div>

                {/* Evidence URLs */}
                <div>
                  <label className="block text-gray-200 font-black mb-2 uppercase text-sm">
                    Evidence URLs (Optional)
                  </label>
                  <textarea
                    value={evidenceUrls}
                    onChange={(e) => setEvidenceUrls(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-gray-200 placeholder-gray-500 resize-none font-medium text-sm"
                    placeholder="One URL per line (screenshots, references, etc.)"
                  />
                </div>

                {/* Anonymous Checkbox */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-red-400 bg-gray-800 border-gray-600 rounded focus:ring-red-400"
                  />
                  <span className="text-gray-300 text-sm font-medium">Submit anonymously</span>
                </label>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                  </div>
                )}

                {/* Reward Estimate */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-green-500/10 border border-yellow-500/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-yellow-400" />
                      <h4 className="text-yellow-400 font-black uppercase text-sm">Estimated Reward</h4>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Coins className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-400 font-black text-lg">
                        {rewardEstimate.min}-{rewardEstimate.max}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs font-bold">
                    If validated, you will earn GHETTO tokens. Higher accuracy = higher rewards!
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
                  <h4 className="text-gray-200 font-black mb-2 uppercase text-sm">What happens next:</h4>
                  <ul className="space-y-1 text-gray-400 text-xs font-bold uppercase">
                    <li>• MODERATORS WILL REVIEW WITHIN 24-48 HOURS</li>
                    <li>• IF VALIDATED, REWARDS WILL BE CREDITED</li>
                    <li>• LISTING WILL BE REMOVED IF VIOLATION CONFIRMED</li>
                    <li>• YOUR REPUTATION SCORE WILL BE UPDATED</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !user}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-black rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 uppercase"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Flag className="h-4 w-4" />
                      <span>{user ? 'SUBMIT REPORT' : 'LOGIN TO REPORT'}</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}