import React, { useState, useEffect } from 'react';
import { useEnhancedSitemaster } from '../hooks/useEnhancedSitemaster';
import {
  Shield, Search, Ban, Flag, MessageSquare, Activity, Settings,
  Users, Package, TrendingUp, AlertTriangle, Eye, Lock, Unlock,
  BarChart3, FileText, XCircle, CheckCircle
} from 'lucide-react';

export function EnhancedSitemasterDashboard() {
  const {
    flags,
    suspensions,
    activityLogs,
    loading,
    error,
    isSitemaster,
    flagUser,
    resolveFlag,
    suspendUser,
    liftSuspension,
    deleteContent,
    sendAdminMessage,
    searchUsers,
    searchListings,
    getUserActivity,
    getPlatformStats,
    getSetting,
    updateSetting,
    getSettingsByCategory,
    refresh
  } = useEnhancedSitemaster();

  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'flags' | 'suspensions' | 'activity' | 'settings'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<'users' | 'listings'>('users');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({ subject: '', message: '', priority: 'normal' });
  const [platformSettings, setPlatformSettings] = useState<any[]>([]);

  useEffect(() => {
    isSitemaster().then(setHasAccess);
    getPlatformStats().then(setStats);
    getSettingsByCategory('platform').then(setPlatformSettings);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Sitemaster Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have Sitemaster permissions.</p>
        </div>
      </div>
    );
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = searchType === 'users'
        ? await searchUsers(searchQuery)
        : await searchListings(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      alert('Search error: ' + err.message);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const reason = prompt('Enter reason for suspension:');
    if (!reason) return;

    const durationStr = prompt('Enter duration in hours (leave empty for permanent):');
    const duration = durationStr ? parseInt(durationStr) : undefined;

    try {
      await suspendUser(userId, reason, duration);
      alert('User suspended successfully');
      refresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleFlagUser = async (userId: string) => {
    const flagType = prompt('Enter flag type (spam, abuse, fraud, etc):');
    if (!flagType) return;

    const reason = prompt('Enter reason for flagging:');
    if (!reason) return;

    try {
      await flagUser(userId, flagType, reason);
      alert('User flagged successfully');
      refresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageForm.subject || !messageForm.message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await sendAdminMessage(selectedUser.id, messageForm.subject, messageForm.message, messageForm.priority);
      alert('Message sent successfully');
      setShowMessageModal(false);
      setMessageForm({ subject: '', message: '', priority: 'normal' });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleViewUserActivity = async (userId: string) => {
    try {
      const activity = await getUserActivity(userId);
      alert(`User Activity:\n\n${activity.map(a => `${a.activity_type}: ${new Date(a.created_at).toLocaleString()}`).join('\n')}`);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-orange-600" />
            Sitemaster Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Complete platform control and administration</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 flex gap-2 border-b border-gray-200 overflow-x-auto">
          {['overview', 'users', 'content', 'flags', 'suspensions', 'activity', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeTab === tab
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && stats && (
          <div>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Users}
                label="Total Users"
                value={stats.totalUsers.toLocaleString()}
                color="bg-blue-500"
              />
              <StatCard
                icon={Package}
                label="Total Products"
                value={stats.totalProducts.toLocaleString()}
                color="bg-green-500"
              />
              <StatCard
                icon={BarChart3}
                label="Total Orders"
                value={stats.totalOrders.toLocaleString()}
                color="bg-purple-500"
              />
              <StatCard
                icon={Ban}
                label="Active Suspensions"
                value={stats.activeSuspensions}
                color="bg-red-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Flag className="h-5 w-5 text-orange-500" />
                  Recent Flags ({flags.length})
                </h3>
                <div className="space-y-3">
                  {flags.slice(0, 5).map((flag) => (
                    <div key={flag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{flag.flag_type}</p>
                        <p className="text-xs text-gray-600">{flag.reason}</p>
                      </div>
                      <button
                        onClick={() => resolveFlag(flag.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                  {flags.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No active flags</p>
                  )}
                </div>
              </div>

              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{log.activity_type}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="mb-6 bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Users</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by username or name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleSearch}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
                >
                  <Search className="h-5 w-5" />
                  Search
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {searchResults.map((user) => (
                <div key={user.id} className="bg-white shadow-md rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{user.username}</h4>
                      {user.full_name && (
                        <p className="text-sm text-gray-600">{user.full_name}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">ID: {user.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewUserActivity(user.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Activity"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleFlagUser(user.id)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                        title="Flag User"
                      >
                        <Flag className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleSuspendUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Suspend User"
                      >
                        <Ban className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowMessageModal(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Message User"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && searchQuery && (
                <div className="bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className="mb-6 bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Content</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="users">Users</option>
                    <option value="listings">Listings</option>
                  </select>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={`Search ${searchType}...`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleSearch}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {searchResults.map((item) => (
                <div key={item.id} className="bg-white shadow-md rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.name || item.username}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.description || item.full_name}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this content?')) {
                          const reason = prompt('Enter reason for deletion:');
                          if (reason) {
                            await deleteContent(searchType === 'listings' ? 'product' : 'user', item.id, reason);
                            alert('Content deleted');
                            handleSearch();
                          }
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'flags' && (
          <div className="grid gap-4">
            {flags.map((flag) => (
              <div key={flag.id} className="bg-white shadow-md rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="h-5 w-5 text-orange-500" />
                      <span className="font-semibold text-gray-900">{flag.flag_type}</span>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        {flag.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{flag.reason}</p>
                    <p className="text-xs text-gray-500">
                      Flagged on {new Date(flag.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => resolveFlag(flag.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            {flags.length === 0 && (
              <div className="bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
                No active flags
              </div>
            )}
          </div>
        )}

        {activeTab === 'suspensions' && (
          <div className="grid gap-4">
            {suspensions.map((suspension) => (
              <div key={suspension.id} className="bg-white shadow-md rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Ban className="h-5 w-5 text-red-500" />
                      <span className="font-semibold text-gray-900">User Suspension</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{suspension.reason}</p>
                    <p className="text-xs text-gray-500">
                      Suspended on {new Date(suspension.created_at).toLocaleString()}
                    </p>
                    {suspension.expires_at && (
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(suspension.expires_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => liftSuspension(suspension.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Unlock className="h-5 w-5" />
                    Lift
                  </button>
                </div>
              </div>
            ))}
            {suspensions.length === 0 && (
              <div className="bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
                No active suspensions
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Activity Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{log.activity_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {log.user_id ? log.user_id.substring(0, 8) + '...' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.ip_address || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid md:grid-cols-2 gap-6">
            {platformSettings.map((setting) => (
              <div key={setting.id} className="bg-white shadow-md rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-2">{setting.setting_key}</h4>
                <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={JSON.stringify(setting.setting_value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    id={`setting-${setting.id}`}
                  />
                  <button
                    onClick={async () => {
                      const input = document.getElementById(`setting-${setting.id}`) as HTMLInputElement;
                      try {
                        const value = JSON.parse(input.value);
                        await updateSetting(setting.setting_key, value, setting.category, setting.description);
                        alert('Setting updated');
                      } catch (err) {
                        alert('Invalid JSON');
                      }
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
            {platformSettings.length === 0 && (
              <div className="col-span-2 bg-white shadow-md rounded-lg p-12 text-center text-gray-500">
                No settings configured
              </div>
            )}
          </div>
        )}
      </div>

      {showMessageModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Message {selectedUser.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={messageForm.priority}
                  onChange={(e) => setMessageForm({ ...messageForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
