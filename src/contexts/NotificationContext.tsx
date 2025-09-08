import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { NotificationService, Notification } from '../lib/notificationService';
import { notificationSoundService } from '../lib/notificationSoundService';

import { NotificationContextType } from '../types/notification';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const recentNotificationIds = useRef(new Set<string>());

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [notificationsData, count] = await Promise.all([
        NotificationService.getNotifications(user.id),
        NotificationService.getUnreadCount(user.id),
      ]);

      setNotifications(notificationsData);
      setUnreadCount(count);
    } catch (_error) {
      // console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (_error) {
      // console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await NotificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (_error) {
      // console.error('Error marking all notifications as read:', error);
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Subscribe to real-time notifications
      const unsubscribe = NotificationService.subscribeToNotifications(user.id, newNotification => {
        // Check if this notification was recently processed to prevent duplicates
        if (recentNotificationIds.current.has(newNotification.id)) {
          return;
        }
        recentNotificationIds.current.add(newNotification.id);

        // Clean up old ids after 30 seconds
        setTimeout(() => {
          recentNotificationIds.current.delete(newNotification.id);
        }, 30000);

        setNotifications(prev => {
          // Check if notification already exists to prevent duplicates
          const exists = prev.some(notification => notification.id === newNotification.id);
          if (exists) return prev;
          return [newNotification, ...prev];
        });
        setUnreadCount(prevUnreadCount => {
          // Only increment if notification is new
          const exists = notifications.some(notification => notification.id === newNotification.id);
          return exists ? prevUnreadCount : prevUnreadCount + 1;
        });
        NotificationService.showToast(newNotification);
        // Play notification sound
        notificationSoundService.playNotification();
      });

      return unsubscribe;
    }
  }, [user, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
