import React from 'react';
import { TrendingUp, Users, Package, DollarSign, ShoppingCart, BarChart3 } from 'lucide-react';

interface AnalyticsProps {
  analytics: any;
  escrowStats: any;
}

export function SitemasterAnalytics({ analytics, escrowStats }: AnalyticsProps) {
  if (!analytics || !escrowStats) {
    return (
      <div className="text-center py-12 text-gray-500">
        Loading analytics...
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, change, color }: any) => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {change && (
          <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Analytics</h2>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total Users"
            value={analytics.totalUsers?.toLocaleString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={Package}
            label="Total Products"
            value={analytics.totalProducts?.toLocaleString()}
            color="bg-green-500"
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Orders"
            value={analytics.totalOrders?.toLocaleString()}
            color="bg-purple-500"
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${analytics.totalRevenue?.toLocaleString()}`}
            color="bg-orange-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth (Last 30 Days)</h3>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">New Users</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.newUsersLast30Days}</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600">New Products</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.newProductsLast30Days}</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">New Orders</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.newOrdersLast30Days}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Escrow Statistics</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Active Escrow Orders</p>
            <p className="text-2xl font-bold text-gray-900">{escrowStats.totalEscrowOrders}</p>
            <p className="text-sm text-green-600 mt-2">
              ${escrowStats.totalEscrowAmount?.toLocaleString()} USDC
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Disputed Orders</p>
            <p className="text-2xl font-bold text-red-600">{escrowStats.disputedOrders}</p>
            <p className="text-sm text-red-500 mt-2">
              ${escrowStats.disputedAmount?.toLocaleString()} USDC
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Completed Orders</p>
            <p className="text-2xl font-bold text-green-600">{escrowStats.completedOrders}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
