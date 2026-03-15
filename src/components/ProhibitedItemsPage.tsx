import { X, Shield, AlertTriangle, Ban, CheckCircle, XCircle } from 'lucide-react';
import { PROHIBITED_CONTENT } from '../config/prohibitedContent';
import { useCommunityModeration } from '../hooks/useCommunityModeration';

interface ProhibitedItemsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProhibitedItemsPage({ isOpen, onClose }: ProhibitedItemsPageProps) {
  const { prohibitedCategories } = useCommunityModeration();

  if (!isOpen) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'severe':
        return 'orange';
      case 'moderate':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center space-x-3">
            <Ban className="h-6 w-6 text-red-400" />
            <h2 className="text-2xl font-black text-white uppercase">Prohibited Items Policy</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          {/* Main Policy Statement */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-6 w-6 text-red-400" />
              <h3 className="text-xl font-black text-red-400 uppercase">Legal Marketplace Only</h3>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              {PROHIBITED_CONTENT.POLICY_STATEMENTS.MAIN}
            </p>
            <p className="text-red-400 font-black leading-relaxed">
              {PROHIBITED_CONTENT.POLICY_STATEMENTS.ZERO_TOLERANCE}
            </p>
          </div>

          {/* Community Role */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <h3 className="text-xl font-black text-green-400 uppercase">Community Moderation</h3>
            </div>
            <p className="text-gray-300 leading-relaxed mb-3">
              {PROHIBITED_CONTENT.POLICY_STATEMENTS.COMMUNITY_ROLE}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-black text-green-400 mb-1">5-1000</div>
                <div className="text-sm text-gray-400 font-bold uppercase">GHETTO Rewards</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-black text-blue-400 mb-1">24-48h</div>
                <div className="text-sm text-gray-400 font-bold uppercase">Review Time</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-2xl font-black text-yellow-400 mb-1">+10%</div>
                <div className="text-sm text-gray-400 font-bold uppercase">Accuracy Bonus</div>
              </div>
            </div>
          </div>

          {/* Prohibited Categories */}
          <section className="mb-8">
            <h3 className="text-2xl font-black text-white uppercase mb-6">Strictly Prohibited Categories</h3>
            <div className="space-y-4">
              {prohibitedCategories.map((category) => {
                const color = getSeverityColor(category.severity);
                return (
                  <div
                    key={category.id}
                    className={`bg-${color}-500/10 border border-${color}-500/20 rounded-2xl p-6`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <XCircle className={`h-6 w-6 text-${color}-400`} />
                          <h4 className={`text-xl font-black text-${color}-400 uppercase`}>
                            {category.name}
                          </h4>
                        </div>
                        <p className="text-gray-300 leading-relaxed mb-3">
                          {category.description}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 bg-${color}-500/20 text-${color}-400 rounded-lg text-xs font-black uppercase ml-4`}
                      >
                        {category.severity}
                      </span>
                    </div>

                    {category.examples && category.examples.length > 0 && (
                      <div className="mb-3">
                        <p className="text-gray-400 font-black text-sm uppercase mb-2">Examples Include:</p>
                        <div className="flex flex-wrap gap-2">
                          {category.examples.map((example, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium"
                            >
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {category.legal_reference && (
                      <div className="text-xs text-gray-500 font-bold">
                        Legal Reference: {category.legal_reference}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Allowed vs Not Allowed Examples */}
          <section className="mb-8">
            <h3 className="text-2xl font-black text-white uppercase mb-6">Examples: What's Allowed & What's Not</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allowed */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <h4 className="text-lg font-black text-green-400 uppercase">Allowed</h4>
                </div>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Electronics, phones, computers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Clothing, accessories, jewelry</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Collectibles, art, antiques</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Books, media, educational materials</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Home goods, furniture, appliances</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Sports equipment, outdoor gear</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Digital services (legal consulting, design, etc.)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Vehicles, automotive parts</span>
                  </li>
                </ul>
              </div>

              {/* Not Allowed */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <h4 className="text-lg font-black text-red-400 uppercase">Not Allowed</h4>
                </div>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>Drugs, narcotics, or drug paraphernalia</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>Weapons, firearms, explosives</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>Stolen goods or items without proof of ownership</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>Adult services or explicit content</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>Hacking tools, malware, stolen data</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>Services involving criminal activity</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>Counterfeit items or fake documents</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>Products from endangered species</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Consequences */}
          <section className="mb-8">
            <h3 className="text-2xl font-black text-white uppercase mb-6">Consequences for Violations</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="text-3xl mb-2">⚠️</div>
                <h4 className="text-sm font-black text-yellow-400 uppercase mb-2">First Offense</h4>
                <p className="text-xs text-gray-400">Warning + Listing Removal</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <div className="text-3xl mb-2">🚫</div>
                <h4 className="text-sm font-black text-orange-400 uppercase mb-2">Second Offense</h4>
                <p className="text-xs text-gray-400">Account Suspension (7 days)</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="text-3xl mb-2">🔒</div>
                <h4 className="text-sm font-black text-red-400 uppercase mb-2">Third Offense</h4>
                <p className="text-xs text-gray-400">Permanent Account Ban</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="text-3xl mb-2">👮</div>
                <h4 className="text-sm font-black text-red-400 uppercase mb-2">Severe Violations</h4>
                <p className="text-xs text-gray-400">Law Enforcement Referral</p>
              </div>
            </div>
          </section>

          {/* How to Report */}
          <section className="mb-8">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-black text-blue-400 uppercase">How to Report Violations</h3>
              </div>
              <div className="space-y-3 text-gray-300">
                <p className="leading-relaxed">
                  If you see a listing that violates our policies, please report it immediately:
                </p>
                <ol className="space-y-2 list-decimal list-inside">
                  <li className="font-bold">Click the "Report" button on any listing</li>
                  <li className="font-bold">Select the prohibited category and severity</li>
                  <li className="font-bold">Provide a detailed description</li>
                  <li className="font-bold">Submit evidence if available</li>
                  <li className="font-bold">Earn GHETTO tokens if your report is validated</li>
                </ol>
                <p className="text-yellow-400 font-black mt-4">
                  Community moderators with high accuracy rates earn up to 10% bonus rewards!
                </p>
              </div>
            </div>
          </section>

          {/* Legal Disclaimer */}
          <section className="mb-4">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-black text-white uppercase mb-3">Legal Disclaimer</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {PROHIBITED_CONTENT.POLICY_STATEMENTS.LEGAL_DISCLAIMER} GHETTO Finance reserves the right to remove any listing at any time for any reason. Violations may result in account suspension, permanent ban, and referral to law enforcement. By using this platform, you agree to comply with all applicable laws and our Terms of Service.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
