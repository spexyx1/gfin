import React from 'react';
import { X, Shield, AlertTriangle, Scale, Globe, FileText, Users, Lock } from 'lucide-react';

interface LegalPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegalPage({ isOpen, onClose }: LegalPageProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Scale className="h-6 w-6 text-neon-blue" />
            <h2 className="text-2xl font-black text-white uppercase">Legal Terms & Compliance</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto h-[calc(90vh-120px)]">
          {/* Important Notice */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-xl font-black text-red-400 uppercase">Important Legal Notice</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              By using GHETTO FINANCE, you acknowledge that you are solely responsible for ensuring compliance with all applicable laws, regulations, and licensing requirements in your jurisdiction. This platform facilitates peer-to-peer transactions and does not provide legal, financial, or regulatory advice. All data is encrypted end-to-end and stored securely.
            </p>
          </div>

          {/* Terms of Service */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-6 w-6 text-neon-blue" />
              <h3 className="text-2xl font-black text-white uppercase">Terms of Service</h3>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
                <h3 className="text-xl font-black text-yellow-400 uppercase">Legal Agreement</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                By using GHETTO FINANCE, you enter into a legally binding agreement. You acknowledge sole responsibility for verifying and complying with all applicable laws and regulations. You agree to binding arbitration by platform moderators and waive the right to court litigation. You agree to indemnify and hold harmless Ghetto Finance, its owners, employees, and moderators from any and all losses.
              </p>
            </div>

            <div className="space-y-6 text-gray-300">
              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">1. Acceptance of Terms</h4>
                <p className="leading-relaxed">
                  By creating an account, accessing, or using any part of the Ghetto Finance platform, you expressly agree to be bound by these Terms of Service in their entirety, all applicable laws and regulations, and agree that you are solely responsible for compliance with any applicable local, state, national, and international laws and regulations.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">2. User Responsibilities and Compliance</h4>
                <p className="leading-relaxed mb-3 font-semibold text-yellow-400">YOU ARE SOLELY AND ENTIRELY RESPONSIBLE FOR:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Verifying and complying with all applicable laws, regulations, and licensing requirements in your jurisdiction</li>
                  <li>Ensuring all transactions comply with local, state, federal, and international regulations</li>
                  <li>Obtaining any necessary licenses, permits, or authorizations for your business activities</li>
                  <li>Compliance with all tax obligations related to your transactions on the platform</li>
                  <li>Compliance with anti-money laundering (AML) and know-your-customer (KYC) regulations</li>
                  <li>Compliance with sanctions, export controls, and trade restriction laws</li>
                  <li>Verifying the legality of all items listed, purchased, or sold on the platform</li>
                  <li>All cryptocurrency transaction risks including volatility, loss, and regulatory changes</li>
                  <li>Understanding and accepting all risks associated with peer-to-peer transactions</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">3. Platform Role and Limitations</h4>
                <p className="leading-relaxed mb-3">
                  Ghetto Finance is a technology platform that facilitates peer-to-peer transactions. WE DO NOT:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Provide legal, financial, tax, or regulatory advice</li>
                  <li>Guarantee the legality of any transaction in your jurisdiction</li>
                  <li>Act as a party to any transaction between users</li>
                  <li>Assume responsibility for user compliance with applicable laws</li>
                  <li>Warrant the accuracy of product descriptions or seller representations</li>
                  <li>Guarantee transaction completion or product delivery</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">4. Comprehensive Indemnification</h4>
                <p className="leading-relaxed mb-3 font-semibold text-red-400">
                  YOU AGREE TO INDEMNIFY, DEFEND, AND HOLD HARMLESS Ghetto Finance, its owners, operators, employees, contractors, moderators, and affiliates from and against ANY AND ALL claims, damages, obligations, losses, liabilities, costs, debts, and expenses (including attorney fees) arising from:
                </p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Your use of the platform and services</li>
                  <li>Your violation of these Terms of Service</li>
                  <li>Your violation of any law, regulation, or third-party rights</li>
                  <li>Any transaction conducted through the platform</li>
                  <li>Any dispute with another user</li>
                  <li>Your listing, sale, purchase, or exchange of products or services</li>
                  <li>Any regulatory investigation or enforcement action</li>
                  <li>Any cryptocurrency transaction losses</li>
                  <li>Any tax liabilities or penalties</li>
                  <li>Any intellectual property infringement</li>
                  <li>Any fraudulent or illegal activity</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">5. Limitation of Liability</h4>
                <p className="leading-relaxed mb-3 font-semibold text-red-400">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>The platform is provided "AS IS" and "AS AVAILABLE" without warranties of any kind</li>
                  <li>Ghetto Finance disclaims all warranties, express or implied, including merchantability and fitness for a particular purpose</li>
                  <li>Ghetto Finance shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Our total liability shall not exceed the fees paid by you in the past 12 months, if any</li>
                  <li>We are not liable for user actions, transaction disputes, regulatory violations, service interruptions, data loss, or security breaches</li>
                  <li>We are not responsible for losses due to cryptocurrency price volatility</li>
                  <li>We are not liable for third-party actions including payment processors, blockchain networks, or shipping carriers</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">6. Binding Arbitration and Dispute Resolution</h4>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-3">
                  <p className="leading-relaxed font-semibold text-blue-400">
                    ALL DISPUTES ARISING FROM OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM SHALL BE RESOLVED THROUGH BINDING ARBITRATION BY PLATFORM MODERATORS.
                  </p>
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Transaction disputes shall be submitted to platform moderators within 90 days</li>
                  <li>Platform moderators shall serve as binding arbitrators for all disputes</li>
                  <li>Moderator decisions are final and binding on all parties</li>
                  <li>You agree to abide by all moderator decisions and judgments</li>
                  <li>You waive any right to court litigation for disputes covered by this arbitration clause</li>
                  <li>You waive any right to participate in class action lawsuits</li>
                  <li>Arbitration shall be conducted according to platform procedures</li>
                  <li>The 90-day resolution timeframe begins upon dispute filing</li>
                  <li>Funds may be held in escrow during the dispute resolution process</li>
                  <li>Failure to comply with moderator decisions may result in account suspension or termination</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">7. Prohibited Activities</h4>
                <p className="leading-relaxed mb-3">Users shall not engage in:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Sale of illegal goods, services, or content</li>
                  <li>Money laundering, terrorist financing, or other financial crimes</li>
                  <li>Fraud, misrepresentation, deceptive practices, or scams</li>
                  <li>Violation of intellectual property rights</li>
                  <li>Activities violating sanctions or export control laws</li>
                  <li>Market manipulation or price fixing</li>
                  <li>Circumvention of platform security measures</li>
                  <li>Harassment, threats, or abusive behavior</li>
                  <li>Creation of multiple accounts to evade restrictions</li>
                  <li>Any activity that violates applicable laws or regulations</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">8. Escrow and Payment Terms</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>All transactions utilize the platform escrow system</li>
                  <li>Sellers must post 100% collateral in GHETTO tokens</li>
                  <li>Funds are released upon delivery confirmation or dispute resolution</li>
                  <li>The platform charges a 2.5% fee on all transactions</li>
                  <li>Cryptocurrency transactions carry inherent risks of loss</li>
                  <li>Users accept all risks associated with cryptocurrency volatility</li>
                  <li>Payment processing fees are non-refundable</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">9. Cryptocurrency Risks</h4>
                <p className="leading-relaxed mb-3 font-semibold text-yellow-400">YOU ACKNOWLEDGE AND ACCEPT:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Cryptocurrency values are highly volatile and you may lose some or all of your funds</li>
                  <li>Transactions are generally irreversible</li>
                  <li>Regulatory treatment of cryptocurrencies is evolving and uncertain</li>
                  <li>Technical issues may result in transaction failures or losses</li>
                  <li>We are not responsible for blockchain network issues or failures</li>
                  <li>You accept full responsibility for securing your wallet and private keys</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">10. Account Suspension and Termination</h4>
                <p className="leading-relaxed mb-3">We reserve the right to suspend or terminate accounts for:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Violation of these Terms of Service</li>
                  <li>Illegal activity or suspicious behavior</li>
                  <li>Failure to comply with moderator decisions</li>
                  <li>Failure to accept updated Terms of Service</li>
                  <li>Chargebacks or payment disputes</li>
                  <li>Multiple user complaints or poor ratings</li>
                  <li>Risk to platform integrity or other users</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">11. Modifications to Terms</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>We may update these Terms at any time without prior notice</li>
                  <li>Continued use after updates constitutes acceptance of new Terms</li>
                  <li>Users will be notified of material changes via email or platform notification</li>
                  <li>Failure to accept updated Terms will result in account restrictions or termination</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">12. Severability</h4>
                <p className="leading-relaxed">
                  If any provision of these Terms is found to be unenforceable or invalid, the remaining provisions shall remain in full force and effect. The unenforceable provision shall be modified to the minimum extent necessary to make it enforceable while preserving its intent.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">13. Entire Agreement</h4>
                <p className="leading-relaxed">
                  These Terms constitute the entire agreement between you and Ghetto Finance regarding use of the platform and supersede all prior agreements, understandings, and representations.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy Policy */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="h-6 w-6 text-neon-blue" />
              <h3 className="text-2xl font-black text-white uppercase">Privacy Policy</h3>
            </div>

            <div className="space-y-6 text-gray-300">
              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">Data Collection</h4>
                <p className="leading-relaxed">
                  We collect minimal personal information necessary for platform operation, including wallet addresses, transaction data, and communication records. All sensitive data is encrypted using AES-256 encryption. We do not sell personal data to third parties.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">GDPR Compliance (EU Users)</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Right to access your personal data</li>
                  <li>Right to rectification of inaccurate data</li>
                  <li>Right to erasure ("right to be forgotten")</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                  <li>Right to data encryption and security</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">Data Retention</h4>
                <p className="leading-relaxed">
                  Transaction records are retained for 7 years for compliance purposes in encrypted form. Personal data is securely deleted upon account closure unless required for legal obligations. All data is encrypted at rest and in transit.
                </p>
              </div>
            </div>
          </section>

          {/* Regulatory Compliance */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="h-6 w-6 text-neon-blue" />
              <h3 className="text-2xl font-black text-white uppercase">Regulatory Compliance</h3>
            </div>

            <div className="space-y-6 text-gray-300">
              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">United States Compliance</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Users must comply with FinCEN regulations for cryptocurrency transactions</li>
                  <li>Businesses must register appropriately with state and federal authorities</li>
                  <li>Sales tax obligations vary by state and transaction type</li>
                  <li>Import/export regulations apply to physical goods</li>
                  <li>Securities laws may apply to certain digital assets</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">European Union Compliance</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>MiCA (Markets in Crypto-Assets) regulation compliance required</li>
                  <li>VAT obligations for digital services and goods</li>
                  <li>Consumer protection laws apply to B2C transactions</li>
                  <li>Distance selling regulations for online purchases</li>
                  <li>Anti-money laundering (AML) requirements</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">Know Your Customer (KYC) & AML</h4>
                <p className="leading-relaxed">
                  Users engaging in high-value transactions may be subject to enhanced verification requirements. We reserve the right to request additional documentation to comply with applicable AML regulations.
                </p>
              </div>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-6 w-6 text-neon-blue" />
              <h3 className="text-2xl font-black text-white uppercase">Dispute Resolution</h3>
            </div>

            <div className="space-y-6 text-gray-300">
              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">Platform Disputes</h4>
                <p className="leading-relaxed">
                  Transaction disputes are resolved through our escrow system within 90 days. Decisions are made based on evidence provided by both parties and platform terms.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-black text-white mb-3 uppercase">Legal Disputes</h4>
                <p className="leading-relaxed">
                  Any legal disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. Users waive the right to class action lawsuits.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="h-6 w-6 text-neon-blue" />
              <h3 className="text-2xl font-black text-white uppercase">Legal Contact</h3>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <p className="text-gray-300 leading-relaxed mb-4">
                For legal inquiries, compliance questions, or to exercise your privacy rights, contact:
              </p>
              <div className="space-y-2 text-gray-300">
                <p><strong>Legal Department:</strong> legal@ghetto.finance</p>
                <p><strong>Privacy Officer:</strong> privacy@ghetto.finance</p>
                <p><strong>Compliance Team:</strong> compliance@ghetto.finance</p>
                <p><strong>Security Team:</strong> security@ghetto.finance</p>
              </div>
            </div>
          </section>

          {/* Last Updated */}
          <div className="text-center text-gray-500 text-sm border-t border-gray-700 pt-6">
            <p>Last Updated: January 2025</p>
            <p>These terms are subject to change. Users will be notified of material changes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}