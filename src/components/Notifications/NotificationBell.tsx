import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, Package, AlertTriangle, User } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
// import { useAuth } from '../../contexts/AuthContext';
import { NotificationService } from '../../lib/notificationService';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  // const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'asset':
        return <Package className="w-4 h-4" />;
      case 'issue':
        return <AlertTriangle className="w-4 h-4" />;
      case 'transfer':
        return <Package className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-green-600 bg-green-100';
      case 'updated':
        return 'text-blue-600 bg-blue-100';
      case 'deleted':
        return 'text-red-600 bg-red-100';
      case 'transferred':
        return 'text-purple-600 bg-purple-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const groupedNotifications = NotificationService.groupNotificationsByDate(notifications.slice(0, 10));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                <div key={date}>
                  <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700">
                    {date}
                  </div>
                  {dateNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        markAsRead(notification.id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getActionColor(notification.action_type)}`}>
                          {getNotificationIcon(notification.entity_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {NotificationService.formatRelativeTime(notification.created_at)}
                          </div>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
