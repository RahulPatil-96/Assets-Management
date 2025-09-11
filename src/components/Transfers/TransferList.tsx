import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Plus, CheckCircle, Clock, Eye, Trash2, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, AssetTransfer } from '../../lib/supabase';
import TransferForm from './TransferForm';
import TransferDetailsModalWithErrorBoundary from './TransferDetailsModalWithErrorBoundary';
import { ListItemSkeleton } from '../Layout/LoadingSkeleton';
import Button from '../Button';
import ConfirmationModal from '../Layout/ConfirmationModal';
import FilterDropdown from '../FilterDropdown';
import DateRangePicker from '../DateRangePicker';
import ExportButton from '../Export/ExportButton';

const TransferListComponent: React.FC<{ searchTerm: string }> = ({ searchTerm: propSearchTerm }) => {
  const { profile } = useAuth();
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLab, setFilterLab] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterConsumable, setFilterConsumable] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewingTransfer, setViewingTransfer] = useState<AssetTransfer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transferToDelete, setTransferToDelete] = useState<AssetTransfer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTransfers = async (): Promise<AssetTransfer[]> => {
    const { data, error } = await supabase
      .from('asset_transfers')
      .select(
        `
        *,
        asset:assets(name_of_supply, sr_no, asset_id, allocated_lab, is_consumable, asset_type),
        initiator:initiated_by(name, role),
        receiver:received_by(name, role),
        from_lab_data:from_lab(name, lab_identifier),
        to_lab_data:to_lab(name, lab_identifier)
      `
      )
      .order('initiated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const {
    data: transfers = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['transfers'],
    queryFn: fetchTransfers,
  });

  const handleReceive = useCallback(
    async (transferId: string) => {
      try {
        // Get the transfer details to know the asset_id and to_lab
        const { data: transferData, error: fetchError } = await supabase
          .from('asset_transfers')
          .select('asset_id, to_lab')
          .eq('id', transferId)
          .single();

        if (fetchError) throw fetchError;

        // Update the transfer status to received
        const { error } = await supabase
          .from('asset_transfers')
          .update({
            status: 'received',
            received_by: profile?.id,
            received_at: new Date().toISOString(),
          })
          .eq('id', transferId);

        if (error) throw error;

        // Update the asset's allocated_lab - the database trigger will automatically update the asset_id
        const { error: updateAssetError } = await supabase
          .from('assets')
          .update({
            allocated_lab: transferData.to_lab
          })
          .eq('id', transferData.asset_id);

        if (updateAssetError) throw updateAssetError;

        toast.success('Asset transfer received successfully!');
        refetch();
      } catch (_error) {
        console.error('Error receiving transfer:', _error);
        toast.error('Failed to receive asset transfer');
      }
    },
    [profile?.id, refetch]
  );

  const handleDelete = useCallback(
    async () => {
      if (!transferToDelete) return;
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('asset_transfers')
          .delete()
          .eq('id', transferToDelete.id);

        if (error) throw error;
        toast.success('Asset transfer deleted successfully!');
        setShowDeleteModal(false);
        setTransferToDelete(null);
        refetch();
      } catch (_error) {
        // console.error('Error deleting transfer:', _error);
      } finally {
        setIsDeleting(false);
      }
    },
    [transferToDelete, refetch]
  );

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTransferToDelete(null);
  };

  const getStatusColor = (status: string) =>
    status === 'received' ? 'text-green-600' : 'text-orange-600';

  const getStatusIcon = (status: string) => (status === 'received' ? CheckCircle : Clock);

  const handleViewDetails = useCallback((transfer: AssetTransfer) => {
    setViewingTransfer(transfer);
  }, []);

  const canReceive = useCallback(
    (transfer: AssetTransfer) => {
      if (!profile?.lab_id || transfer.status !== 'pending') return false;
      if (profile.role !== 'Lab Incharge') return false;

      const matchesByName = transfer.to_lab_data?.name === profile.lab_id;
      const matchesById = transfer.to_lab === profile.lab_id;

      return matchesByName || matchesById;
    },
    [profile?.lab_id, profile?.role]
  );

  const canDelete = useCallback(
    (transfer: AssetTransfer) =>
      profile?.role === 'Lab Incharge' &&
      transfer.status === 'pending' &&
      transfer.from_lab === profile?.lab_id,
    [profile?.role, profile?.lab_id]
  );

  const filteredTransfers = React.useMemo(
    () =>
      transfers
        .filter(transfer => {
          const matchesSearch =
            propSearchTerm === '' ||
            (transfer.asset?.asset_id &&
              transfer.asset.asset_id.toString().toLowerCase().includes(propSearchTerm.toLowerCase())) ||
            (transfer.asset?.name_of_supply &&
              transfer.asset.name_of_supply.toLowerCase().includes(propSearchTerm.toLowerCase()));

          const matchesStatus = filterStatus === 'all' || transfer.status === filterStatus;
          const matchesLab =
            filterLab === 'all' ||
            transfer.from_lab === filterLab ||
            transfer.to_lab === filterLab;
          const matchesType =
            filterType === 'all' ||
            (transfer.asset?.name_of_supply?.toLowerCase().includes(filterType.toLowerCase()));

          const matchesConsumable =
            filterConsumable === 'all' ||
            (filterConsumable === 'consumable' && transfer.asset?.is_consumable) ||
            (filterConsumable === 'non-consumable' && !transfer.asset?.is_consumable);

          const transferDate = new Date(transfer.initiated_at);
          const from = new Date(fromDate);
          const to = new Date(toDate);
          const matchesDate = (!fromDate || transferDate >= from) && (!toDate || transferDate <= to);

          return matchesSearch && matchesStatus && matchesLab && matchesType && matchesConsumable && matchesDate;
        })
        .sort((a, b) => {
          if (a.status === 'pending' && b.status === 'received') return -1;
          if (a.status === 'received' && b.status === 'pending') return 1;
          return new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime();
        }),
    [transfers, propSearchTerm, filterStatus, filterLab, filterType, filterConsumable, fromDate, toDate]
  );

  if (isLoading) {
    return (
      <div className='p-4 sm:p-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-6'></div>
          <ListItemSkeleton count={3} className='h-24' />
        </div>
      </div>
    );
  }

  return (
    <div className='p-4 sm:p-6 overflow-x-auto'>
      <div className='flex flex-col sm:flex-row justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0'>
          Asset Transfers
        </h1>
        <div className='flex items-center space-x-4'>
          <ExportButton
            data={filteredTransfers}
            type='transfers'
            disabled={filteredTransfers.length === 0}
          />
          {profile?.role === 'Lab Incharge' && (
            <Button
              onClick={() => setShowForm(true)}
              variant="view" // or "primary" if you want blue; using "view" here for purple theme
              icon={<Plus className="w-4 h-4" />}
            >
              Initiate Transfer
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4'>
        <div className='flex gap-4 overflow-x-auto'>
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
              { value: 'pending', label: 'Pending' },
              { value: 'received', label: 'Received' },
            ]}
            className='w-full sm:w-auto min-w-[100px]'
          />
          <FilterDropdown
            label='Lab:'
            value={filterLab}
            onChange={setFilterLab}
            options={[
              { value: 'all', label: 'All Labs' },
              ...Array.from(
                new Set([
                  ...transfers.map(transfer => transfer.from_lab).filter(Boolean),
                  ...transfers.map(transfer => transfer.to_lab).filter(Boolean)
                ])
              ).map(labId => ({
                value: labId as string,
                label: labId as string,
              })),
            ]}
            className='w-full sm:w-auto min-w-[100px]'
          />
          <FilterDropdown
            label='Type:'
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'all', label: 'All Types' },
              ...Array.from(
                new Set(transfers.map(transfer => transfer.asset?.name_of_supply).filter(Boolean))
              ).map(type => ({
                value: type as string,
                label: type as string,
              })),
            ]}
            className='w-full sm:w-auto min-w-[100px]'
          />
          <FilterDropdown
            label='Consumable:'
            value={filterConsumable}
            onChange={setFilterConsumable}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'consumable', label: 'Consumable' },
              { value: 'non-consumable', label: 'Non-Consumable' },
            ]}
            className='w-full sm:w-auto min-w-[150px]'
          />
          <DateRangePicker
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            toDate={toDate}
            onToDateChange={setToDate}
            className='w-full sm:w-auto min-w-[200px]'
          />
        </div>
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-200px)] overflow-y-auto'>
        {filteredTransfers.length === 0 ? (
          <div className='text-center py-12'>
            <ArrowRightLeft className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
            <p className='text-gray-500 dark:text-gray-300'>No transfers found</p>
          </div>
        ) : (
          <div className='overflow-x-auto max-w-full'>
            <table className='w-full'>
              <thead className='bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Sr No
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Asset ID
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Asset
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    From Lab
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    To Lab
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Initiated By
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Initiated At
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((transfer, index) => {
                  const StatusIcon = getStatusIcon(transfer.status);
                  return (
                    <tr key={transfer.id} className='border-b border-gray-200 dark:border-gray-600'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                        {index + 1}
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs '>
                        {transfer.asset?.asset_id || 'Pending...'}
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs '>
                        {transfer.asset?.name_of_supply || 'N/A'}
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs '>
                        {transfer.from_lab_data?.name || transfer.from_lab}
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs '>
                        {transfer.to_lab_data?.name || transfer.to_lab}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm'>
                        <div className='flex items-center space-x-2'>
                          <StatusIcon className={`w-4 h-4 ${getStatusColor(transfer.status)}`} />
                          <span className={getStatusColor(transfer.status)}>
                            {transfer.status === 'received' ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs '>
                        {transfer.initiator?.name || ''}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                        {new Date(transfer.initiated_at).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400'>
                        <div className='flex space-x-2'>
                          <Button
                            onClick={() => handleViewDetails(transfer)}
                            variant='view'
                            size='sm'
                            className='p-1'
                            icon={<Eye className='w-5 h-5' />} children={undefined} />

                          {canDelete(transfer) && (
                            <Button
                              onClick={() => {
                                setTransferToDelete(transfer);
                                setShowDeleteModal(true);
                              }}
                              variant='trash'
                              size='sm'
                              className='p-1'
                              icon={<Trash2 className='w-5 h-5' />} children={undefined} />
                          )}

                          {canReceive(transfer) && (
                            <Button
                              onClick={() => handleReceive(transfer.id)}
                              variant='success'
                              size='sm'
                            >
                              Received
                            </Button>
                          )}
                        </div>

                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <TransferForm onClose={() => setShowForm(false)} onSave={refetch} />}

      {viewingTransfer && (
        <TransferDetailsModalWithErrorBoundary
          transfer={viewingTransfer}
          onClose={() => setViewingTransfer(null)}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={handleDelete}
        title='Delete Transfer'
        message='Are you sure you want to delete this transfer? This action cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        type='delete'
        isLoading={isDeleting}
        destructive={true}
      />
    </div>
  );
};

const TransferList = React.memo(TransferListComponent);
export default TransferList;