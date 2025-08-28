import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

// Input validation function to prevent security vulnerabilities
const validateInput = (input: string, fieldName: string): void => {
  if (typeof input !== 'string') {
    throw new Error(`Invalid input type for ${fieldName}. Expected string.`);
  }

  // Basic validation to prevent SQL injection and other vulnerabilities
  const regex = /^[a-zA-Z0-9\s.,\-_@()]*$/; // Allow alphanumeric characters, spaces, and safe punctuation

  if (!regex.test(input)) {
    throw new Error(
      `Invalid characters in ${fieldName}. Only alphanumeric characters, spaces, and basic punctuation are allowed.`
    );
  }

  // Length validation
  if (input.length > 255) {
    throw new Error(`${fieldName} is too long. Maximum length is 255 characters.`);
  }
};

// Validate UUID format
const validateUUID = (uuid: string, fieldName: string): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error(`Invalid UUID format for ${fieldName}`);
  }
};

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor_name?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  old_values?: any;
  new_values?: any;
  created_at: string;
}

export class NotificationService {
  // Subscribe to real-time notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Get notifications for a user
  static async getNotifications(userId: string, limit: number = 20, offset: number = 0) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get actor names for notifications that have actor_id
    const notificationsWithActors = await Promise.all(
      (data || []).map(async notification => {
        if (notification.actor_id) {
          try {
            const { data: actorData } = await supabase
              .from('user_profiles')
              .select('name')
              .eq('id', notification.actor_id)
              .single();

            return {
              ...notification,
              actor_name: actorData?.name || '',
            };
          } catch (actorError) {
            console.warn('Failed to fetch actor name:', actorError);
            return {
              ...notification,
              actor_name: '',
            };
          }
        }
        return notification;
      })
    );

    return notificationsWithActors;
  }

  // Get unread notification count
  static async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Create manual notification for a specific user
  static async createNotification(
    userId: string,
    actorId: string,
    actionType: string,
    entityType: string,
    entityId: string,
    entityName: string
  ) {
    // Validate all inputs
    validateUUID(userId, 'userId');
    validateUUID(actorId, 'actorId');
    validateInput(actionType, 'actionType');
    validateInput(entityType, 'entityType');
    validateUUID(entityId, 'entityId');
    validateInput(entityName, 'entityName');

    const { data, error } = await supabase.rpc('create_notification', {
      action_type: actionType,
      entity_id: entityId,
      entity_name: entityName,
      entity_type: entityType,
      actor_id: actorId,
      target_auth_id: userId,
    });

    if (error) throw error;
    return data;
  }

  // Create notification for all users (all roles) - optimized to avoid duplicate sounds
  static async createNotificationForAllUsers(
    actorProfileId: string,
    actionType: string,
    entityType: string,
    entityId: string,
    entityName: string
  ) {
    // Validate all inputs
    validateUUID(actorProfileId, 'actorProfileId');
    validateInput(actionType, 'actionType');
    validateInput(entityType, 'entityType');
    validateUUID(entityId, 'entityId');
    validateInput(entityName, 'entityName');

    try {
      // Get the actor's auth_id from user_profiles table
      const { data: actorData, error: actorError } = await supabase
        .from('user_profiles')
        .select('auth_id')
        .eq('id', actorProfileId)
        .single();

      if (actorError) throw actorError;

      // Use the existing create_notification function for each notification
      const { error } = await supabase.rpc('create_notification', {
        action_type: actionType,
        entity_id: entityId,
        entity_name: entityName,
        entity_type: entityType,
        actor_id: actorData.auth_id,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      // Log the error and show a toast notification
      console.error('Error creating notifications for all users:', error);
      toast.error('Failed to create notifications. Please try again later.');
      throw error;
    }
  }

  // Show toast notification with color differentiation
  static showToast(notification: Notification) {
    const actionIcon = {
      created: '🆕',
      updated: '✏️',
      deleted: '🗑️',
      transferred: '📦',
      approved: '✅',
      rejected: '❌',
    };

    const icon = actionIcon[notification.action_type as keyof typeof actionIcon] || '📢';
    const toastColor = this.getToastColor(notification.action_type);

    toast(`${icon} ${notification.message}`, {
      duration: 4000,
      position: 'top-right',
      style: {
        backgroundColor: toastColor,
        color: 'white',
      },
    });
  }

  // Get toast color based on action type
  static getToastColor(actionType: string) {
    switch (actionType) {
      case 'created':
        return '#38a169'; // green
      case 'updated':
        return '#3182ce'; // blue
      case 'deleted':
        return '#e53e3e'; // red
      case 'transferred':
        return '#805ad5'; // purple
      case 'approved':
        return '#38a169'; // green
      case 'rejected':
        return '#e53e3e'; // red
      default:
        return ''; // default color
    }
  }

  // Format relative time
  static formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  // Group notifications by date
  static groupNotificationsByDate(notifications: Notification[]) {
    const groups: { [key: string]: Notification[] } = {};

    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(notification);
    });

    return groups;
  }
}
