import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle } from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ReportListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ReportListingModal({ isOpen, onClose, product }: ReportListingModalProps) {
  const [reportReason, setReportReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const reportReasons = [
    'Illegal or prohibited items',
    'Fraudulent or fake products',
    'Inappropriate content',
    'Copyright infringement',
    'Spam or misleading information',
    'Violates terms of service',
    'Other (specify below)'
  ];

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;

    if (!reportReason) {
      setError('Please select a reason for reporting');
      return;
    }

    if (reportReason === 'Other (specify below)' && !customReason.trim()) {
      setError('Please specify the reason for reporting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Simulate report submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would send the report to moderators
      console.log('Report submitted:', {
        productId: product.id,
        productTitle: product.title,
        sellerId: product.seller.id,
        reporterId: user.id,
        reason: reportReason,
        customReason: reportReason === 'Other (specify below)' ? customReason : '',
        timestamp: new Date()
      });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit report:', error);
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setReportReason('');
    setCustomReason('');
    setError('');
    setSuccess(false);
  };

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

              {/* Report Form */}
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-gray-200 font-black mb-3 uppercase">Reason for Report</label>
                  <div className="space-y-2">
                    {reportReasons.map((reason) => (
                      <label key={reason} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="reportReason"
                          value={reason}
                          checked={reportReason === reason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-4 h-4 text-red-400 bg-gray-800 border-gray-600 focus:ring-red-400"
                        />
                        <span className="text-gray-300 text-sm font-medium">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {reportReason === 'Other (specify below)' && (
                  <div>
                    <label className="block text-gray-200 font-black mb-2 uppercase">Specify Reason</label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-gray-200 placeholder-gray-500 resize-none font-medium"
                      placeholder="Please describe the issue..."
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
                  <h4 className="text-gray-200 font-black mb-2 uppercase text-sm">What happens next:</h4>
                  <ul className="space-y-1 text-gray-400 text-xs font-bold uppercase">
                    <li>• OUR TEAM WILL REVIEW THE REPORT</li>
                    <li>• APPROPRIATE ACTION WILL BE TAKEN</li>
                    <li>• YOU MAY BE CONTACTED FOR MORE INFO</li>
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