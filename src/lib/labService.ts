import { supabase } from './supabase';
import {
  Lab,
  LabStaff,
  LabIssue,
  CreateLabRequest,
  UpdateLabRequest,
  CreateLabIssueRequest,
  UpdateLabIssueRequest,
  AssignStaffRequest,
  LabFilters,
  LabIssueFilters,
  type LabAccess,
} from '../types/lab';
import { Asset } from '../types';

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

    if (filters?.has_open_issues) {
      query = query.gt('open_issues_count', 0);
    }

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
    const { data, error } = await supabase.from('labs').insert(lab).select().single();

    if (error) throw error;
    return data;
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
    const { error } = await supabase.from('labs').delete().eq('id', id);

    if (error) throw error;
  }

  // Lab Staff Management
  static async getLabStaff(labId: string): Promise<LabStaff[]> {
    const { data, error } = await supabase
      .from('lab_staff')
      .select(
        `
        *,
        user:user_profiles(id, name, role)
      `
      )
      .eq('lab_id', labId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async assignStaff(labId: string, staff: AssignStaffRequest): Promise<LabStaff> {
    const { data, error } = await supabase
      .from('lab_staff')
      .insert({
        lab_id: labId,
        user_id: staff.user_id,
        role: staff.role,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeStaff(labId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('lab_staff')
      .delete()
      .eq('lab_id', labId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  static async updateStaffRole(labId: string, userId: string, role: string): Promise<LabStaff> {
    const { data, error } = await supabase
      .from('lab_staff')
      .update({ role })
      .eq('lab_id', labId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Lab Issues Management
  static async getLabIssues(filters?: LabIssueFilters): Promise<LabIssue[]> {
    let query = supabase.from('lab_issues').select(`
        *,
        lab:labs(id, name),
        reported_by_user:user_profiles!reported_by(id, name),
        assigned_to_user:user_profiles!assigned_to(id, name)
      `);

    if (filters?.lab_id) {
      query = query.eq('lab_id', filters.lab_id);
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
    return data || [];
  }

  static async getLabIssue(id: string): Promise<LabIssue | null> {
    const { data, error } = await supabase
      .from('lab_issues')
      .select(
        `
        *,
        lab:labs(id, name),
        reported_by_user:user_profiles!reported_by(id, name),
        assigned_to_user:user_profiles!assigned_to(id, name)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createLabIssue(issue: CreateLabIssueRequest): Promise<LabIssue> {
    const { data, error } = await supabase.from('lab_issues').insert(issue).select().single();

    if (error) throw error;
    return data;
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
}

// Permission checking function (to be created in database)
export const createPermissionFunction = async () => {
  const { error: _error } = await supabase.rpc('create_lab_permission_function');
};
