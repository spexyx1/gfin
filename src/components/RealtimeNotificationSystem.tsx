import React, { useEffect, useState } from 'react';
import { Bell, X, Package, MessageCircle, ShoppingCart, TrendingUp } from 'lucide-react';
import { useRealtimeOrders } from '../hooks/useRealtimeOrders';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import { useRealtimeProducts } from '../hooks/useRealtimeProducts';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'product' | 'auction';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function RealtimeNotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const { unreadCount: orderCount } = useRealtimeOrders({
    onOrderAdded: (order) => {
      addNotification({
        id: `order-${order.id}`,
        type: 'order',
        title: 'New Order Received',
        message: `Order #${order.id.slice(0, 8)} for $${order.total_amount}`,
        timestamp: new Date(),
        read: false,
      });
    },
    onOrderUpdated: (order) => {
      addNotification({
        id: `order-update-${order.id}-${Date.now()}`,
        type: 'order',
        title: 'Order Updated',
        message: `Order #${order.id.slice(0, 8)} is now ${order.status}`,
        timestamp: new Date(),
        read: false,
      });
    },
  });

  const { unreadCount: messageCount } = useRealtimeMessages({
    onNewMessage: (message) => {
      addNotification({
        id: `message-${message.id}`,
        type: 'message',
        title: 'New Message',
        message: message.content.slice(0, 50),
        timestamp: new Date(),
        read: false,
      });
    },
    autoNotify: false,
  });

  const { realtimeProducts } = useRealtimeProducts({
    onProductAdded: (product) => {
      addNotification({
        id: `product-${product.id}`,
        type: 'product',
        title: 'New Product Listed',
        message: `${product.name} - $${product.price}`,
        timestamp: new Date(),
        read: false,
      });
    },
  });

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev.slice(0, 49)]);

    if (notificationPermission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        tag: notification.id,
      });
    }

    if ('vibrate' in navigator) {
      navigator.vibrate([200]);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const totalUnread = unreadNotifications.length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-5 h-5" />;
      case 'message':
        return <MessageCircle className="w-5 h-5" />;
      case 'product':
        return <Package className="w-5 h-5" />;
      case 'auction':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-blue-600';
      case 'message':
        return 'text-green-600';
      case 'product':
        return 'text-purple-600';
      case 'auction':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {totalUnread > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowPanel(false)}
            />

            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="fixed top-0 right-0 w-full sm:w-96 h-full bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Notifications</h2>
                  {totalUnread > 0 && (
                    <span className="px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                      {totalUnread}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {notificationPermission !== 'granted' && (
                <div className="p-4 bg-yellow-50 border-b">
                  <p className="text-sm text-yellow-800 mb-2">
                    Enable desktop notifications for real-time alerts
                  </p>
                  <button
                    onClick={requestNotificationPermission}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Enable Notifications
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <span className="text-sm text-gray-600">
                  {notifications.length} total notifications
                </span>
                <div className="flex gap-2">
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Bell className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 ${getIconColor(notification.type)}`}>
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium text-gray-900">
                                {notification.title}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
