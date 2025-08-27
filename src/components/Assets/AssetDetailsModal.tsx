import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Asset } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

export interface AssetDetailsModalProps {
  asset: Asset | null;
  onClose: () => void;
}

const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({ asset, onClose }) => {
  const [labName, setLabName] = useState<string>('');
  const [loadingLab, setLoadingLab] = useState(false);
  const [creatorName, setCreatorName] = useState<string>('');
  const [loadingCreator, setLoadingCreator] = useState(false);

  useEffect(() => {
    const fetchLabName = async () => {
      if (!asset?.allocated_lab) {
        setLabName('');
        return;
      }

      setLoadingLab(true);
      try {
        // Since labs table doesn't exist, we'll use the allocated_lab value directly
        setLabName(asset.allocated_lab);
      } catch (error) {
        console.error('Error fetching lab name:', error);
        setLabName(asset.allocated_lab); // Fallback to ID if error
      } finally {
        setLoadingLab(false);
      }
    };

    const fetchCreatorName = async () => {
      if (!asset?.created_by) {
        setCreatorName('');
        return;
      }

      // If creator is already populated from the relationship, use it
      if (asset.creator?.name) {
        setCreatorName(asset.creator.name);
        return;
      }

      setLoadingCreator(true);
      try {
        const { data: creatorData, error } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', asset.created_by)
          .maybeSingle();  // Use maybeSingle instead of single to handle empty results

        if (error) {
          console.error('Error fetching creator name:', error);
          setCreatorName('');
        } else if (creatorData) {
          setCreatorName(creatorData.name || '');
        } else {
          setCreatorName('');
        }
      } catch (error) {
        console.error('Error fetching creator name:', error);
        setCreatorName('');
      } finally {
        setLoadingCreator(false);
      }
    };

    fetchLabName();
    fetchCreatorName();
  }, [asset?.allocated_lab, asset?.created_by, asset?.creator?.name]);

  if (!asset) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Asset Details
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
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Basic Information</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Asset ID:</span> {asset.asset_id || 'Pending...'}</p>
                <p className="text-sm"><span className="font-medium">Name:</span> {asset.name_of_supply}</p>
                <p className="text-sm"><span className="font-medium">Type:</span> {asset.asset_type}</p>
                <p className="text-sm"><span className="font-medium">Lab: </span> 
                  {loadingLab ? (
                  <span className="text-gray-400">Loading lab name...</span>
                  ) : (
                    labName || asset.allocated_lab
                  )}
                </p>
                <p className="text-sm"><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    asset.approved 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {asset.approved ? 'Approved' : 'Pending Approval'}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Financial Details</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Quantity:</span> {asset.quantity}</p>
                <p className="text-sm"><span className="font-medium">Rate:</span> ₹{asset.rate}</p>
                <p className="text-sm"><span className="font-medium">Total Amount:</span> ₹{asset.total_amount}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Additional Information</h3>
            <div className="space-y-1">
              <p className="text-sm"><span className="font-medium">Description:</span> {asset.description || 'N/A'}</p>
              <p className="text-sm"><span className="font-medium">Invoice Number:</span> {asset.invoice_number || 'N/A'}</p>
              <p className="text-sm"><span className="font-medium">Remarks:</span> {asset.remark || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Creation Details</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Created By:</span> {loadingCreator ? 'Loading...' : creatorName}</p>
                <p className="text-sm"><span className="font-medium">Created At:</span> {new Date(asset.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Approval Details</h3>
              <div className="space-y-1">
                {asset.approved_by && (
                  <p className="text-sm">
                    <span className="font-medium">HOD Approved By:</span> {asset.approver?.name || ''}
                    {asset.approved_at && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        ({new Date(asset.approved_at).toLocaleDateString()})
                      </span>
                    )}
                  </p>
                )}
                {asset.approved_by_lab_incharge && (
                  <p className="text-sm">
                    <span className="font-medium">Lab Incharge Approved By:</span> {asset.approver_lab_incharge?.name || ''}
                    {asset.approved_at_lab_incharge && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        ({new Date(asset.approved_at_lab_incharge).toLocaleDateString()})
                      </span>
                    )}
                  </p>
                )}
                {!asset.approved_by && !asset.approved_by_lab_incharge && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending approval</p>
                )}
                {asset.approved && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✓ Fully Approved
                  </p>
                )}
              </div>
            </div>
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

export default AssetDetailsModal;
