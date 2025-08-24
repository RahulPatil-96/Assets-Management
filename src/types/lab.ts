// Lab Management System Types

export interface Lab {
  id: string;
  name: string;
  description: string;
  location: string;
  incharge_id: string;
  incharge_name?: string;
  incharge_role?: string;
  staff_count?: number;
  asset_count?: number;
  open_issues_count?: number;
  created_at: string;
  updated_at: string;
}

export interface LabStaff {
  id: string;
  lab_id: string;
  user_id: string;
  role: 'incharge' | 'assistant' | 'faculty';
  assigned_at: string;
  user_name?: string;
  user_role?: string;
}

export interface LabIssue {
  id: string;
  lab_id: string;
  title: string;
  description: string;
  issue_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reported_by: string;
  reported_by_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface LabPermission {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageStaff: boolean;
  canManageIssues: boolean;
  canViewAssets: boolean;
}

export interface LabAccess {
  lab_id: string;
  lab_name: string;
  user_role: string;
  lab_role: 'incharge' | 'assistant' | 'faculty';
  assigned_at: string;
}

export interface CreateLabRequest {
  name: string;
  description?: string;
  location?: string;
  incharge_id?: string;
}

export interface UpdateLabRequest {
  name?: string;
  description?: string;
  location?: string;
  incharge_id?: string;
}

export interface CreateLabIssueRequest {
  lab_id: string;
  title: string;
  description: string;
  issue_type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
}

export interface UpdateLabIssueRequest {
  title?: string;
  description?: string;
  issue_type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
}

export interface AssignStaffRequest {
  user_id: string;
  role: 'incharge' | 'assistant' | 'faculty';
}

export interface LabFilters {
  search?: string;
  location?: string;
  incharge_id?: string;
  has_open_issues?: boolean;
  sort_by?: 'name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface LabIssueFilters {
  lab_id?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  reported_by?: string;
  sort_by?: 'created_at' | 'updated_at' | 'priority';
  sort_order?: 'asc' | 'desc';
}
