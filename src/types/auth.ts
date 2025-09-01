import { ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

export interface Profile {
  id: string;
  email: string;
  lab_id: string;
  lab_name?: string;
  role: 'HOD' | 'Lab Assistant' | 'Lab Incharge';
  name: string;
}

export interface PingStatus {
  lastPing: string | null;
  lastSuccess: string | null;
  lastError: string | null;
  isPinging: boolean;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  pingStatus: PingStatus;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: unknown }>;
  signUp: (
    email: string,
    password: string,
    metadata?: { name?: string; role?: string; labName?: string; lab_id?: string }
  ) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  triggerPing: () => Promise<{ success: boolean; timestamp: string; error?: string }>;
  updateUserLab: (newLabId: string) => Promise<boolean>;
}

export interface AuthProviderProps {
  children: ReactNode;
}
