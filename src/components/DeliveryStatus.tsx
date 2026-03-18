import { Package, Truck, CheckCircle, Clock, AlertTriangle, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { EscrowOrder } from '../hooks/useEscrow';
import { formatDistanceToNow } from 'date-fns';

interface DeliveryStatusProps {
  order: EscrowOrder;
  onConfirmDelivery?: () => void;
  onDispute?: () => void;
  showActions?: boolean;
}

export function DeliveryStatus({ order, onConfirmDelivery, onDispute, showActions = false }: DeliveryStatusProps) {
  const getDeliveryStatus = () => {
    if (order.status === 'completed') {
      return {
        icon: <CheckCircle className="w-6 h-6 text-green-500" />,
        title: 'Order Completed',
        description: 'Package delivered and confirmed',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20'
      };
    }
    
    if (order.status === 'delivered') {
      return {
        icon: <Package className="w-6 h-6 text-green-400" />,
        title: 'Package Delivered',
        description: 'Awaiting delivery confirmation',
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        borderColor: 'border-green-400/20'
      };
    }
    
    if (order.status === 'shipped') {
      const isOverdue = order.estimatedDelivery && new Date() > order.estimatedDelivery;
      return {
        icon: <Truck className="w-6 h-6 text-blue-400" />,
        title: isOverdue ? 'Package Overdue' : 'Package In Transit',
        description: isOverdue ? 'Package is past estimated delivery date' : 'Package is on its way',
        color: isOverdue ? 'text-yellow-400' : 'text-blue-400',
        bgColor: isOverdue ? 'bg-yellow-400/10' : 'bg-blue-400/10',
        borderColor: isOverdue ? 'border-yellow-400/20' : 'border-blue-400/20'
      };
    }
    
    if (order.status === 'disputed') {
      return {
        icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
        title: 'Order Disputed',
        description: 'Dispute in progress',
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/20'
      };
    }
    
    return {
      icon: <Clock className="w-6 h-6 text-gray-400" />,
      title: 'Preparing to Ship',
      description: 'Order is being prepared',
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
      borderColor: 'border-gray-400/20'
    };
  };

  const status = getDeliveryStatus();

  return (
    <div className={`rounded-2xl p-6 border ${status.bgColor} ${status.borderColor}`}>
      {/* Status Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status.bgColor}`}>
          {status.icon}
        </div>
        <div>
          <h3 className={`text-lg font-black uppercase ${status.color}`}>{status.title}</h3>
          <p className="text-gray-400 text-sm">{status.description}</p>
        </div>
      </div>

      {/* Tracking Information */}
      {order.trackingNumber && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="luxe-glass opacity-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm font-medium">Tracking Number</span>
              </div>
              <p className="text-white font-mono text-sm">{order.trackingNumber}</p>
            </div>

            {order.carrier && (
              <div className="luxe-glass opacity-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm font-medium">Carrier</span>
                </div>
                <p className="text-white text-sm">{order.carrier}</p>
              </div>
            )}
          </div>

          {/* Delivery Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.shippedAt && (
              <div className="luxe-glass opacity-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm font-medium">Shipped</span>
                </div>
                <p className="text-white text-sm">
                  {formatDistanceToNow(order.shippedAt, { addSuffix: true })}
                </p>
              </div>
            )}

            {order.estimatedDelivery && (
              <div className="luxe-glass opacity-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm font-medium">Estimated Delivery</span>
                </div>
                <p className={`text-sm font-medium ${
                  new Date() > order.estimatedDelivery ? 'text-red-400' : 'text-green-400'
                }`}>
                  {order.estimatedDelivery.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Track Package Button */}
          {order.trackingUrl && (
            <div className="flex justify-center">
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Track Package on {order.carrier}</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Delivery Timeline */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-4">Delivery Progress</h4>
        <div className="space-y-3">
          {/* Order Created */}
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-green-400 font-medium text-sm">Order Created</p>
              <p className="text-gray-500 text-xs">
                {formatDistanceToNow(order.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Order Shipped */}
          <div className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
              order.shippedAt ? 'bg-blue-500' : 'bg-gray-600'
            }`}></div>
            <div className="flex-1">
              <p className={`font-medium text-sm ${
                order.shippedAt ? 'text-blue-400' : 'text-gray-500'
              }`}>Package Shipped</p>
              {order.shippedAt && (
                <p className="text-gray-500 text-xs">
                  {formatDistanceToNow(order.shippedAt, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          {/* Package Delivered */}
          <div className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
              order.deliveredAt ? 'bg-green-500' : 'bg-gray-600'
            }`}></div>
            <div className="flex-1">
              <p className={`font-medium text-sm ${
                order.deliveredAt ? 'text-green-400' : 'text-gray-500'
              }`}>Package Delivered</p>
              {order.deliveredAt && (
                <p className="text-gray-500 text-xs">
                  {formatDistanceToNow(order.deliveredAt, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex space-x-3">
          {order.status === 'shipped' && onConfirmDelivery && (
            <button
              onClick={onConfirmDelivery}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Delivery</span>
            </button>
          )}
          
          {(order.status === 'shipped' || order.status === 'delivered') && onDispute && (
            <button
              onClick={onDispute}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium flex items-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Dispute</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}