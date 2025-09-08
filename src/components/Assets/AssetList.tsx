import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  BarChart3,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Asset } from '../../lib/supabase';
import AssetForm from './AssetForm';
import AssetDetailsModal from './AssetDetailsModal';
import AssetAnalyticsDashboard from '../Analytics/AssetAnalyticsDashboard';
import ExportButton from '../Export/ExportButton';
import ConfirmationModal from '../Layout/ConfirmationModal';
import FilterDropdown from '../FilterDropdown';
import DateRangePicker from '../DateRangePicker';
import Button from '../Button';

const AssetList: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const { profile } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLab, setFilterLab] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [labMap, setLabMap] = useState<Map<string, string>>(new Map());

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  
  type AssetWithLabName = Asset & { lab_name: string };
  const fetchAssets = async (): Promise<{ assets: AssetWithLabName[]; totalCount: number }> => {
    // Fetch all assets and labs in parallel
    const [
      { data: assetsData, error: assetsError },
      { data: labsData, error: labsError },
    ] = await Promise.all([
      supabase
        .from('assets')
        .select(
          `*, creator:created_by(name, role), approver:approved_by(name, role), approver_lab_incharge:approved_by_lab_incharge(name, role)`,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false }),
      supabase.from('labs').select('id, name'),
    ]);

    if (assetsError) throw assetsError;
    if (labsError) throw labsError;
    // Map lab id to name
    const newLabMap = new Map<string, string>();
    (labsData || []).forEach((lab: { id: string; name: string }) => {
      newLabMap.set(lab.id, lab.name);
    });
    setLabMap(newLabMap);
    // Attach lab name to each asset
    const assets = (assetsData || []).map((asset: Asset) => ({
      ...asset,
      lab_name: newLabMap.get(asset.allocated_lab) || asset.allocated_lab,
    }));

    return { assets, totalCount: assetsData?.length || 0 };
  };

  const {
    data: assetsData = { assets: [], totalCount: 0 },
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['assets'],
    queryFn: fetchAssets,
  });

  const assets = assetsData.assets;

  useEffect(() => {
    // Subscribe to real-time changes in the assets table
    const subscription = supabase
      .channel('assets-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets',
        },
        payload => {
          // Only refetch if the change is relevant to the current view
          // Check if the changed asset matches current filters
          const changedAsset = payload.new as Asset;
          const matchesCurrentFilters = () => {
            const matchesSearch =
              changedAsset.name_of_supply.toLowerCase().includes(searchTerm.toLowerCase()) ||
              changedAsset.allocated_lab.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (changedAsset.asset_id &&
                changedAsset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus =
              filterStatus === 'all' ||
              (filterStatus === 'approved' && changedAsset.approved) ||
              (filterStatus === 'pending' && !changedAsset.approved);

            const matchesLab = filterLab === 'all' || changedAsset.allocated_lab === filterLab;

            const matchesType = filterType === 'all' || changedAsset.asset_type === filterType;

            const assetDate = new Date(changedAsset.date);
            const from = new Date(fromDate);
            const to = new Date(toDate);
            const matchesDate = (!fromDate || assetDate >= from) && (!toDate || assetDate <= to);

            return matchesSearch && matchesStatus && matchesLab && matchesType && matchesDate;
          };

          // Only refetch if the changed asset matches current filters or if it's a delete operation
          if (payload.eventType === 'DELETE' || matchesCurrentFilters()) {
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [refetch, searchTerm, filterStatus, filterLab, filterType, fromDate, toDate]);

  const handleApprove = async (assetId: string, asset: Asset) => {
    try {
      const isHOD = profile?.role === 'HOD';
      const isLabIncharge = profile?.role === 'Lab Incharge';

      let updateData: {
        approved_by?: string;
        approved_at?: string;
        approved_by_lab_incharge?: string;
        approved_at_lab_incharge?: string;
        approved?: boolean;
      } = {};

      if (isHOD) {
        updateData = {
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
        };

        // If lab incharge has already approved, mark as fully approved
        if (asset.approved_by_lab_incharge) {
          updateData.approved = true;
        }
      } else if (isLabIncharge) {
        updateData = {
          approved_by_lab_incharge: profile?.id,
          approved_at_lab_incharge: new Date().toISOString(),
        };

        // If HOD has already approved, mark as fully approved
        if (asset.approved_by) {
          updateData.approved = true;
        }
      }

      const { error } = await supabase.from('assets').update(updateData).eq('id', assetId);

      if (error) throw error;

      // Notification is now only sent from the form, not here

      toast.success('Asset approved successfully!');
      refetch();
    } catch (error: any) {
      console.error('Error approving asset:', error);
      toast.error(`Failed to approve asset: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (assetId: string) => {
    setAssetToDelete(assetId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('assets').delete().eq('id', assetToDelete);

      if (error) throw error;

      // Notification is now only sent from the form, not here
      toast.success('Asset deleted successfully!');
      refetch();
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      toast.error(`Failed to delete asset: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setAssetToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setAssetToDelete(null);
    setIsDeleting(false);
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(filteredAssets.map(asset => asset.id)));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      // Only delete assets the user is allowed to delete
      const deletableAssets = assets.filter(asset => selectedAssets.has(asset.id) && canDelete(asset));
      if (deletableAssets.length === 0) {
        setIsBulkDeleting(false);
        setShowBulkDeleteModal(false);
        return;
      }
      const { error } = await supabase.from('assets').delete().in('id', deletableAssets.map(a => a.id));
      if (error) throw error;
      toast.success(`${deletableAssets.length} assets deleted successfully!`);
      refetch();
      setSelectedAssets(new Set());
      setShowBulkActions(false);
    } catch (_error) {
      // console.error('Error bulk deleting assets:', _error);
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteModal(false);
    }
  };

  const handleBulkApprove = async () => {
    setIsBulkApproving(true);
    try {
      const { error } = await supabase
        .from('assets')
        .update({ status: 'approved' })
        .in('id', Array.from(selectedAssets));

      if (error) throw error;

      toast.success(`${selectedAssets.size} assets approved successfully!`);
      refetch();
      setSelectedAssets(new Set());
      setShowBulkActions(false);
    } catch (_error) {
      // console.error('Error bulk approving assets:', _error);
    } finally {
      setIsBulkApproving(false);
      setShowBulkApproveModal(false);
    }
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false);
  };

  const cancelBulkApprove = () => {
    setShowBulkApproveModal(false);
  };

  const handleViewDetails = (asset: Asset) => {
    setViewingAsset(asset);
  };

  const filteredAssets = React.useMemo(
    () =>
      assets.filter(asset => {
        const matchesSearch =
          asset.name_of_supply.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.allocated_lab.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (asset.asset_id && asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'approved' && asset.approved) ||
          (filterStatus === 'pending' && !asset.approved);

        const matchesLab = filterLab === 'all' || asset.allocated_lab === filterLab;

        const matchesType = filterType === 'all' || asset.asset_type === filterType;

        const assetDate = new Date(asset.date);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const matchesDate = (!fromDate || assetDate >= from) && (!toDate || assetDate <= to);

        return matchesSearch && matchesStatus && matchesLab && matchesType && matchesDate;
      }),
    [assets, searchTerm, filterStatus, filterLab, filterType, fromDate, toDate]
  );

  const canEdit = (asset: Asset) =>
    profile?.role === 'Lab Assistant' &&
    asset.created_by === profile?.id &&
    profile.lab_id === asset.allocated_lab;

  const canApprove = (asset: Asset) => {
    const isHOD = profile?.role === 'HOD';
    const isLabIncharge = profile?.role === 'Lab Incharge';

    if (isHOD) {
      return !asset.approved_by && !asset.approved;
    } else if (isLabIncharge) {
      return !asset.approved_by_lab_incharge && !asset.approved;
    }

    return false;
  };

  const canDelete = (asset: Asset) =>
    (profile?.role === 'HOD') ||
    (profile?.role === 'Lab Incharge' && !asset.approved_by && !asset.approved) ||
    (profile?.role === 'Lab Assistant' &&
      asset.created_by === profile?.id &&
      !asset.approved_by_lab_incharge &&
      !asset.approved_by &&
      !asset.approved &&
      profile.lab_id === asset.allocated_lab);

  if (isLoading) {
    return (
      <div className='p-4 sm:p-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-6'></div>
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='h-20 bg-gray-200 dark:bg-gray-700 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-4 sm:p-6 overflow-x-auto'>
      <div className='flex flex-col sm:flex-row justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0'>
          Asset Management
        </h1>
        <div className='flex items-center space-x-4'>
          {profile?.role === 'Lab Assistant' && profile?.lab_id && (
            <Button
              onClick={() => setShowForm(true)}
              variant='primary'
              size='md'
              className='flex items-center space-x-2'
            >
              <Plus className='w-4 h-4' />
              <span className='hidden sm:inline'>Add Asset</span>
            </Button>
          )}
          <ExportButton
            data={filteredAssets}
            type='assets'
            disabled={filteredAssets.length === 0}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='flex border-b border-gray-200 dark:border-gray-700 mb-6'>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'list'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Package className='w-4 h-4 inline mr-2' />
          <span className='hidden sm:inline'>Asset List</span>
          <span className='sm:hidden'>List</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'analytics'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 className='w-4 h-4 inline mr-2' />
          <span className='hidden sm:inline'>Analytics</span>
          <span className='sm:hidden'>Stats</span>
        </button>
      </div>

      {/* Filters */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4'>
        <div className='flex flex-wrap gap-4'>
          <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium'>
            <Filter className='w-4 h-4' />
            <span>Filters:</span>
          </div>
          <FilterDropdown
            label='Status:'
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'approved', label: 'Approved' },
              { value: 'pending', label: 'Pending Approval' },
            ]}
            className='w-auto min-w-[150px]'
          />

          <FilterDropdown
            label='Lab:'
            value={filterLab}
            onChange={setFilterLab}
            options={[
              { value: 'all', label: 'All Labs' },
              ...Array.from(new Set(assets.map(asset => asset.allocated_lab))).map(labId => ({
                value: labId,
                label: labMap.get(labId) || labId,
              })),
            ]}
            className='w-auto min-w-[150px]'
          />

          <FilterDropdown
            label='Type:'
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'cpu', label: 'CPU' },
              { value: 'printer', label: 'Printer' },
              { value: 'network', label: 'Network Equipment' },
              { value: 'peripheral', label: 'Peripheral' },
              { value: 'microcontroller', label: 'Microcontroller' },
              { value: 'monitor', label: 'Monitor' },
              { value: 'mouse', label: 'Mouse' },
              { value: 'keyboard', label: 'Keyboard' },
              { value: 'scanner', label: 'Scanner' },
              { value: 'projector', label: 'Projector' },
              { value: 'laptop', label: 'Laptop' },
              { value: 'other', label: 'Other' },
            ]}
            className='w-auto min-w-[150px]'
          />

          <DateRangePicker
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            toDate={toDate}
            onToDateChange={setToDate}
            className='w-auto min-w-[200px]'
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAssets.size > 0 && (
        <div className='bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <span className='text-blue-800 dark:text-blue-200 font-medium'>
                {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                onClick={() => setShowBulkActions(!showBulkActions)}
                variant='secondary'
                size='sm'
                aria-label='Show bulk actions'
              >
                Bulk Actions
              </Button>
            </div>
            <Button
              onClick={() => setSelectedAssets(new Set())}
              variant='ghost'
              size='sm'
              aria-label='Clear selection'
            >
              Clear Selection
            </Button>
          </div>

          {showBulkActions && (
            <div className='mt-3 flex space-x-3'>
              <Button
                onClick={() => setShowBulkApproveModal(true)}
                variant='success'
                size='sm'
                disabled={isBulkApproving}
                aria-label='Approve selected assets'
              >
                Approve Selected
              </Button>
              <Button
                onClick={() => setShowBulkDeleteModal(true)}
                variant='danger'
                size='sm'
                disabled={isBulkDeleting}
                aria-label='Delete selected assets'
              >
                Delete Selected
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'list' ? (
        <>
          {/* Assets List */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-200px)] overflow-y-auto'>
            {filteredAssets.length === 0 ? (
              <div className='text-center py-12'>
                <Package className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
                <p className='text-gray-500 dark:text-gray-300'>No assets found</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full max-w-full'>
                  <thead className='bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Sr No
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        <input
                          type='checkbox'
                          checked={
                            selectedAssets.size === filteredAssets.length &&
                            filteredAssets.length > 0
                          }
                          onChange={toggleSelectAll}
                          className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                          aria-label='Select all assets'
                        />
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Asset ID
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Asset
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Lab
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset, index) => (
                      <tr key={asset.id} className='border-b border-gray-200 dark:border-gray-600'>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {index + 1}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                          <input
                            type='checkbox'
                            checked={selectedAssets.has(asset.id)}
                            onChange={() => toggleAssetSelection(asset.id)}
                            className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                            aria-label={`Select asset ${asset.name_of_supply}`}
                          />
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {asset.asset_id || 'Pending...'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {asset.name_of_supply}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {asset.lab_name}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          {asset.approved ? (
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'>
                              Approved
                            </span>
                          ) : asset.approved_by || asset.approved_by_lab_incharge ? (
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>
                              Partial Approve
                            </span>
                          ) : (
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400'>
                          <div className='flex space-x-2'>
                            <Button
                              onClick={() => handleViewDetails(asset)}
                              variant='view'
                              size='sm'
                            >
                              <Eye className='w-5 h-5' />
                            </Button>
                            {canEdit(asset) && (
                              <Button
                                onClick={() => {
                                  setEditingAsset(asset);
                                  setShowForm(true);
                                }}
                                variant='edit'
                                size='sm'
                              >
                                <Edit className='w-5 h-5' />
                              </Button>
                            )}
                            {canApprove(asset) && (
                              <Button
                                onClick={() => handleApprove(asset.id, asset)}
                                variant='approve'
                                size='sm'
                              >
                                <CheckCircle className='w-5 h-5' />
                              </Button>
                            )}
                            {canDelete(asset) && (
                              <Button
                                onClick={() => handleDelete(asset.id)}
                                variant='trash'
                                size='sm'
                              >
                                <Trash2 className='w-5 h-5' />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>


        </>
      ) : (
        <AssetAnalyticsDashboard assets={filteredAssets} labs={Object.fromEntries(labMap)} />
      )}

      {/* Asset Form Modal */}
      {showForm && (
        <AssetForm
          asset={editingAsset}
          onClose={() => {
            setShowForm(false);
            setEditingAsset(null);
          }}
          onSave={() => {
            refetch();
          }}
        />
      )}

      {viewingAsset && (
        <AssetDetailsModal asset={viewingAsset} onClose={() => setViewingAsset(null)} />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title='Delete Asset'
        message='Are you sure you want to delete this asset? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        type='delete'
        isLoading={isDeleting}
        destructive={true}
      />

      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={cancelBulkDelete}
        onConfirm={handleBulkDelete}
        title='Delete Selected Assets'
        message={`Are you sure you want to delete ${selectedAssets.size} selected asset${selectedAssets.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText='Delete All'
        cancelText='Cancel'
        type='delete'
        isLoading={isBulkDeleting}
        destructive={true}
      />

      <ConfirmationModal
        isOpen={showBulkApproveModal}
        onClose={cancelBulkApprove}
        onConfirm={handleBulkApprove}
        title='Approve Selected Assets'
        message={`Are you sure you want to approve ${selectedAssets.size} selected asset${selectedAssets.size !== 1 ? 's' : ''}?`}
        confirmText='Approve All'
        cancelText='Cancel'
        type='approve'
        isLoading={isBulkApproving}
        destructive={false}
      />
    </div>
  );
};

export default React.memo(AssetList);
