import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sendSupabasePing, shouldSendPing, PingResult } from '../lib/supabasePingService';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

interface Profile {
  id: string;
  email: string;
  lab_id: string;
  role: 'HOD' | 'Lab Assistant' | 'Lab Incharge';
  name: string;
}

interface PingStatus {
  lastPing: string | null;
  lastSuccess: string | null;
  lastError: string | null;
  isPinging: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  pingStatus: PingStatus;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  triggerPing: () => Promise<PingResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pingStatus, setPingStatus] = useState<PingStatus>({
    lastPing: null,
    lastSuccess: null,
    lastError: null,
    isPinging: false,
  });
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    let initialCleanupComplete = false;

    // Initialize auth state
    const initializeAuth = async () => {
      console.log('🔄 Initializing auth state...');
      
      // Check current auth state without signing out
      const { data: { session } } = await supabase.auth.getSession();
      
      if (isMounted) {
        if (session) {
          // This should only happen after explicit sign-in
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
          
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData as Profile);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
        initialCleanupComplete = true;
      }
    };

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', {
        event,
        hasSession: !!session,
        accessToken: session?.access_token ? 'Token exists' : 'No token'
      });

      if (!isMounted) return;

      // Skip processing events during initial cleanup
      if (!initialCleanupComplete) {
        console.log('⏭️ Skipping auth state change during initial cleanup');
        return;
      }

      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
        
        // Check if user profile exists
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();
          
        if (profileData) {
          setProfile(profileData as Profile);
        } else if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it using the RPC function
          console.log('📝 Creating user profile for new user');
          
          // Get user metadata from auth user
          const userMetadata = session.user.user_metadata;
          console.log('📋 User metadata:', userMetadata);
          
          try {
            const { data: rpcResult, error: rpcError } = await supabase
              .rpc('create_user_profile', {
                p_auth_id: session.user.id,
                p_email: session.user.email || '',
                p_role: userMetadata?.role || 'Lab Assistant',
                p_name: userMetadata?.name || '',
                p_lab_id: userMetadata?.labId || userMetadata?.lab_id || 'CSE-LAB-01'
              });
              
            console.log('📊 RPC call result:', { rpcResult, rpcError });
              
            if (rpcError) {
              console.log('❌ Failed to create user profile via RPC:', rpcError.message);
              console.log('📋 RPC error details:', rpcError);
              
              // Fallback: try direct insert with service role key
              console.log('🔄 Trying direct insert as fallback...');
              try {
                const { data: directInsertResult, error: directError } = await supabase
                  .from('user_profiles')
                  .insert([{
                    auth_id: session.user.id,
                    email: session.user.email || '',
                    role: (userMetadata?.role || 'Lab Assistant') as any,
                    name: userMetadata?.name || '',
                    lab_id: userMetadata?.labId || userMetadata?.lab_id || 'CSE-LAB-01'
                  }])
                  .select();
                  
                if (directError) {
                  console.log('❌ Direct insert also failed:', directError.message);
                } else if (directInsertResult && directInsertResult.length > 0) {
                  console.log('✅ User profile created via direct insert');
                  setProfile(directInsertResult[0] as Profile);
                }
              } catch (directError) {
                console.log('❌ Error in direct insert fallback:', directError);
              }
            } else {
              console.log('✅ User profile created successfully, profile ID:', rpcResult);
              
              // Fetch the newly created profile
              const { data: newProfile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('auth_id', session.user.id)
                .single();
                
              console.log('📊 Profile fetch result:', { newProfile, fetchError });
                
              if (newProfile) {
                setProfile(newProfile as Profile);
              } else if (fetchError) {
                console.log('❌ Error fetching created profile:', fetchError.message);
              }
            }
          } catch (rpcError) {
            console.log('❌ Error creating user profile:', rpcError);
          }
        } else if (profileError) {
          console.log('❌ Error fetching user profile:', profileError.message);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Initialize auth state on mount
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Setup ping interval when user is authenticated
  useEffect(() => {
    // Clear any existing interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Only setup ping interval if user is authenticated
    if (user) {
      console.log('🔔 Setting up Supabase ping interval (2 days)');
      
      // Check if we should send an immediate ping
      const lastPingTime = localStorage.getItem('supabase_last_ping');
      if (shouldSendPing(lastPingTime)) {
        triggerPing();
      }

      // Set up interval for future pings (2 days = 48 hours)
      const PING_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
      
      pingIntervalRef.current = setInterval(() => {
        triggerPing();
      }, PING_INTERVAL_MS);

      // Cleanup on unmount or when user changes
      return () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };
    }
  }, [user]);

  const triggerPing = async (): Promise<PingResult> => {
    if (!user) {
      console.log('⏭️ Skipping ping - no authenticated user');
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: 'No authenticated user',
      };
    }

    setPingStatus(prev => ({ ...prev, isPinging: true }));
    
    try {
      const result = await sendSupabasePing();
      
      setPingStatus(prev => ({
        ...prev,
        lastPing: result.timestamp,
        lastSuccess: result.success ? result.timestamp : prev.lastSuccess,
        lastError: result.error || prev.lastError,
        isPinging: false,
      }));

      // Store last ping time in localStorage
      if (result.success) {
        localStorage.setItem('supabase_last_ping', result.timestamp);
        console.log(`✅ Supabase ping stored: ${result.timestamp}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const timestamp = new Date().toISOString();
      
      setPingStatus(prev => ({
        ...prev,
        lastPing: timestamp,
        lastError: errorMessage,
        isPinging: false,
      }));

      console.error('❌ Supabase ping failed:', error);
      return {
        success: false,
        timestamp,
        error: errorMessage,
      };
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    console.log('🚀 Attempting sign-in for:', email, 'Remember me:', rememberMe);
    
    // Set session persistence based on remember me option
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data?.session) {
      console.log('✅ Sign-in successful - token generated:', {
        userId: data.session.user.id,
        accessToken: data.session.access_token ? 'Token exists' : 'No token',
        persistSession: rememberMe
      });
      
      // If remember me is false, we need to handle session persistence manually
      if (!rememberMe) {
        // For non-persistent sessions, we might need additional handling
        // Supabase handles this automatically based on the auth state
      }
    } else if (error) {
      console.log('❌ Sign-in failed:', error.message);
    }
    
    return { error };
  };

const signUp = async (email: string, password: string, metadata?: { name?: string; role?: string; labId?: string; }) => {
    console.log('📝 Attempting sign-up for:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (data?.user) {
      console.log('✅ Auth user created, waiting for email confirmation');
      // Show success notification
      toast.success('Confirmation email sent! Please check your inbox to verify your account.', {
        duration: 5000,
        position: 'top-right',
      });
      // Don't try to create profile immediately - wait for email confirmation
      // The profile will be created when the user confirms their email and signs in
    } else if (error) {
      console.log('❌ Sign-up failed:', error.message);
    }

    return { error };
  };

  const signOut = async () => {
    console.log('🚪 Attempting sign-out...');
    
    // Check if we have a valid session before attempting sign-out
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('⚠️ No active session found - clearing local state only');
      setUser(null);
      setProfile(null);
      return;
    }
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('❌ Sign-out failed:', error.message);
        throw error;
      } else {
        console.log('✅ Sign-out successful - session cleared');
      }
    } catch (error) {
      console.log('❌ Sign-out error:', error);
      // Even if sign-out fails, clear local state to prevent stuck auth
      setUser(null);
      setProfile(null);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    pingStatus,
    signIn,
    signUp,
    signOut,
    triggerPing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
