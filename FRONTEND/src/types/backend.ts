// Backend API response types and interfaces matching the backend schema

export interface BackendUser {
  user_id: string;
  name: string;
  email: string;
  role: 'lab_assistant' | 'assistant professor' | 'hod' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface BackendAsset {
  item_id: string;
  name: string;
  description: string;
  lab: string;
  issue: string;
  current_status: 'active' | 'maintenance' | 'retired' | 'disposed' | 'missing';
  category?: string;
  make?: string;
  model?: string;
  serial_number?: string;
  asset_tag?: string;
  barcode?: string;
  qr_code?: string;
  purchase_date?: string;
  purchase_cost?: number;
  purchase_order?: string;
  vendor?: string;
  condition_status?: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair';
  warranty_expiry?: string;
  warranty_provider?: string;
  building?: string;
  department?: string;
  room?: string;
  floor?: string;
  custodian?: string;
  assigned_to?: string;
  specifications?: Record<string, any>;
  photos?: string[];
  documents?: string[];
  tags?: string[];
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface AuthResponse {
  token: string;
  user: BackendUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Backend API endpoints
export const API_ENDPOINTS = {
  auth: {
    signup: '/auth/signup',
    signin: '/auth/signin',
  },
  inventory: {
    assets: '/inventory',
    asset: (id: string) => `/inventory/${id}`,
    summary: '/inventory/summary',
  },
} as const;
