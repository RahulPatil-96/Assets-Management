import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please click "Connect to Supabase" in the top right.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: sessionStorage,
  },
});

// Admin client for operations requiring service role (use with caution)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        storage: sessionStorage,
      },
    })
  : null;

// Database types
export type UserRole = 'HOD' | 'Lab Assistant' | 'Lab Incharge';
export type IssueStatus = 'open' | 'resolved' | 'ticket_raised';
export type TransferStatus = 'pending' | 'approved' | 'received';

export interface UserProfile {
  id: string;
  auth_id: string;
  role: UserRole;
  name: string;
  lab_id: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  sr_no: number;
  date: string;
  name_of_supply: string;
  asset_type: string;
  invoice_number?: string;
  description?: string;
  quantity: number;
  rate: number;
  total_amount: number;
  asset_id?: string;
  remark?: string;
  is_consumable?: boolean;
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

export interface AssetIssue {
  lab_name: string | undefined;
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

export interface Lab {
  id: string;
  name: string;
  description?: string;
  location: string;
  lab_identifier: string;
  created_at: string;
  updated_at: string;
}

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
  from_lab_data?: Lab;
  to_lab_data?: Lab;
}
