import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, Package, AlertTriangle, User } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationService } from '../../lib/notificationService';

const NotificationBell: React.FC = () => {
const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowAll(false); // reset when closed
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: 'w-4 h-4' };
    switch (type) {
      case 'asset':
      case 'transfer':
        return <Package {...iconProps} />;
      case 'issue':
        return <AlertTriangle {...iconProps} />;
      case 'user':
        return <User {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getActionColor = (action: string, entityType?: string) => {
    // Base colors for action types
    let colorClass = '';
    
    switch (action) {
      case 'created':
        colorClass = 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
        break;
      case 'updated':
        colorClass = 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
        break;
      case 'deleted':
        colorClass = 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
        break;
      case 'transferred':
        colorClass = 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
        break;
      case 'approved':
        colorClass = 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30';
        break;
      case 'rejected':
        colorClass = 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30';
        break;
      default:
        colorClass = 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }

    // Add entity type specific variations
    if (entityType) {
      switch (entityType) {
        case 'asset':
          colorClass += ' border-l-4 border-l-orange-500';
          break;
        case 'transfer':
          colorClass += ' border-l-4 border-l-indigo-500';
          break;
        case 'issue':
          colorClass += ' border-l-4 border-l-yellow-500';
          break;
        case 'user':
          colorClass += ' border-l-4 border-l-cyan-500';
          break;
      }
    }

    return colorClass;
  };

  // Slice based on "showAll"
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);
  const groupedNotifications = NotificationService.groupNotificationsByDate(displayedNotifications);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setIsOpen(false);
    setShowAll(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Toggle notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No notifications yet</p>
              </div>
            ) : (
              Object.entries(groupedNotifications).map(([date, items]) => (
                <div key={date}>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {date}
                  </div>
                  {items.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        !notification.is_read
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-full ${getActionColor(
                            notification.action_type,
                            notification.entity_type
                          )}`}
                        >
                          {getNotificationIcon(notification.entity_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {NotificationService.formatRelativeTime(
                              notification.created_at
                            )}
                          </div>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {notifications.length > 5 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAll((prev) => !prev)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showAll ? 'Show less' : 'View all notifications'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
