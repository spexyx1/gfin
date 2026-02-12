import React, { useState } from 'react';
import { X, Shield, Lock, Smartphone, Mail, Key, AlertTriangle, CheckCircle, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { useSecurity } from '../hooks/useSecurity';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '../utils/logger';

interface SecurityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SecurityDashboard({ isOpen, onClose }: SecurityDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'devices' | 'activity'>('overview');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const {
    securitySettings,
    securityEvents,
    trustedDevices,
    isLoading,
    enable2FA,
    disable2FA,
    addTrustedDevice,
    removeTrustedDevice,
    updateSecuritySettings,
    generateSecurityReport,
    calculateSecurityScore,
  } = useSecurity();

  const securityReport = generateSecurityReport();
  const securityScore = calculateSecurityScore();

  const handleEnable2FA = async () => {
    try {
      const { backupCodes: codes } = await enable2FA();
      setBackupCodes(codes);
      setShow2FASetup(true);
    } catch (error) {
      logger.error('Failed to enable 2FA', 'SecurityDashboard', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl border border-gray-700 w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-neon-blue" />
            <h2 className="text-2xl font-black text-white uppercase">Security Center</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <div className="text-center">
                <div className={`text-3xl font-black mb-2 ${getScoreColor(securityScore)}`}>
                  {securityScore}%
                </div>
                <p className="text-gray-400 text-sm font-medium">Security Score</p>
              </div>
            </div>

            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: Shield },
                  { id: 'settings', label: 'Settings', icon: Lock },
                  { id: 'devices', label: 'Devices', icon: Smartphone },
                  { id: 'activity', label: 'Activity', icon: Eye },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      activeTab === id
                        ? 'bg-neon-blue text-black'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-white mb-6 uppercase">Security Overview</h3>
                  
                  {/* Security Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          securitySettings.twoFactorEnabled ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          <Lock className={`w-5 h-5 ${
                            securitySettings.twoFactorEnabled ? 'text-green-400' : 'text-red-400'
                          }`} />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Two-Factor Auth</h4>
                          <p className={`text-sm ${
                            securitySettings.twoFactorEnabled ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          securitySettings.emailVerified ? 'bg-green-500/20' : 'bg-yellow-500/20'
                        }`}>
                          <Mail className={`w-5 h-5 ${
                            securitySettings.emailVerified ? 'text-green-400' : 'text-yellow-400'
                          }`} />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Email Verified</h4>
                          <p className={`text-sm ${
                            securitySettings.emailVerified ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {securitySettings.emailVerified ? 'Verified' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">Trusted Devices</h4>
                          <p className="text-sm text-blue-400">{trustedDevices.length} devices</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Report */}
                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <h4 className="text-lg font-black text-white mb-4 uppercase">30-Day Security Report</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-black text-green-400">{securityReport.successfulLogins}</p>
                        <p className="text-gray-400 text-sm">Successful Logins</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-red-400">{securityReport.failedLogins}</p>
                        <p className="text-gray-400 text-sm">Failed Attempts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-yellow-400">{securityReport.suspiciousActivity}</p>
                        <p className="text-gray-400 text-sm">Suspicious Events</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-blue-400">{securityReport.uniqueIPs}</p>
                        <p className="text-gray-400 text-sm">Unique IPs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-white mb-6 uppercase">Security Settings</h3>

                {/* Two-Factor Authentication */}
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-black text-white uppercase">Two-Factor Authentication</h4>
                      <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                    </div>
                    <button
                      onClick={securitySettings.twoFactorEnabled ? disable2FA : handleEnable2FA}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        securitySettings.twoFactorEnabled
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
                    </button>
                  </div>
                </div>

                {/* Session Settings */}
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-black text-white mb-4 uppercase">Session Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Session Timeout (minutes)</label>
                      <select
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => updateSecuritySettings({ sessionTimeout: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue text-white"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={480}>8 hours</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-white font-medium">Login Notifications</h5>
                        <p className="text-gray-400 text-sm">Get notified of new login attempts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securitySettings.loginNotifications}
                          onChange={(e) => updateSecuritySettings({ loginNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-white font-medium">Device Trust</h5>
                        <p className="text-gray-400 text-sm">Remember trusted devices</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securitySettings.deviceTrust}
                          onChange={(e) => updateSecuritySettings({ deviceTrust: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === 'devices' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white uppercase">Trusted Devices</h3>
                  <button
                    onClick={() => addTrustedDevice('Current Device')}
                    className="px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg font-medium transition-colors"
                  >
                    Trust This Device
                  </button>
                </div>

                <div className="space-y-4">
                  {trustedDevices.map((device) => (
                    <div key={device.id} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-neon-blue/20 rounded-full flex items-center justify-center">
                            <Smartphone className="w-6 h-6 text-neon-blue" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{device.name}</h4>
                            <p className="text-gray-400 text-sm">{device.ipAddress}</p>
                            <p className="text-gray-500 text-xs">
                              Last used {formatDistanceToNow(device.lastUsed, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeTrustedDevice(device.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {trustedDevices.length === 0 && (
                    <div className="text-center py-12">
                      <Smartphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No trusted devices</p>
                      <p className="text-gray-500">Add devices you regularly use for easier access</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-white mb-6 uppercase">Security Activity</h3>

                <div className="space-y-4">
                  {securityEvents.slice(0, 20).map((event) => (
                    <div key={event.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            event.success ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {event.success ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-white font-medium capitalize">
                              {event.type.replace('_', ' ')}
                            </h4>
                            <p className="text-gray-400 text-sm">{event.ipAddress}</p>
                            {event.details && (
                              <p className="text-gray-500 text-xs">{event.details}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">
                            {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                          </p>
                          <p className={`text-xs ${event.success ? 'text-green-400' : 'text-red-400'}`}>
                            {event.success ? 'Success' : 'Failed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {securityEvents.length === 0 && (
                    <div className="text-center py-12">
                      <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No security events</p>
                      <p className="text-gray-500">Your security activity will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-black text-white uppercase">2FA Setup Complete</h3>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3">Backup Codes</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <code className="text-neon-blue font-mono">{code}</code>
                      <button
                        onClick={() => copyToClipboard(code)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Copy All
                </button>
                <button
                  onClick={() => setShow2FASetup(false)}
                  className="flex-1 py-2 bg-neon-blue hover:bg-neon-blue/80 text-black rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}