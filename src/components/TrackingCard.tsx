import React from 'react';
import { Truck, Package, CheckCircle, Clock, ExternalLink, MapPin, Calendar } from 'lucide-react';
import { EscrowOrder } from '../hooks/useEscrow';
import { formatDistanceToNow } from 'date-fns';

interface TrackingCardProps {
  order: EscrowOrder;
  className?: string;
}

export function TrackingCard({ order, className = '' }: TrackingCardProps) {
  if (!order.trackingNumber) {
    return null;
  }

  const getStatusIcon = () => {
    switch (order.status) {
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-400" />;
      case 'delivered':
        return <Package className="w-5 h-5 text-green-400" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusText = () => {
    switch (order.status) {
      case 'shipped':
        return 'Package Shipped';
      case 'delivered':
        return 'Package Delivered';
      case 'completed':
        return 'Order Completed';
      default:
        return 'In Transit';
    }
  };

  const getStatusColor = () => {
    switch (order.status) {
      case 'shipped':
        return 'text-blue-400';
      case 'delivered':
        return 'text-green-400';
      case 'completed':
        return 'text-green-500';
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <div className={`bg-gray-800 rounded-2xl p-6 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-white font-black uppercase">{getStatusText()}</h3>
            <p className="text-gray-400 text-sm">Order #{order.id.slice(0, 8)}</p>
          </div>
        </div>
        {order.trackingUrl && (
          <a
            href={order.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Track</span>
          </a>
        )}
      </div>

      {/* Tracking Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Tracking Number:</span>
          <span className="text-white font-mono text-sm">{order.trackingNumber}</span>
        </div>

        {order.carrier && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Carrier:</span>
            <span className="text-white text-sm">{order.carrier}</span>
          </div>
        )}

        {order.shippedAt && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Shipped:</span>
            <span className="text-white text-sm">
              {formatDistanceToNow(order.shippedAt, { addSuffix: true })}
            </span>
          </div>
        )}

        {order.estimatedDelivery && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Estimated Delivery:</span>
            <span className={`text-sm font-medium ${
              new Date() > order.estimatedDelivery ? 'text-red-400' : 'text-green-400'
            }`}>
              {order.estimatedDelivery.toLocaleDateString()}
            </span>
          </div>
        )}

        {order.deliveredAt && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Delivered:</span>
            <span className="text-green-400 text-sm">
              {formatDistanceToNow(order.deliveredAt, { addSuffix: true })}
            </span>
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-400 text-xs font-medium">FUNDED</span>
          </div>
          <div className="flex-1 h-px bg-gray-600"></div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed'
                ? 'bg-blue-500' : 'bg-gray-600'
            }`}></div>
            <span className={`text-xs font-medium ${
              order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed'
                ? 'text-blue-400' : 'text-gray-500'
            }`}>SHIPPED</span>
          </div>
          <div className="flex-1 h-px bg-gray-600"></div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              order.status === 'delivered' || order.status === 'completed'
                ? 'bg-green-500' : 'bg-gray-600'
            }`}></div>
            <span className={`text-xs font-medium ${
              order.status === 'delivered' || order.status === 'completed'
                ? 'text-green-400' : 'text-gray-500'
            }`}>DELIVERED</span>
          </div>
        </div>
      </div>
    </div>
  );
}