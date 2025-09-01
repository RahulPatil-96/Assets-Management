import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, Clock, Package, AlertTriangle, User, ChevronDown } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationService } from '../../lib/notificationService';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedNotificationIds, setExpandedNotificationIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAll(false); // reset when closed
        setExpandedNotificationIds(new Set()); // collapse all on close
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setShowAll(false);
        setExpandedNotificationIds(new Set()); // collapse all on close
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

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

  const toggleExpandNotification = (id: string) => {
    setExpandedNotificationIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const isNotificationExpanded = (id: string) => expandedNotificationIds.has(id);

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

  // Filter and sort notifications
  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(notification => notification.entity_type === filterType);
    }

    // Sort by date
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [notifications, filterType, sortOrder]);

  // Slice based on "showAll"
  const displayedNotifications = showAll
    ? filteredAndSortedNotifications
    : filteredAndSortedNotifications.slice(0, 5);
  const groupedNotifications = NotificationService.groupNotificationsByDate(displayedNotifications);

  const handleNotificationClick = (id: string) => {
    // Toggle expansion instead of closing dropdown
    toggleExpandNotification(id);
    // Mark as read when expanded
    markAsRead(id);
  };

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className='relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors'
        aria-label='Toggle notifications'
      >
        <Bell className='w-5 h-5' />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className='fixed sm:absolute top-16 right-2 sm:right-0 sm:mt-2 w-[calc(100vw-1rem)] max-w-sm md:max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 sm:transform sm:-translate-x-4'>
          <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className='text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                  aria-label='Mark all notifications as read'
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter and Sort Controls */}
            <div className='flex space-x-2'>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className='text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
                aria-label='Filter notifications by type'
              >
                <option value='all'>All Types</option>
                <option value='asset'>Assets</option>
                <option value='transfer'>Transfers</option>
                <option value='issue'>Issues</option>
                <option value='user'>Users</option>
              </select>

              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className='text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
                aria-label='Sort notifications'
              >
                <option value='newest'>Newest First</option>
                <option value='oldest'>Oldest First</option>
              </select>
            </div>
          </div>

          <div className='max-h-96 overflow-y-auto'>
            {notifications.length === 0 ? (
              <div className='p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400'>
                <Bell className='w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600' />
                <p className='text-sm sm:text-base'>No notifications yet</p>
              </div>
            ) : (
              Object.entries(groupedNotifications).map(([date, items]) => (
                <div key={date}>
                  <div className='px-3 py-2 sm:px-4 sm:py-2 bg-gray-50 dark:bg-gray-700 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300'>
                    {date}
                  </div>
                  {items.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 sm:p-4 border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNotificationClick(notification.id);
                        }
                      }}
                      tabIndex={0}
                      role='button'
                      aria-label={`Notification: ${notification.message}. Click to expand details.`}
                    >
                      <div className='flex items-start space-x-2 sm:space-x-3'>
                        <div
                          className={`p-1.5 sm:p-2 rounded-full ${getActionColor(
                            notification.action_type,
                            notification.entity_type
                          )}`}
                        >
                          {getNotificationIcon(notification.entity_type)}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between'>
                            <p className='text-xs sm:text-sm text-gray-900 dark:text-white leading-tight'>
                              {notification.message}
                            </p>
                            <ChevronDown
                              className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                                isNotificationExpanded(notification.id)
                                  ? 'transform rotate-180'
                                  : ''
                              }`}
                            />
                          </div>
                          <div className='flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400'>
                            <Clock className='w-3 h-3 mr-1' />
                            {NotificationService.formatRelativeTime(notification.created_at)}
                          </div>
                          {isNotificationExpanded(notification.id) && (
                            <div className='mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-xs text-gray-700 dark:text-gray-300 space-y-2'>
                              <div className='flex items-center'>
                                <User className='w-3 h-3 mr-2 text-gray-500' />
                                <span>
                                  <strong>Performed by:</strong>{' '}
                                  {notification.actor_name || 'System'}
                                </span>
                              </div>
                              <div className='flex items-center'>
                                <Clock className='w-3 h-3 mr-2 text-gray-500' />
                                <span>
                                  <strong>Time:</strong>{' '}
                                  {new Date(notification.created_at).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div className='flex items-center'>
                                <Bell className='w-3 h-3 mr-2 text-gray-500' />
                                <span>
                                  <strong>Action:</strong>{' '}
                                  {notification.entity_type === notification.action_type
                                    ? `${notification.action_type}`
                                    : `${notification.action_type} on ${notification.entity_type}`}
                                </span>
                                {notification.entity_name && (
                                  <span>: {notification.entity_name}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {!notification.is_read && (
                          <div className='w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-1 sm:mt-2'></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {notifications.length > 5 && (
            <div className='p-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                onClick={() => setShowAll(prev => !prev)}
                className='w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                aria-label={showAll ? 'Show fewer notifications' : 'View all notifications'}
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

export default React.memo(NotificationBell);
