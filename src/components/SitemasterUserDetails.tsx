import React from 'react';
import { X, User, Package, ShoppingCart, Flag, Ban, Mail } from 'lucide-react';

interface UserDetailsProps {
  user: any;
  onClose: () => void;
  onSuspend: (userId: string) => void;
  onFlag: (userId: string) => void;
  onMessage: (userId: string) => void;
}

export function SitemasterUserDetails({ user, onClose, onSuspend, onFlag, onMessage }: UserDetailsProps) {
  if (!user) return null;

  const { profile, orders, products, flags, suspensions } = user;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Info */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-full">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{profile.username}</h3>
                  <p className="text-sm text-gray-600">{profile.display_name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onMessage(profile.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Message"
                >
                  <Mail className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onFlag(profile.id)}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                  title="Flag"
                >
                  <Flag className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onSuspend(profile.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Suspend"
                >
                  <Ban className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{profile.email || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-600">Verified:</span>
                <span className={`ml-2 font-medium ${profile.verified ? 'text-green-600' : 'text-red-600'}`}>
                  {profile.verified ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Seller:</span>
                <span className="ml-2 font-medium">{profile.is_seller ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span className="text-gray-600">Member Since:</span>
                <span className="ml-2 font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-600">Bio:</span>
                <p className="mt-1 text-gray-900">{profile.bio || 'No bio'}</p>
              </div>
              <div>
                <span className="text-gray-600">User ID:</span>
                <span className="ml-2 font-mono text-xs">{profile.id}</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">Orders</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Products Listed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Flag className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-gray-600">Flags</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{flags.length}</p>
            </div>
          </div>

          {/* Recent Orders */}
          {orders.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Orders</h4>
              <div className="space-y-2">
                {orders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-600">${order.amount} USDC</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'disputed' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Suspensions */}
          {suspensions.filter((s: any) => s.active).length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 text-red-600">Active Suspensions</h4>
              <div className="space-y-2">
                {suspensions.filter((s: any) => s.active).map((suspension: any) => (
                  <div key={suspension.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-medium text-red-900">{suspension.reason}</p>
                    <p className="text-sm text-red-600 mt-1">
                      Suspended on {new Date(suspension.created_at).toLocaleString()}
                    </p>
                    {suspension.expires_at && (
                      <p className="text-sm text-red-600">
                        Expires: {new Date(suspension.expires_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Flags */}
          {flags.filter((f: any) => f.status === 'active').length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 text-orange-600">Active Flags</h4>
              <div className="space-y-2">
                {flags.filter((f: any) => f.status === 'active').map((flag: any) => (
                  <div key={flag.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="font-medium text-orange-900">{flag.flag_type}</p>
                    <p className="text-sm text-orange-700">{flag.reason}</p>
                    <p className="text-xs text-orange-600 mt-2">
                      Flagged on {new Date(flag.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products (if seller) */}
          {products.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Listed Products</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {products.slice(0, 6).map((product: any) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-1">{product.name}</h5>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">${product.price}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
