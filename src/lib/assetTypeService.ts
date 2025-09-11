// Asset Type Service
import { supabase } from './supabase';

export interface AssetType {
  id: string;
  name: string;
  identifier: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Function to fetch asset types
export async function fetchAssetTypes(): Promise<AssetType[]> {
  const { data, error } = await supabase
    .from('asset_types')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching asset types:', error);
    return [];
  }
  return data || [];
}

// Function to create a new asset type (HOD only)
export async function createAssetType(name: string, identifier: string): Promise<AssetType | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if user is HOD
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, id')
    .eq('auth_id', user.id)
    .single();

  if (profile?.role !== 'HOD') {
    throw new Error('Only HOD can create asset types');
  }

  const { data, error } = await supabase
    .from('asset_types')
    .insert({
      name,
      identifier,
      created_by: profile.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating asset type:', error);
    throw error;
  }

  return data;
}

// Function to update an asset type (HOD only)
export async function updateAssetType(id: string, name: string, identifier: string): Promise<AssetType | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if user is HOD
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (profile?.role !== 'HOD') {
    throw new Error('Only HOD can update asset types');
  }

  const { data, error } = await supabase
    .from('asset_types')
    .update({
      name,
      identifier,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating asset type:', error);
    throw error;
  }

  return data;
}

// Function to delete an asset type (HOD only)
export async function deleteAssetType(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if user is HOD
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (profile?.role !== 'HOD') {
    throw new Error('Only HOD can delete asset types');
  }

  const { error } = await supabase
    .from('asset_types')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting asset type:', error);
    throw error;
  }
}
