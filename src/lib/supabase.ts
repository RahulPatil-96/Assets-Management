import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please click "Connect to Supabase" in the top right.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type UserRole = 'HOD' | 'Lab Assistant' | 'Faculty';
export type IssueStatus = 'open' | 'resolved';
export type TransferStatus = 'pending' | 'received';

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
  remark?: string;
  allocated_lab: string;
  created_by?: string;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  creator?: UserProfile;
  approver?: UserProfile;
}

export interface AssetIssue {
  id: string;
  asset_id: string;
  issue_description: string;
  reported_by?: string;
  reported_at: string;
  status: IssueStatus;
  resolved_by?: string;
  resolved_at?: string;
  updated_at: string;
  asset?: Asset;
  reporter?: UserProfile;
  resolver?: UserProfile;
}

export interface AssetTransfer {
  id: string;
  asset_id: string;
  from_lab: string;
  to_lab: string;
  initiated_by?: string;
  initiated_at: string;
  received_by?: string;
  received_at?: string;
  status: TransferStatus;
  updated_at: string;
  asset?: Asset;
  initiator?: UserProfile;
  receiver?: UserProfile;
}