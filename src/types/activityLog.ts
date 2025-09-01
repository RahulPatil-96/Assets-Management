export interface ActivityLogValues {
  [key: string]: unknown;
}

export interface ActivityLogMetadata {
  [key: string]: unknown;
  description?: string;
  user_agent?: string;
  ip_address?: string;
  asset_id?: string;
}

export interface ActivityLogSummary {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  severity_level: 'info' | 'warning' | 'error' | 'critical';
  success: boolean;
  error_message?: string;
  created_at: string;
  description?: string;
}

export interface AssetData {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface IssueData {
  id: string;
  title?: string;
  [key: string]: unknown;
}

export interface TransferData {
  id: string;
  from_lab: string;
  to_lab: string;
  [key: string]: unknown;
}
