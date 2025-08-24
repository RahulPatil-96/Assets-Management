// Debug utilities for sign-up issues
export const debugSignUp = async (email: string, password: string, userData: any) => {
  console.group('🔍 Sign-up Debug Information');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('VITE_SUPABASE_URL exists:', !!import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  
  // Check Supabase connection
  console.log('🔗 Supabase Connection:');
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Connection test:', error ? '❌ Failed' : '✅ Success');
    if (error) console.error('Connection error:', error);
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
  
  // Test sign-up
  console.log('🚀 Sign-up Test:');
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) {
      console.error('❌ Sign-up error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return { success: false, error };
    } else {
      console.log('✅ Sign-up successful:', data);
      return { success: true, data };
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { success: false, error: err };
  }
  
  console.groupEnd();
};

// Check database triggers
export const checkDatabaseTriggers = async () => {
  console.group('🗄️ Database Check');
  
  try {
    // Check if user_profiles table exists
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    console.log('user_profiles table:', profilesError ? '❌ Error' : '✅ Accessible');
    if (profilesError) console.error('Profiles error:', profilesError);
    
    // Check auth.users table
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('count')
      .limit(1);
    
    console.log('auth.users table:', usersError ? '❌ Error' : '✅ Accessible');
    if (usersError) console.error('Users error:', usersError);
      
  } catch (err) {
    console.error('❌ Database check failed:', err);
  }
  
  console.groupEnd();
};

// Validate form data
export const validateSignUpData = (email: string, password: string, name: string, role: string, labId: string) => {
  const errors = [];
  
  if (!email || !email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!role) {
    errors.push('Role is required');
  }
  
  if (!labId) {
    errors.push('Lab ID is required');
  }
  
  return errors;
};
