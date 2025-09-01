import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sendSupabasePing, shouldSendPing, PingResult } from '../lib/supabasePingService';
import { LabService } from '../lib/labService';
import { toast } from 'react-hot-toast';
import { AuthContextType, User, Profile, PingStatus } from '../types/auth';

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
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper function to enrich profile with lab_name for Lab Assistant and Lab Incharge
  const enrichProfileWithLabName = async (rawProfile: any): Promise<Profile> => {
    const profile = rawProfile as Profile;
    if ((profile.role === 'Lab Assistant' || profile.role === 'Lab Incharge') && profile.lab_id) {
      try {
        const lab = await LabService.getLab(profile.lab_id);
        if (lab) {
          profile.lab_name = lab.name;
        }
      } catch (error) {
        // console.error('Error fetching lab name:', error);
      }
    }
    return profile;
  };

  useEffect(() => {
    let isMounted = true;
    let initialCleanupComplete = false;

    // Initialize auth state
    const initializeAuth = async () => {
      // console.log('🔄 Initializing auth state...');

      // Check current auth state without signing out
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        if (session) {
          // This should only happen after explicit sign-in
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });

          // console.log('🔍 Fetching user profile for auth_id:', session.user.id);
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (profileData) {
            const enrichedProfile = await enrichProfileWithLabName(profileData);
            setProfile(enrichedProfile);
          } else if (profileError) {
            // console.log('❌ Error fetching profile:', profileError.message);
            // console.log('📋 Profile error details:', profileError);
          }
        } else {
          // console.log('⚠️ No active session found');
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
        initialCleanupComplete = true;
      }
    };

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      // Skip processing events during initial cleanup
      if (!initialCleanupComplete) {
        // console.log('⏭️ Skipping auth state change during initial cleanup');
        return;
      }

      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });

        // Check if user profile exists
        // console.log('🔍 Checking user profile for auth_id:', session.user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();

        if (profileData) {
          const enrichedProfile = await enrichProfileWithLabName(profileData);
          setProfile(enrichedProfile);
        } else if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it using the RPC function
          // console.log('📝 Creating user profile for new user');

          // Get user metadata from auth user
          const userMetadata = session.user.user_metadata;
          // console.log('📋 User metadata:', userMetadata);

          // Compute lab_id
          const providedLabId = userMetadata?.lab_id;
          let lab_id;
          if (providedLabId && providedLabId !== '') {
            lab_id = providedLabId;
          } else if (userMetadata?.role === 'HOD') {
            lab_id = null;
          } else {
            lab_id = await (async () => {
              try {
                const labs = await LabService.getLabs();
                return labs[0]?.id || null;
              } catch {
                return null;
              }
            })();
          }

          // Check if profile with this email already exists
          const { data: existingProfile, error: checkError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', session.user.email || '')
            .single();

          let profileUpdated = false;
          if (existingProfile && !checkError) {
            // Validate and prepare the role
            const validRoles = ['HOD', 'Lab Assistant', 'Lab Incharge'];
            const newRole =
              userMetadata?.role && validRoles.includes(userMetadata.role)
                ? userMetadata.role
                : existingProfile.role;

            // Update the existing profile with the new auth_id and other metadata
            const { data: updatedProfile, error: updateError } = await supabase
              .from('user_profiles')
              .update({
                auth_id: session.user.id,
                role: newRole as any,
                name: userMetadata?.name || existingProfile.name,
                lab_id:
                  userMetadata?.lab_id && userMetadata.lab_id !== ''
                    ? userMetadata.lab_id
                    : existingProfile.lab_id,
              })
              .eq('id', existingProfile.id)
              .select()
              .single();

            if (updatedProfile && !updateError) {
              // console.log('✅ Existing user profile updated with new auth_id and metadata');
              const enrichedProfile = await enrichProfileWithLabName(updatedProfile);
              setProfile(enrichedProfile);
              profileUpdated = true;
            } else {
              // console.log('❌ Failed to update existing profile:', updateError?.message);
            }
          }

          if (!profileUpdated) {
            try {
              const { data: _rpcResult, error: _rpcError } = await supabase.rpc(
                'create_user_profile',
                {
                  p_auth_id: session.user.id,
                  p_email: session.user.email || '',
                  p_role: userMetadata?.role || 'Lab Assistant',
                  p_name: userMetadata?.name || '',
                  p_lab_id: lab_id,
                }
              );

              // console.log('📊 RPC call result:', { rpcResult: _rpcResult, rpcError: _rpcError });

              if (_rpcError) {
                // console.log('❌ Failed to create user profile via RPC:', _rpcError.message);
                // console.log('📋 RPC error details:', _rpcError);

                // Fallback: try direct insert with service role key
                // console.log('🔄 Trying direct insert as fallback...');
                try {
                  // Check if profile with this email already exists
                  const { data: existingProfile, error: checkError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('email', session.user.email || '')
                    .single();

                  if (existingProfile && !checkError) {
                    // Validate and prepare the role
                    const validRoles = ['HOD', 'Lab Assistant', 'Lab Incharge'];
                    const newRole =
                      userMetadata?.role && validRoles.includes(userMetadata.role)
                        ? userMetadata.role
                        : existingProfile.role;

                    // Update the existing profile with the new auth_id and other metadata
                    const { data: updatedProfile, error: updateError } = await supabase
                      .from('user_profiles')
                      .update({
                        auth_id: session.user.id,
                        role: newRole as any,
                        name: userMetadata?.name || existingProfile.name,
                        lab_id:
                          userMetadata?.lab_id && userMetadata.lab_id !== ''
                            ? userMetadata.lab_id
                            : existingProfile.lab_id,
                      })
                      .eq('id', existingProfile.id)
                      .select()
                      .single();

                    if (updatedProfile && !updateError) {
                      const enrichedProfile = await enrichProfileWithLabName(updatedProfile);
                      setProfile(enrichedProfile);
                    } else {
                    }
                  } else {
                    // No existing profile, proceed with insert
                    const { data: directInsertResult, error: directError } = await supabase
                      .from('user_profiles')
                      .insert([
                        {
                          auth_id: session.user.id,
                          email: session.user.email || '',
                          role: (userMetadata?.role || 'Lab Assistant') as any,
                          name: userMetadata?.name || '',
                          lab_id,
                        },
                      ])
                      .select();

                    if (directError) {
                      // console.log('❌ Direct insert also failed:', directError.message);
                    } else if (directInsertResult && directInsertResult.length > 0) {
                      // console.log('✅ User profile created via direct insert');
                      const enrichedProfile = await enrichProfileWithLabName(directInsertResult[0]);
                      setProfile(enrichedProfile);
                    }
                  }
                } catch (_directError) {
                  // console.log('❌ Error in direct insert fallback:', _directError);
                }
              } else {
                // console.log('✅ User profile created successfully, profile ID:', _rpcResult);

                // Fetch the newly created profile
                const { data: newProfile, error: fetchError } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('auth_id', session.user.id)
                  .single();

                // console.log('📊 Profile fetch result:', { newProfile, fetchError });

                if (newProfile) {
                  const enrichedProfile = await enrichProfileWithLabName(newProfile);
                  setProfile(enrichedProfile);
                } else if (fetchError) {
                  // console.log('❌ Error fetching created profile:', fetchError.message);
                }
              }
            } catch (_rpcError) {
              // console.log('❌ Error creating user profile:', _rpcError);
            }
          } else if (profileError) {
            // console.log('❌ Error fetching user profile:', profileError.message);
            // console.log('📋 Profile error details:', profileError);
          }
        } else {
          // console.log('⚠️ No session found - clearing user and profile');
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      }
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
      // console.log('🔔 Setting up Supabase ping interval (2 days)');

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
      // console.log('⏭️ Skipping ping - no authenticated user');
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
        // console.log(`✅ Supabase ping stored: ${result.timestamp}`);
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

      // console.error('❌ Supabase ping failed:', error);
      return {
        success: false,
        timestamp,
        error: errorMessage,
      };
    }
  };

  const signIn = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ error: unknown }> => {
    // Set session persistence based on remember me option
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data?.session) {
      // If remember me is false, we need to handle session persistence manually
      if (!rememberMe) {
        // For non-persistent sessions, we might need additional handling
        // Supabase handles this automatically based on the auth state
      }
    } else if (error) {
      // console.log('❌ Sign-in failed:', error.message);
    }

    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { name?: string; role?: string; lab_id?: string }
  ): Promise<{ error: unknown }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (data?.user) {
      // Show success notification
      toast.success('Confirmation email sent! Please check your inbox to verify your account.', {
        duration: 5000,
        position: 'top-right',
      });
    }

    return { error };
  };

  const signOut = async () => {
    // console.log('🚪 Attempting sign-out...');

    // Check if we have a valid session before attempting sign-out
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      // console.log('⚠️ No active session found - clearing local state only');
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // console.log('❌ Sign-out failed:', error.message);
        throw error;
      } else {
        // console.log('✅ Sign-out successful - session cleared');
      }
    } catch (error) {
      // console.log('❌ Sign-out error:', error);
      // Even if sign-out fails, clear local state to prevent stuck auth
      setUser(null);
      setProfile(null);
      throw error;
    }
  };

  // Function to update user's lab_id in profile
  const updateUserLab = async (newLabId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ lab_id: newLabId })
        .eq('auth_id', user.id)
        .select()
        .single();
      if (error) {
        // console.error('Error updating user lab:', error);
        return false;
      }
      if (data) {
        const enrichedProfile = await enrichProfileWithLabName(data);
        setProfile(enrichedProfile);
        return true;
      }
      return false;
    } catch (err) {
      // console.error('Exception updating user lab:', err);
      return false;
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
    updateUserLab,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
