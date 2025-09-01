/**
 * Centralized TypeScript types and interfaces for the Lab Management System
 */

/** User roles */
export type UserRole = 'HOD' | 'Lab Assistant' | 'Lab Incharge';

/** Issue status */
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/** Transfer status */
export type TransferStatus = 'pending' | 'approved' | 'received';

/** User profile */
export interface UserProfile {
  id: string;
  auth_id: string;
  role: UserRole;
  name: string;
  lab_id: string;
  created_at: string;
  updated_at: string;
}

/** Lab entity */
export interface Lab {
  id: string;
  name: string;
  description: string;
  location: string;
  lab_identifier: string;
  staff_count?: number;
  asset_count?: number;
  open_issues_count?: number;
  created_at: string;
  updated_at: string;
}

/** Asset entity */
export interface Asset {
  id: string;
  sr_no: number;
  date: string;
  name_of_supply: string;
  asset_type: string;
  invoice_number?: string;
  description?: string;
  quantity?: number; // Made optional as quantity field removed from form
  rate: number;
  total_amount: number;
  asset_id?: string;
  remark?: string;
  allocated_lab: string;
  created_by?: string;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  approved_by_lab_incharge?: string;
  approved_at_lab_incharge?: string;
  created_at: string;
  updated_at: string;
  creator?: UserProfile;
  approver?: UserProfile;
  approver_lab_incharge?: UserProfile;
}

/** Lab issue */
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
  status: IssueStatus;
  remark?: string;
  created_at: string;
  updated_at: string;
}

/** Asset issue */
export interface AssetIssue {
  lab_name?: string;
  id: string;
  asset_id: string;
  issue_description: string;
  reported_by?: string;
  reported_at: string;
  remark?: string;
  cost_required?: number;
  status: IssueStatus;
  resolved_by?: string;
  resolved_at?: string;
  updated_at: string;
  asset?: Asset;
  reporter?: UserProfile;
  resolver?: UserProfile;
}

/** Asset transfer */
export interface AssetTransfer {
  id: string;
  asset_id: string;
  from_lab: string;
  to_lab: string;
  initiated_by?: string;
  initiated_at: string;
  approved_by_lab_incharge?: string;
  approved_at_lab_incharge?: string;
  received_by?: string;
  received_at?: string;
  status: TransferStatus;
  updated_at: string;
  asset?: Asset;
  initiator?: UserProfile;
  receiver?: UserProfile;
}

/** Lab staff */
export interface LabStaff {
  id: string;
  lab_id: string;
  user_id: string;
  role: 'assistant';
  assigned_at: string;
  user_name?: string;
  user_role?: string;
}

/** Lab permission */
export interface LabPermission {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageStaff: boolean;
  canManageIssues: boolean;
  canViewAssets: boolean;
}

/** Lab access */
export interface LabAccess {
  lab_id: string;
  lab_name: string;
  user_role: string;
  lab_role: 'assistant';
  assigned_at: string;
}

/** Create lab request */
export interface CreateLabRequest {
  name: string;
  description?: string;
  location?: string;
  lab_identifier: string;
}

/** Update lab request */
export interface UpdateLabRequest {
  name?: string;
  description?: string;
  location?: string;
  lab_identifier?: string;
}

/** Create lab issue request */
export interface CreateLabIssueRequest {
  lab_id: string;
  title: string;
  description: string;
  issue_type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
}

/** Update lab issue request */
export interface UpdateLabIssueRequest {
  title?: string;
  description?: string;
  issue_type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  status?: IssueStatus;
  remark?: string;
}

/** Assign staff request */
export interface AssignStaffRequest {
  user_id: string;
  role: 'assistant';
}

/** Lab filters */
export interface LabFilters {
  search?: string;
  location?: string;
  has_open_issues?: boolean;
  sort_by?: 'name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

/** Lab issue filters */
export interface LabIssueFilters {
  lab_id?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  reported_by?: string;
  sort_by?: 'created_at' | 'updated_at' | 'priority';
  sort_order?: 'asc' | 'desc';
}
