import React, { useState } from 'react';
import { Shield, CheckSquare, Square, AlertTriangle, FileText, Scale } from 'lucide-react';
import { LEGAL_CONSTANTS } from '../config/legalConstants';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  termsVersion?: string;
  effectiveDate?: string;
}

export function TermsAcceptanceModal({
  isOpen,
  onAccept,
  onDecline,
  termsVersion = LEGAL_CONSTANTS.TERMS_OF_SERVICE.VERSION,
  effectiveDate = LEGAL_CONSTANTS.TERMS_OF_SERVICE.EFFECTIVE_DATE
}: TermsAcceptanceModalProps) {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const handleCheckboxClick = () => {
    setAccepted(!accepted);
    if (!accepted) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="luxe-glass-strong rounded-3xl border-2 border-red-500/50 w-full max-w-3xl overflow-hidden shadow-2xl shadow-red-500/20">
        <div className="bg-gradient-to-r from-red-500/20 to-yellow-500/20 p-6 border-b border-red-500/30">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Scale className="h-8 w-8 text-red-400" />
            <h2 className="text-3xl font-black text-white uppercase text-center">Legal Agreement Required</h2>
          </div>
          <p className="text-center text-gray-300 text-sm mt-2">
            Version {termsVersion} | Effective Date: {effectiveDate}
          </p>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-black text-red-400 uppercase mb-2">Legally Binding Agreement</h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    By accepting these terms, you enter into a legally binding agreement with Ghetto Finance.
                    You acknowledge that you have the legal authority to accept these terms and will be bound by all provisions.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="luxe-glass opacity-50 border border-white/10 rounded-xl p-5">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-black uppercase mb-2 text-sm">Your Sole Responsibility</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      You are solely responsible for verifying and complying with all applicable laws, regulations,
                      licensing requirements, and tax obligations in your jurisdiction. Ghetto Finance does not provide
                      legal, financial, or regulatory advice.
                    </p>
                  </div>
                </div>
              </div>

              <div className="luxe-glass opacity-50 border border-white/10 rounded-xl p-5">
                <div className="flex items-start space-x-3">
                  <Scale className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-black uppercase mb-2 text-sm">Binding Arbitration</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      All disputes will be resolved through binding arbitration by platform moderators within {LEGAL_CONSTANTS.DISPUTE_RESOLUTION.ARBITRATION_TIMEFRAME_DAYS} days.
                      You waive the right to court litigation and class action lawsuits. Moderator decisions are final
                      and binding on all parties.
                    </p>
                  </div>
                </div>
              </div>

              <div className="luxe-glass opacity-50 border border-white/10 rounded-xl p-5">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-black uppercase mb-2 text-sm">Complete Indemnification</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      You agree to indemnify, defend, and hold harmless Ghetto Finance, its owners, employees, and
                      moderators from any and all claims, damages, losses, liabilities, costs, and expenses (including
                      attorney fees) arising from your use of the platform, violations of laws, or any disputes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="luxe-glass opacity-50 border border-white/10 rounded-xl p-5">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-black uppercase mb-2 text-sm">Cryptocurrency Risks</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      You acknowledge that cryptocurrency transactions are highly volatile, generally irreversible,
                      and subject to uncertain regulatory treatment. You may lose some or all of your funds.
                      Ghetto Finance is not liable for any losses.
                    </p>
                  </div>
                </div>
              </div>

              <div className="luxe-glass opacity-50 border border-white/10 rounded-xl p-5">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-black uppercase mb-2 text-sm">Limitation of Liability</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      The platform is provided "AS IS" without warranties. Ghetto Finance's liability is limited to
                      the maximum extent permitted by law. We are not liable for user actions, disputes, regulatory
                      violations, losses, or any consequential damages.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mt-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-yellow-400 text-sm leading-relaxed font-medium">
                    These terms contain important provisions including binding arbitration, class action waiver,
                    limitation of liability, and indemnification clauses. By accepting, you acknowledge you have
                    read and understood all terms. Full terms are available in the Legal & Privacy section.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 pt-6 border-t border-white/10 luxe-glass opacity-30">
          <div className="mb-6">
            <button
              onClick={handleCheckboxClick}
              className="flex items-center space-x-3 w-full p-4 luxe-glass hover:bg-gray-750 border-2 border-white/10 hover:border-luxe-gold rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex-shrink-0">
                {accepted ? (
                  <CheckSquare className="h-6 w-6 text-luxe-gold" />
                ) : (
                  <Square className="h-6 w-6 text-gray-500 group-hover:text-gray-400" />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="text-white font-semibold text-sm mb-1">
                  I accept the Terms of Service (Version {termsVersion})
                </p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  I acknowledge that I am entering into a legally binding agreement and accept all terms,
                  including binding arbitration, indemnification, and limitation of liability provisions.
                </p>
              </div>
            </button>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onDecline}
              className="flex-1 py-4 luxe-glass hover:bg-gray-750 text-gray-300 hover:text-white border border-white/10 rounded-xl transition-all font-bold uppercase text-sm"
            >
              Decline & Logout
            </button>
            <button
              onClick={onAccept}
              disabled={!accepted}
              className={`flex-1 py-4 rounded-xl transition-all font-black uppercase text-sm ${
                accepted
                  ? 'bg-luxe-gold hover:shadow-neon-blue text-black cursor-pointer'
                  : 'luxe-glass text-gray-500 cursor-not-allowed'
              }`}
            >
              {accepted ? 'Accept & Continue' : 'Check Box to Accept'}
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-4">
            Declining these terms will log you out and prevent platform access
          </p>
        </div>
      </div>
    </div>
  );
}
