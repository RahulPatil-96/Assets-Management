import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AssetTransfer } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

interface TransferDetailsModalProps {
  transfer: AssetTransfer | null;
  onClose: () => void;
}

const TransferDetailsModal: React.FC<TransferDetailsModalProps> = ({ transfer, onClose }) => {
  const [initiatorName, setInitiatorName] = useState<string>('');
  const [receiverName, setReceiverName] = useState<string>('');
  const [loadingInitiator, setLoadingInitiator] = useState(false);
  const [loadingReceiver, setLoadingReceiver] = useState(false);

  useEffect(() => {
    const fetchInitiatorName = async () => {
      if (!transfer?.initiated_by) {
        setInitiatorName('');
        return;
      }

      // If initiator is already populated from the relationship, use it
      if (transfer.initiator?.name) {
        setInitiatorName(transfer.initiator.name);
        return;
      }

      setLoadingInitiator(true);
      try {
        const { data: initiatorData, error } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', transfer.initiated_by)
          .maybeSingle();

        if (error) {
          console.error('Error fetching initiator name:', error);
          setInitiatorName('Unknown');
        } else if (initiatorData) {
          setInitiatorName(initiatorData.name || 'Unknown');
        } else {
          setInitiatorName('Unknown');
        }
      } catch (error) {
        console.error('Error fetching initiator name:', error);
        setInitiatorName('Unknown');
      } finally {
        setLoadingInitiator(false);
      }
    };

    const fetchReceiverName = async () => {
      if (!transfer?.received_by) {
        setReceiverName('');
        return;
      }

      // If receiver is already populated from the relationship, use it
      if (transfer.receiver?.name) {
        setReceiverName(transfer.receiver.name);
        return;
      }

      setLoadingReceiver(true);
      try {
        const { data: receiverData, error } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', transfer.received_by)
          .maybeSingle();

        if (error) {
          console.error('Error fetching receiver name:', error);
          setReceiverName('Unknown');
        } else if (receiverData) {
          setReceiverName(receiverData.name || 'Unknown');
        } else {
          setReceiverName('Unknown');
        }
      } catch (error) {
        console.error('Error fetching receiver name:', error);
        setReceiverName('Unknown');
      } finally {
        setLoadingReceiver(false);
      }
    };

    fetchInitiatorName();
    fetchReceiverName();
  }, [transfer?.initiated_by, transfer?.received_by, transfer?.initiator?.name, transfer?.receiver?.name]);

  if (!transfer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Transfer Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transfer Information</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    transfer.status === 'received' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  }`}>
                    {transfer.status === 'received' ? 'Received' : 'Pending'}
                  </span>
                </p>
                <p className="text-sm"><span className="font-medium">Initiated At:</span> {new Date(transfer.initiated_at).toLocaleString()}</p>
                {transfer.received_at && (
                  <p className="text-sm"><span className="font-medium">Received At:</span> {new Date(transfer.received_at).toLocaleString()}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Asset Information</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Asset Name:</span> {transfer.asset?.name_of_supply || 'N/A'}</p>
                <p className="text-sm"><span className="font-medium">Serial Number:</span> {transfer.asset?.sr_no || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Initiator Details</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Name:</span> {loadingInitiator ? 'Loading...' : initiatorName}</p>
              </div>
            </div>

            {transfer.status === 'received' && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Receiver Details</h3>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-medium">Name:</span> {loadingReceiver ? 'Loading...' : receiverName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferDetailsModal;
