import React from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../Button';

interface DeletedAsset {
  id: string;
  asset_id: string;
  original_asset_id: string;
  name_of_supply: string;
  asset_type: string;
  allocated_lab: string;
  deleted_at: string;
  hod_approval: boolean;
  hod_approved_at: string | null;
  restored: boolean;
  restored_at: string | null;
  labs: { name: string }[];
}

const fetchDeletedAssets = async (): Promise<DeletedAsset[]> => {
  const { data, error } = await supabase
    .from('deleted_assets')
    .select('id, original_asset_id, asset_id, name_of_supply, asset_type, allocated_lab, deleted_at, hod_approval, hod_approved_at, restored, restored_at, labs!allocated_lab(name)')
    .eq('restored', false)
    .order('hod_approval', { ascending: true })
    .order('deleted_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const approveDeletion = async ({ id, userId, originalAssetId }: { id: string; userId: string; originalAssetId: string }): Promise<DeletedAsset> => {
  // Update deleted_assets with approval
  const { data, error } = await supabase
    .from('deleted_assets')
    .update({
      hod_approval: true,
      hod_approved_at: new Date().toISOString(),
      hod_approved_by: userId
    })
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Delete the original asset from assets table
  const { error: deleteError } = await supabase
    .from('assets')
    .delete()
    .eq('id', originalAssetId);

  if (deleteError) {
    throw new Error(`Failed to delete asset: ${deleteError.message}`);
  }

  return data as DeletedAsset;
};

const restoreAsset = async (id: string): Promise<any> => {
  // Call RPC or API to restore asset (move back to assets table)
  const { data, error } = await supabase.rpc('restore_deleted_asset', { deleted_asset_id: id });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const DeletedAssetList: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { data, error, isLoading }: UseQueryResult<DeletedAsset[], Error> = useQuery({
    queryKey: ['deletedAssets'],
    queryFn: fetchDeletedAssets
  });

  const approveMutation: UseMutationResult<DeletedAsset, Error, { id: string; userId: string; originalAssetId: string }> = useMutation({
    mutationFn: approveDeletion,
    onSuccess: () => {
      toast.success('Deletion approved successfully');
      queryClient.invalidateQueries({ queryKey: ['deletedAssets'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-assets'] });
    },
    onError: (error: Error) => {
      toast.error(`Error approving deletion: ${error.message}`);
    },
  });

  const restoreMutation: UseMutationResult<any, Error, string> = useMutation({
    mutationFn: restoreAsset,
    onSuccess: () => {
      toast.success('Asset restored successfully');
      queryClient.invalidateQueries({ queryKey: ['deletedAssets'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-assets'] });
    },
    onError: (error: Error) => {
      toast.error(`Error restoring asset: ${error.message}`);
    },
  });

  if (isLoading) return <div>Loading deleted assets...</div>;
  if (error) return <div>Error loading deleted assets: {error.message}</div>;

  if (!profile || profile.role !== 'HOD') {
    return <div>Access denied. Only HOD can view deleted assets.</div>;
  }

  return (
    <div className='p-4 sm:p-6 overflow-x-auto'>
      <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4'>Deleted Assets</h1>
      {data && data.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-gray-500 dark:text-gray-300'>No deleted assets pending approval.</p>
        </div>
      )}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto'>
        <table className='w-full max-w-full'>
          <thead className='bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Asset ID
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Name
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Type
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Lab
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Deleted At
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                HOD Approval
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.map((asset: DeletedAsset) => (
              <tr key={asset.id} className='border-b border-gray-200 dark:border-gray-600'>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {asset.asset_id}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {asset.name_of_supply}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {asset.asset_type}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {asset.labs[0]?.name || 'N/A'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {new Date(asset.deleted_at).toLocaleString()}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm'>
                  {asset.hod_approval ? (
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'>
                      Approved
                    </span>
                  ) : (
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'>
                      Pending
                    </span>
                  )}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400'>
                  <div className='flex space-x-2'>
                    {!asset.hod_approval && (
                      <Button
                        onClick={() => approveMutation.mutate({
                          id: asset.id,
                          userId: profile.id,
                          originalAssetId: asset.original_asset_id
                        })}
                        variant='success'
                        size='sm'
                      >
                        Approve
                      </Button>
                    )}
                    {asset.hod_approval && !asset.restored && (
                      <Button
                        onClick={() => restoreMutation.mutate(asset.id)}
                        variant='primary'
                        size='sm'
                      >
                        Restore
                      </Button>
                    )}
                    {asset.restored && <span className='text-gray-500'>Restored</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeletedAssetList;