import { supabase } from './supabase';

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  old_values?: any;
  new_values?: any;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  severity_level: 'info' | 'warning' | 'error' | 'critical';
  success: boolean;
  error_message?: string;
  processing_time_ms?: number;
  metadata?: any;
  created_at: string;
}

export interface ActivityLogStats {
  total_activities: number;
  successful_activities: number;
  failed_activities: number;
  top_action_types: Record<string, number>;
  top_entity_types: Record<string, number>;
  error_rate: number;
}

export interface ActivityLogFilters {
  userId?: string;
  actionType?: string;
  entityType?: string;
  severityLevel?: 'info' | 'warning' | 'error' | 'critical';
  success?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class ActivityLogService {
  // Log a single activity
  static async logActivity(
    actionType: string,
    entityType: string,
    entityId?: string,
    entityName?: string,
    oldValues?: any,
    newValues?: any,
    severityLevel: 'info' | 'warning' | 'error' | 'critical' = 'info',
    success: boolean = true,
    errorMessage?: string,
    metadata?: any
  ): Promise<string> {
    const { data, error } = await supabase.rpc('log_activity', {
      p_action_type: actionType,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_entity_name: entityName,
      p_old_values: oldValues,
      p_new_values: newValues,
      p_severity_level: severityLevel,
      p_success: success,
      p_error_message: errorMessage,
      p_metadata: metadata || {},
    });

    if (error) throw error;
    return data;
  }

  // Log multiple activities at once
  static async logBulkActivities(
    activities: Array<{
      actionType: string;
      entityType: string;
      entityId?: string;
      entityName?: string;
      oldValues?: any;
      newValues?: any;
      severityLevel?: 'info' | 'warning' | 'error' | 'critical';
      success?: boolean;
      errorMessage?: string;
      metadata?: any;
    }>
  ): Promise<number> {
    const logs = activities.map(activity => ({
      action_type: activity.actionType,
      entity_type: activity.entityType,
      entity_id: activity.entityId,
      entity_name: activity.entityName,
      old_values: activity.oldValues,
      new_values: activity.newValues,
      severity_level: activity.severityLevel || 'info',
      success: activity.success ?? true,
      error_message: activity.errorMessage,
      metadata: activity.metadata || {},
    }));

    const { data, error } = await supabase.rpc('log_bulk_activities', { p_logs: logs });

    if (error) throw error;
    return data;
  }

  // Get activity logs with filters
  static async getActivityLogs(filters: ActivityLogFilters = {}): Promise<ActivityLog[]> {
    let query = supabase
      .from('enhanced_activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType);
    }

    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }

    if (filters.severityLevel) {
      query = query.eq('severity_level', filters.severityLevel);
    }

    if (filters.success !== undefined) {
      query = query.eq('success', filters.success);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get activity logs summary view
  static async getActivityLogsSummary(limit: number = 50, offset: number = 0): Promise<any[]> {
    const { data, error } = await supabase
      .from('activity_logs_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get activity statistics
  static async getActivityStats(userId?: string, days: number = 30): Promise<ActivityLogStats> {
    const { data, error } = await supabase.rpc('get_activity_stats', {
      p_user_id: userId,
      p_days: days,
    });

    if (error) throw error;
    return data;
  }

  // Get activity logs for a specific entity
  static async getEntityActivityLogs(
    entityType: string,
    entityId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('enhanced_activity_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Clean old logs (for maintenance)
  static async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    const { data, error } = await supabase.rpc('clean_old_logs', { p_days_to_keep: daysToKeep });

    if (error) throw error;
    return data;
  }

  // Log user login activity
  static async logUserLogin(userAgent?: string, ipAddress?: string): Promise<string> {
    return this.logActivity(
      'login',
      'user',
      undefined,
      'User Login',
      undefined,
      undefined,
      'info',
      true,
      undefined,
      {
        user_agent: userAgent,
        ip_address: ipAddress,
        description: 'User successfully logged in',
      }
    );
  }

  // Log user logout activity
  static async logUserLogout(): Promise<string> {
    return this.logActivity(
      'logout',
      'user',
      undefined,
      'User Logout',
      undefined,
      undefined,
      'info',
      true,
      undefined,
      { description: 'User logged out' }
    );
  }

  // Log failed login attempt
  static async logFailedLogin(
    errorMessage: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<string> {
    return this.logActivity(
      'login_failed',
      'user',
      undefined,
      'Failed Login',
      undefined,
      undefined,
      'warning',
      false,
      errorMessage,
      {
        user_agent: userAgent,
        ip_address: ipAddress,
        description: 'Failed login attempt',
      }
    );
  }

  // Log asset creation
  static async logAssetCreation(
    assetId: string,
    assetName: string,
    assetData: any
  ): Promise<string> {
    return this.logActivity(
      'create',
      'asset',
      assetId,
      assetName,
      undefined,
      assetData,
      'info',
      true,
      undefined,
      { description: `Asset created: ${assetName}` }
    );
  }

  // Log asset update
  static async logAssetUpdate(
    assetId: string,
    assetName: string,
    oldData: any,
    newData: any
  ): Promise<string> {
    return this.logActivity(
      'update',
      'asset',
      assetId,
      assetName,
      oldData,
      newData,
      'info',
      true,
      undefined,
      { description: `Asset updated: ${assetName}` }
    );
  }

  // Log asset deletion
  static async logAssetDeletion(
    assetId: string,
    assetName: string,
    assetData: any
  ): Promise<string> {
    return this.logActivity(
      'delete',
      'asset',
      assetId,
      assetName,
      assetData,
      undefined,
      'warning',
      true,
      undefined,
      { description: `Asset deleted: ${assetName}` }
    );
  }

  // Log issue creation
  static async logIssueCreation(issueId: string, assetId: string, issueData: any): Promise<string> {
    return this.logActivity(
      'create',
      'issue',
      issueId,
      issueData.title || `Issue #${issueId}`,
      undefined,
      issueData,
      'info',
      true,
      undefined,
      {
        description: `Issue created for asset: ${assetId}`,
        asset_id: assetId,
      }
    );
  }

  // Log transfer creation
  static async logTransferCreation(
    transferId: string,
    assetId: string,
    transferData: any
  ): Promise<string> {
    return this.logActivity(
      'create',
      'transfer',
      transferId,
      `Transfer #${transferId}`,
      undefined,
      transferData,
      'info',
      true,
      undefined,
      {
        description: `Transfer initiated from ${transferData.from_lab} to ${transferData.to_lab}`,
        asset_id: assetId,
      }
    );
  }

  // Log error with context
  static async logError(
    actionType: string,
    entityType: string,
    errorMessage: string,
    entityId?: string,
    entityName?: string,
    metadata?: any
  ): Promise<string> {
    return this.logActivity(
      actionType,
      entityType,
      entityId,
      entityName,
      undefined,
      undefined,
      'error',
      false,
      errorMessage,
      { ...metadata, description: `Error occurred during ${actionType}` }
    );
  }

  // Log warning with context
  static async logWarning(
    actionType: string,
    entityType: string,
    warningMessage: string,
    entityId?: string,
    entityName?: string,
    metadata?: any
  ): Promise<string> {
    return this.logActivity(
      actionType,
      entityType,
      entityId,
      entityName,
      undefined,
      undefined,
      'warning',
      true,
      warningMessage,
      { ...metadata, description: `Warning during ${actionType}` }
    );
  }

  // Get recent activity for dashboard
  static async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    return this.getActivityLogs({ limit });
  }

  // Get user activity timeline
  static async getUserActivityTimeline(userId: string, limit: number = 20): Promise<ActivityLog[]> {
    return this.getActivityLogs({ userId, limit });
  }

  // Search activity logs
  static async searchActivityLogs(searchTerm: string, limit: number = 20): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('enhanced_activity_logs')
      .select('*')
      .or(
        `entity_name.ilike.%${searchTerm}%,error_message.ilike.%${searchTerm}%,metadata->>description.ilike.%${searchTerm}%`
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}
