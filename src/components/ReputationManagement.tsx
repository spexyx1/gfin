import React, { useState, useEffect } from 'react';
import { useReputation } from '../hooks/useReputation';
import { AlertTriangle, CheckCircle, XCircle, Lock, Unlock, DollarSign } from 'lucide-react';

export function ReputationManagement() {
  const {
    getAllSuspendedUsers,
    getCollateralRedemptionRequests,
    overrideSuspension,
    processCollateralRedemption
  } = useReputation();

  const [suspendedUsers, setSuspendedUsers] = useState<any[]>([]);
  const [redemptionRequests, setRedemptionRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'suspensions' | 'redemptions'>('suspensions');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'suspensions') {
        const users = await getAllSuspendedUsers();
        setSuspendedUsers(users || []);
      } else {
        const requests = await getCollateralRedemptionRequests();
        setRedemptionRequests(requests || []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (userId: string, username: string) => {
    const reason = prompt(`Enter reason for overriding ${username}'s suspension:`);
    if (!reason) return;

    try {
      await overrideSuspension(userId, reason);
      alert('Suspension overridden successfully');
      await loadData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleRedemption = async (userId: string, username: string, approve: boolean) => {
    const notes = prompt(
      approve
        ? `Enter approval notes for ${username}:`
        : `Enter rejection reason for ${username}:`
    );
    if (!notes) return;

    try {
      await processCollateralRedemption(userId, approve, notes);
      alert(approve ? 'Collateral released' : 'Request denied');
      await loadData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reputation Management</h2>

      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('suspensions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'suspensions'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Suspended Users ({suspendedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('redemptions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'redemptions'
              ? 'border-b-2 border-orange-500 text-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Collateral Redemptions ({redemptionRequests.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'suspensions' && (
            <div className="space-y-4">
              {suspendedUsers.map(user => (
                <div key={user.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <h3 className="text-lg font-semibold">{user.profile?.username || 'User'}</h3>
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          SUSPENDED
                        </span>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                          <p className="text-gray-600">Suspension Count</p>
                          <p className="font-semibold">{user.suspension_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Ends On</p>
                          <p className="font-semibold">
                            {new Date(user.suspension_end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Transactions</p>
                          <p className="font-semibold">{user.total_transactions}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Disputed</p>
                          <p className="font-semibold text-red-600">{user.disputed_count}</p>
                        </div>
                      </div>

                      {user.collateral_held && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-800 font-medium">
                            ⚠️ Collateral is currently held (3rd suspension)
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOverride(user.user_id, user.profile?.username || 'User')}
                      className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Unlock className="h-4 w-4" />
                      Override
                    </button>
                  </div>
                </div>
              ))}

              {suspendedUsers.length === 0 && (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <p>No suspended users</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'redemptions' && (
            <div className="space-y-4">
              {redemptionRequests.map(request => (
                <div key={request.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="h-6 w-6 text-orange-500" />
                        <h3 className="text-lg font-semibold">{request.profile?.username || 'User'}</h3>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                          REDEMPTION REQUEST
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{request.profile?.email}</p>

                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Suspension Count</p>
                          <p className="font-semibold text-red-600">{request.suspension_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Transactions</p>
                          <p className="font-semibold">{request.total_transactions}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Successful</p>
                          <p className="font-semibold text-green-600">{request.successful_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Disputed</p>
                          <p className="font-semibold text-red-600">{request.disputed_count}</p>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong>Important:</strong> This user has been suspended {request.suspension_count} time(s). Review their transaction history carefully before deciding on collateral redemption.
                        </p>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleRedemption(request.user_id, request.profile?.username || 'User', true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRedemption(request.user_id, request.profile?.username || 'User', false)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {redemptionRequests.length === 0 && (
                <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                  <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p>No redemption requests</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
