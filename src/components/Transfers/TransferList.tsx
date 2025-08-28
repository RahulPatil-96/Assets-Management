import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Plus, CheckCircle, Clock, User, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, AssetTransfer } from '../../lib/supabase';
import TransferForm from './TransferForm';
import TransferDetailsModalWithErrorBoundary from './TransferDetailsModalWithErrorBoundary';

const TransferListComponent: React.FC<{ searchTerm: string }> = ({ searchTerm: propSearchTerm }) => {
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [viewingTransfer, setViewingTransfer] = useState<AssetTransfer | null>(null);

  const fetchTransfers = async (): Promise<AssetTransfer[]> => {
    const { data, error } = await supabase
      .from('asset_transfers')
      .select(`
        *,
        asset:assets(name_of_supply, sr_no),
        initiator:initiated_by(name, role),
        receiver:received_by(name, role)
      `)
      .order('initiated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const { data: transfers = [], isLoading, refetch } = useQuery({
    queryKey: ['transfers'],
    queryFn: fetchTransfers
  });

  const handleReceive = useCallback(async (transferId: string) => {
    try {
      const { error } = await supabase
        .from('asset_transfers')
        .update({
          status: 'received',
          received_by: profile?.id,
        })
        .eq('id', transferId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error receiving transfer:', error);
    }
  }, [profile?.id, refetch]);

  const getStatusColor = (status: string) => {
    return status === 'received' ? 'text-green-600' : 'text-orange-600';
  };

  const getStatusIcon = (status: string) => {
    return status === 'received' ? CheckCircle : Clock;
  };

  const handleViewDetails = useCallback((transfer: AssetTransfer) => {
    setViewingTransfer(transfer);
  }, []);

  const canReceive = useCallback((transfer: AssetTransfer) => {
    return profile?.role === 'Lab Incharge' && 
           transfer.status === 'pending' && 
           transfer.to_lab === profile?.lab_id;
  }, [profile?.role, profile?.lab_id]);

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = propSearchTerm === '' || 
                         transfer.asset?.name_of_supply?.toLowerCase().includes(propSearchTerm.toLowerCase()) ||
                         (transfer.asset?.sr_no && transfer.asset.sr_no.toString().toLowerCase().includes(propSearchTerm.toLowerCase())) ||
                         transfer.from_lab?.toLowerCase().includes(propSearchTerm.toLowerCase()) ||
                         transfer.to_lab?.toLowerCase().includes(propSearchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Asset Transfers</h1>
        {profile?.role === 'Lab Incharge' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 flex items-center space-x-2 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Transfer</span>
          </button>
        )}
      </div>


      {/* Transfers List */}
      <div className="space-y-4">
        {filteredTransfers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <ArrowRightLeft className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No transfers found</p>
          </div>
        ) : (
          filteredTransfers.map((transfer) => {
            const StatusIcon = getStatusIcon(transfer.status);
            return (
              <div
                key={transfer.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusIcon className={`w-5 h-5 ${getStatusColor(transfer.status)}`} />
                      <span className={`font-medium ${getStatusColor(transfer.status)}`}>
                        {transfer.status === 'received' ? 'Completed' : 'Pending'}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 hidden sm:inline">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transfer.initiated_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">
                      Asset: {transfer.asset?.name_of_supply} (SR: {transfer.asset?.sr_no})
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs sm:text-sm font-medium">
                        From: {transfer.from_lab}
                      </span>
                      <ArrowRightLeft className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs sm:text-sm font-medium">
                        To: {transfer.to_lab}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Initiated by: {transfer.initiator?.name || ''}</span>
                      </div>
                      {transfer.receiver && (
                        <span className="hidden sm:inline">Received by: {transfer.receiver.name || ''}</span>
                      )}
                      {transfer.received_by && !transfer.receiver && (
                        <span className="hidden sm:inline">Received by: </span>
                      )}
                      {transfer.received_at && (
                        <span className="hidden sm:inline">on {new Date(transfer.received_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleViewDetails(transfer)}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 p-1"
                      title="View Details"
                      aria-label={`View details for transfer of ${transfer.asset?.name_of_supply}`}
                    >
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {canReceive(transfer) && (
                      <button
                        onClick={() => handleReceive(transfer.id)}
                        className="bg-green-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors whitespace-nowrap"
                      >
                        Confirm Receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Transfer Form Modal */}
      {showForm && (
        <TransferForm
          onClose={() => setShowForm(false)}
          onSave={refetch}
        />
      )}

      {viewingTransfer && (
        <TransferDetailsModalWithErrorBoundary
          transfer={viewingTransfer}
          onClose={() => setViewingTransfer(null)}
        />
      )}
    </div>
  );
};

const TransferList = React.memo(TransferListComponent);
export default TransferList;