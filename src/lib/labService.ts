import { supabase, supabaseAdmin } from './supabase';
import { PasswordService } from './passwordService';
import {
  Lab,
  LabIssue,
  CreateLabRequest,
  UpdateLabRequest,
  CreateLabIssueRequest,
  UpdateLabIssueRequest,
  LabFilters,
  LabIssueFilters,
  LabAccess,
  Asset,
} from '../types';

// Lab Management Service
export class LabService {
  // Lab CRUD operations
  static async getLabs(filters?: LabFilters): Promise<Lab[]> {
    let query = supabase.from('labs').select(`*`);

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    // Removed incharge_id filter as labs no longer have incharge
    // Removed has_open_issues filter as open_issues_count column doesn't exist

    const sortBy = filters?.sort_by || 'name';
    const sortOrder = filters?.sort_order || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getLab(id: string): Promise<Lab | null> {
    const { data, error } = await supabase.from('labs').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  }

  static async getLabByIdentifier(lab_identifier: string): Promise<Lab | null> {
    const { data, error } = await supabase
      .from('labs')
      .select('*')
      .eq('lab_identifier', lab_identifier)
      .single();

    if (error) throw error;
    return data;
  }

  static async getLabIdentifier(labId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('labs')
      .select('lab_identifier')
      .eq('id', labId)
      .single();

    if (error) throw error;
    return data?.lab_identifier || null;
  }

  static async createLab(lab: CreateLabRequest): Promise<Lab> {
    // Create the lab first
    const { data: labData, error: labError } = await supabase
      .from('labs')
      .insert({
        name: lab.name,
        description: lab.description,
        location: lab.location,
        lab_identifier: lab.lab_identifier
      })
      .select()
      .single();

    if (labError) throw labError;

    // Helper function to create user account and profile
    const createUserAccount = async (user: { name: string; email: string; password: string }, role: string) => {
      if (!user.name || !user.email || !user.password) {
        throw new Error(`Missing required fields for ${role} creation`);
      }

      // Validate email format
      if (!PasswordService.validateEmail(user.email)) {
        throw new Error(`Invalid email format for ${role}: ${user.email}`);
      }

      // Validate password strength
      const passwordValidation = PasswordService.validatePassword(user.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed for ${role}: ${passwordValidation.errors.join(', ')}`);
      }

      // Check if user already exists by email
      const { data: existingUser, error: existingUserError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw existingUserError;
      }
      if (existingUser) {
        throw new Error(`User with email ${user.email} already exists`);
      }

      // Create auth user without email confirmation for lab staff created by HOD
      let userId: string | null = null;

      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not configured. Please set VITE_SUPABASE_SERVICE_ROLE_KEY environment variable.');
      }

      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true, // Auto-confirm the email
          user_metadata: {
            name: user.name,
            role: role,
            lab_id: labData.id
          }
        });

        if (authError) throw authError;
        userId = authData?.user?.id || null;
      } catch (adminError) {
        console.error('Admin API failed:', (adminError as Error).message);
        throw new Error(`Failed to create user account: ${(adminError as Error).message}`);
      }

      if (!userId) {
        throw new Error('Failed to get user ID after creating auth user');
      }

      // Create user profile
      const { error: profileError } = await supabase.rpc('create_user_profile', {
        p_auth_id: userId,
        p_email: user.email,
        p_role: role,
        p_name: user.name,
        p_lab_id: labData.id
      });

      if (profileError) throw profileError;
    };

    // Create lab assistant account if provided
    if (lab.lab_assistant) {
      try {
        await createUserAccount(lab.lab_assistant, 'Lab Assistant');
      } catch (error) {
        console.error('Failed to create lab assistant account:', error);
        throw new Error(`Failed to create lab assistant account: ${error instanceof Error ? error.message : error}`);
      }
    }

    // Create lab incharge account if provided
    if (lab.lab_incharge) {
      try {
        await createUserAccount(lab.lab_incharge, 'Lab Incharge');
      } catch (error) {
        console.error('Failed to create lab incharge account:', error);
        throw new Error(`Failed to create lab incharge account: ${error instanceof Error ? error.message : error}`);
      }
    }

    return labData;
  }

  static async updateLab(id: string, updates: UpdateLabRequest): Promise<Lab> {
    const { data, error } = await supabase
      .from('labs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteLab(id: string): Promise<void> {
    // First, get all user profiles associated with this lab
    const { data: labUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('lab_id', id);

    if (usersError) throw usersError;

    // Delete each user profile using the database function for proper cleanup
    if (labUsers && labUsers.length > 0) {
      for (const user of labUsers) {
        const { error: deleteUserError } = await supabase.rpc('delete_user_profile', {
          p_user_id: user.id
        });

        if (deleteUserError) throw deleteUserError;
      }
    }

    // Finally, delete the lab
    const { error } = await supabase.from('labs').delete().eq('id', id);

    if (error) throw error;
  }



  // Lab Issues Management (using asset_issues table)
  static async getLabIssues(filters?: LabIssueFilters): Promise<LabIssue[]> {
    let query = supabase.from('asset_issues').select(`
        *,
        asset:assets(id, name_of_supply, lab_id),
        reported_by_user:user_profiles!reported_by(id, name),
        assigned_to_user:user_profiles!assigned_to(id, name)
      `);

    if (filters?.lab_id) {
      query = query.eq('asset.lab_id', filters.lab_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters?.reported_by) {
      query = query.eq('reported_by', filters.reported_by);
    }

    const sortBy = filters?.sort_by || 'created_at';
    const sortOrder = filters?.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw error;

    // Transform asset_issues to LabIssue format
    return (data || []).map(issue => ({
      id: issue.id,
      lab_id: issue.asset?.lab_id,
      title: issue.title,
      description: issue.description,
      issue_type: issue.issue_type,
      priority: issue.priority,
      reported_by: issue.reported_by,
      reported_by_name: issue.reported_by_user?.name,
      assigned_to: issue.assigned_to,
      assigned_to_name: issue.assigned_to_user?.name,
      status: issue.status,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      remark: issue.remark
    }));
  }

  static async getLabIssue(id: string): Promise<LabIssue | null> {
    const { data, error } = await supabase
      .from('asset_issues')
      .select(
        `
        *,
        asset:assets(id, name_of_supply, lab_id),
        reported_by_user:user_profiles!reported_by(id, name),
        assigned_to_user:user_profiles!assigned_to(id, name)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) return null;

    // Transform asset_issue to LabIssue format
    return {
      id: data.id,
      lab_id: data.asset?.lab_id,
      title: data.title,
      description: data.description,
      issue_type: data.issue_type,
      priority: data.priority,
      reported_by: data.reported_by,
      reported_by_name: data.reported_by_user?.name,
      assigned_to: data.assigned_to,
      assigned_to_name: data.assigned_to_user?.name,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      remark: data.remark
    };
  }

  static async createLabIssue(issue: CreateLabIssueRequest): Promise<LabIssue> {
    // Note: This method now creates asset issues instead of lab issues
    // The asset_id should be provided in the issue data
    const issueData = {
      asset_id: (issue as any).asset_id,
      title: issue.title,
      description: issue.description,
      issue_type: issue.issue_type,
      priority: issue.priority,
      assigned_to: issue.assigned_to,
      reported_by: issue.reported_by
    };

    const { data, error } = await supabase.from('asset_issues').insert(issueData).select(`
      *,
      asset:assets(id, name_of_supply, lab_id),
      reported_by_user:user_profiles!reported_by(id, name),
      assigned_to_user:user_profiles!assigned_to(id, name)
    `).single();

    if (error) throw error;

    // Transform to LabIssue format
    return {
      id: data.id,
      lab_id: data.asset?.lab_id,
      title: data.title,
      description: data.description,
      issue_type: data.issue_type,
      priority: data.priority,
      reported_by: data.reported_by,
      reported_by_name: data.reported_by_user?.name,
      assigned_to: data.assigned_to,
      assigned_to_name: data.assigned_to_user?.name,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      remark: data.remark
    };
  }

  static async updateLabIssue(id: string, updates: UpdateLabIssueRequest): Promise<LabIssue> {
    const { data, error } = await supabase
      .from('lab_issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteLabIssue(id: string): Promise<void> {
    const { error } = await supabase.from('lab_issues').delete().eq('id', id);

    if (error) throw error;
  }

  // User Lab Access
  static async getUserLabs(userId: string): Promise<Lab[]> {
    const { data, error } = await supabase
      .from('user_lab_access')
      .select('*')
      .eq('user_id', userId)
      .order('lab_name');

    if (error) throw error;
    return data || [];
  }

  static async getUserLabAccess(userId: string, labId: string): Promise<LabAccess | null> {
    const { data, error } = await supabase
      .from('user_lab_access')
      .select('*')
      .eq('user_id', userId)
      .eq('lab_id', labId)
      .single();

    if (error) throw error;
    return data;
  }

  // Lab Assets
  static async getLabAssets(labId: string): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('lab_id', labId)
      .order('name_of_supply');

    if (error) throw error;
    return data || [];
  }

  // Permission checking
  static async checkLabPermission(userId: string, labId: string, action: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_lab_permission', {
      p_user_id: userId,
      p_lab_id: labId,
      p_action: action,
    });

    if (error) throw error;
    return data || false;
  }

  // Lab Staff Management
  static async getLabStaff(labId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('lab_id', labId)
      .in('role', ['Lab Assistant', 'Lab Incharge']);

    if (error) throw error;
    return data || [];
  }

  static async updateLabStaff(userId: string, updates: { name?: string; email?: string; password?: string }): Promise<void> {
    // If password is provided, update auth user password using PasswordService
    if (updates.password) {
      try {
        // Get the auth_id for the user
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('auth_id')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        if (!userProfile?.auth_id) {
          throw new Error('User auth ID not found');
        }

        // Use PasswordService to update password (assuming HOD role for lab staff updates)
        const passwordResult = await PasswordService.updateUserPassword(userProfile.auth_id, updates.password, 'HOD');

        if (!passwordResult.success) {
          throw new Error(passwordResult.error || 'Failed to update password');
        }
      } catch (passwordError) {
        console.error('Password update failed:', passwordError);
        throw new Error('Failed to update password. Please try again or contact administrator.');
      }

      // Remove password from updates to avoid updating user_profiles table with it
      delete updates.password;
    }

    // Update other profile fields
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    }
  }

  static async deleteLabStaff(userId: string): Promise<void> {
    // First get the auth_id to delete from auth.users
    const { error: profileError } = await supabase
      .from('user_profiles')
      .select('auth_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Delete from user_profiles (this will cascade to auth.users due to foreign key)
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }


}

// Permission checking function (to be created in database)
export const createPermissionFunction = async () => {
  const { error: _error } = await supabase.rpc('create_lab_permission_function');
};
