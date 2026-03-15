import { X, Shield, AlertTriangle, Scale, Globe, FileText, Users, Lock, CreditCard, Ban, XCircle } from 'lucide-react';
import { LEGAL_CONSTANTS } from '../config/legalConstants';
import { PROHIBITED_CONTENT } from '../config/prohibitedContent';

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
          {/* Prohibited Items - Top Priority */}
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Ban className="h-8 w-8 text-red-400" />
              <h3 className="text-2xl font-black text-red-400 uppercase">Prohibited Items Policy</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-300 leading-relaxed font-bold">
                {PROHIBITED_CONTENT.POLICY_STATEMENTS.ZERO_TOLERANCE}
              </p>
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="text-white font-black mb-3 uppercase text-sm">Strictly Prohibited:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.values(PROHIBITED_CONTENT.CATEGORIES).slice(0, 6).map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{cat.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-xs mt-3">
                  View complete policy and examples in the Prohibited Items page
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
              <h3 className="text-xl font-black text-yellow-400 uppercase">Important Legal Notice</h3>
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
                  <li>Transaction disputes shall be submitted to platform moderators within {LEGAL_CONSTANTS.DISPUTE_RESOLUTION.ARBITRATION_TIMEFRAME_DAYS} days</li>
                  <li>Platform moderators shall serve as binding arbitrators for all disputes</li>
                  <li>Moderator decisions are final and binding on all parties</li>
                  <li>You agree to abide by all moderator decisions and judgments</li>
                  <li>You waive any right to court litigation for disputes covered by this arbitration clause</li>
                  <li>You waive any right to participate in class action lawsuits</li>
                  <li>Arbitration shall be conducted according to platform procedures</li>
                  <li>The {LEGAL_CONSTANTS.DISPUTE_RESOLUTION.ARBITRATION_TIMEFRAME_DAYS}-day resolution timeframe begins upon dispute filing</li>
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
                  Transaction disputes are resolved through our escrow system within {LEGAL_CONSTANTS.DISPUTE_RESOLUTION.ARBITRATION_TIMEFRAME_DAYS} days. Decisions are made based on evidence provided by both parties and platform terms.
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

          {/* Card Program */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="h-6 w-6 text-neon-blue" />
              <h3 className="text-2xl font-black text-white uppercase">Card Program</h3>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-3 uppercase">Cardholder Agreement</h4>
                <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                  <p>The GHETTO Finance Debit Card is issued by the BIN sponsor bank disclosed in your cardholder welcome materials. By activating and using your card you agree to these terms and the full cardholder agreement provided at account opening.</p>
                  <p><strong className="text-white">Account Type:</strong> The GHETTO Finance card is a debit card linked to a prepaid spend account funded by you. It is not a credit product. No credit is extended. You may only spend funds you have loaded onto your account.</p>
                  <p><strong className="text-white">Fee Schedule:</strong> Merchants pay a processing fee of no more than 1.5% of the transaction amount. There are no foreign transaction fees assessed by GHETTO Finance, however your BIN sponsor bank's fee schedule applies. See your cardholder agreement for a complete fee schedule.</p>
                  <p><strong className="text-white">Load Limits:</strong> Your account is subject to daily, per-transaction, and monthly load limits as disclosed in your account settings. GHETTO Finance may adjust limits based on account history and compliance requirements.</p>
                  <p><strong className="text-white">Card Freezing:</strong> You may freeze and unfreeze your card at any time through the app at no charge. Frozen cards will have all authorizations declined.</p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-3 uppercase">Dispute Rights — Regulation E</h4>
                <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                  <p>If you believe an electronic funds transfer has been made without your permission, contact us immediately at <strong className="text-neon-blue">cards@ghetto.finance</strong> or through the Disputes section in your account.</p>
                  <p><strong className="text-white">Error Resolution Timeframe:</strong> You must notify us of a suspected error within 60 days after we send you the first statement on which the error appeared. Regulation E provides specific rights depending on how quickly you notify us.</p>
                  <p><strong className="text-white">Investigation Period:</strong> We will investigate your dispute within 10 business days of receiving your report. For new accounts (open less than 30 days) or point-of-sale transactions, this may extend to 20 business days. We will provisionally credit your account during extended investigations.</p>
                  <p><strong className="text-white">Resolution:</strong> If we determine an error occurred, we will correct it within one business day of our determination. If we determine no error occurred, we will send you written notice of our findings.</p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-3 uppercase">Merchant Processing Agreement</h4>
                <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                  <p>Merchants enrolled in the GHETTO Finance card acceptance network agree to the following terms as a condition of acceptance.</p>
                  <p><strong className="text-white">Merchant Discount Rate:</strong> The merchant discount rate (MDR) is capped at 1.5% of each transaction. Gas station and fuel merchant partners operating under a promotional agreement may have a lower negotiated rate as specified in their enrollment agreement.</p>
                  <p><strong className="text-white">Settlement:</strong> Settled funds are disbursed according to the settlement schedule in your merchant enrollment agreement, typically 1–2 business days after batch close.</p>
                  <p><strong className="text-white">Chargebacks:</strong> Merchants are liable for chargebacks resulting from fraud, unauthorized transactions, or service failures. The GHETTO Finance Mediation team will review and adjudicate disputes in accordance with card network rules. Merchants may submit evidence through the merchant API disputes endpoint.</p>
                  <p><strong className="text-white">Chargeback Fees:</strong> A processing fee may apply to each chargeback as disclosed in your merchant enrollment agreement. Merchants with chargeback rates exceeding card network thresholds may be placed on a remediation plan or have their acceptance privileges suspended.</p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-3 uppercase">BIN Sponsor Bank Disclosure</h4>
                <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                  <p>The GHETTO Finance Debit Card is issued by our BIN sponsor bank pursuant to a license from Visa U.S.A. Inc. or Mastercard International Incorporated. GHETTO Finance is not a bank and does not hold a banking license. Your card account is held at the issuing bank and is subject to the terms and conditions of that bank's cardholder agreement.</p>
                  <p>The name of the issuing bank will be disclosed in your cardholder welcome package and printed on your physical card where required by applicable law.</p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h4 className="text-lg font-black text-white mb-3 uppercase">Card Transaction Data — Privacy Addendum</h4>
                <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                  <p>Card transaction data including merchant name, merchant category code (MCC), transaction amount, location, and timestamp is collected and stored to provide card services, detect fraud, resolve disputes, and comply with applicable law.</p>
                  <p><strong className="text-white">Data Shared with Third Parties:</strong> We share transaction data with our BIN sponsor bank, card processor, and fraud detection services as necessary to operate the card program. We do not sell your transaction data to advertisers or data brokers.</p>
                  <p><strong className="text-white">KYC Data:</strong> Identity verification data submitted for the card program is processed by our KYC provider and is subject to their privacy policy. GHETTO Finance stores only your verification status and a reference ID — not the underlying documents.</p>
                  <p><strong className="text-white">Retention:</strong> Transaction records are retained for a minimum of 5 years to comply with Bank Secrecy Act and anti-money laundering requirements.</p>
                  <p>For card-related privacy inquiries, contact: <strong className="text-neon-blue">cards@ghetto.finance</strong></p>
                </div>
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
                <p><strong>Legal Department:</strong> {LEGAL_CONSTANTS.LEGAL_EMAIL}</p>
                <p><strong>Privacy Officer:</strong> privacy@ghetto.finance</p>
                <p><strong>Compliance Team:</strong> compliance@ghetto.finance</p>
                <p><strong>Security Team:</strong> security@ghetto.finance</p>
              </div>
            </div>
          </section>

          {/* Last Updated */}
          <div className="text-center text-gray-500 text-sm border-t border-gray-700 pt-6">
            <p>Last Updated: {LEGAL_CONSTANTS.TERMS_OF_SERVICE.LAST_UPDATED}</p>
            <p>Version {LEGAL_CONSTANTS.TERMS_OF_SERVICE.VERSION} • Effective: {LEGAL_CONSTANTS.TERMS_OF_SERVICE.EFFECTIVE_DATE}</p>
            <p className="mt-2">These terms are subject to change. Users will be notified of material changes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}