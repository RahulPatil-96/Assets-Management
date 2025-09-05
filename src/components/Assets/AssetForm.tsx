import React, { useState, useEffect, useCallback } from 'react';
import { X, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Asset } from '../../lib/supabase';
import { NotificationService } from '../../lib/notificationService';
import { LabService } from '../../lib/labService';
import Button from '../Button';

interface AssetFormProps {
  asset?: Asset | null;
  onClose: () => void;
  onSave: () => void;
}

const AssetForm: React.FC<AssetFormProps> = ({ asset, onClose, onSave }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  // Removed unused labs, setLabs, and fetchingLab
  const [labOptions, setLabOptions] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name_of_supply: '',
    asset_type: 'other',
    invoice_number: '',
    description: '',
    rate: 0,
    remark: '',
    allocated_lab: asset?.allocated_lab || '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchLabId = async () => {
      if (asset && asset.allocated_lab) {
        // Editing asset, keep its allocated_lab
        setFormData(prev => ({
          ...prev,
          allocated_lab: asset.allocated_lab,
        }));
        return;
      }
      if (profile?.lab_id) {
        try {
          const lab = await LabService.getLabByIdentifier(profile.lab_id);
          if (lab?.id) {
            setFormData(prev => ({
              ...prev,
              allocated_lab: lab.id,
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              allocated_lab: '', // No valid lab found, show 'Select Lab'
            }));
          }
        } catch (_error: unknown) {
          setFormData(prev => ({
            ...prev,
            allocated_lab: '', // On error, show 'Select Lab'
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          allocated_lab: '', // No lab in profile, show 'Select Lab'
        }));
      }
    };

    const fetchLabs = async () => {
      try {
        const labsData = await LabService.getLabs();

        // For Lab Assistants, only show their assigned lab
        if (profile?.role === 'Lab Assistant' && profile?.lab_id) {
          const userLab = labsData.find(
            lab =>
              lab.id === profile.lab_id ||
              lab.lab_identifier === profile.lab_id ||
              lab.name === profile.lab_id
          );
          if (userLab) {
            setLabOptions([{ id: userLab.id, name: userLab.name }]);
          } else {
            setLabOptions([]);
          }
        } else {
          // For other roles, show all labs
          setLabOptions(labsData.map(lab => ({ id: lab.id, name: lab.name })));
        }
      } catch (_error) {
        // console.error('Error fetching labs:', _error);
      }
    };

    fetchLabs();
    fetchLabId();
    if (asset) {
      setFormData({
        name_of_supply: asset.name_of_supply,
        asset_type: asset.asset_type || 'other',
        invoice_number: asset.invoice_number || '',
        description: asset.description || '',
        rate: asset.rate,
        remark: asset.remark || '',
        allocated_lab: asset.allocated_lab,
        date: asset.date,
      });
    }
  }, [asset, profile?.lab_id, profile?.role]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const data = {
          ...formData,
          created_by: profile?.id,
        };

        let savedAsset: Asset | null = null;

        if (asset) {
          // Update existing asset
          const { data: updatedAsset, error } = await supabase
            .from('assets')
            .update(data)
            .eq('id', asset.id)
            .select()
            .single();

          if (error) throw error;
          savedAsset = updatedAsset;

          // Create notification for all users about the update
          if (profile?.id) {
            await NotificationService.createNotificationForAllUsers(
              profile.id,
              'update',
              'asset',
              asset.id,
              formData.name_of_supply
            );
          }
        } else {
          // Create new asset
          const { data: newAsset, error } = await supabase
            .from('assets')
            .insert(data)
            .select()
            .single();

          if (error) throw error;
          savedAsset = newAsset;

          // Create notification for all users about the creation
          if (profile?.id && savedAsset) {
          }
        }

        onSave();
        onClose();
      } catch (_error) {
        console.error('Error saving asset:', _error);
        let errorMessage = 'Error saving asset. Please try again.';
        if (_error instanceof Error) {
          errorMessage += `\n${_error.message}`;
        } else if (typeof _error === 'string') {
          errorMessage += `\n${_error}`;
        } else if (_error && typeof _error === 'object' && 'message' in _error) {
          errorMessage += `\n${(_error as any).message}`;
        }
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [asset, formData, profile?.id, onSave, onClose]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    },
    []
  );

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            {asset ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <Button onClick={onClose} variant='ghost' size='sm'><X></X></Button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Asset Name *
              </label>
              <input
                type='text'
                name='name_of_supply'
                value={formData.name_of_supply}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Asset Type *
              </label>
              <select
                name='asset_type'
                value={formData.asset_type}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
                required
              >
                <option value='cpu'>CPU</option>
                <option value='printer'>Printer</option>
                <option value='network'>Network Equipment</option>
                <option value='peripheral'>Peripheral</option>
                <option value='microcontroller'>Microcontroller</option>
                <option value='monitor'>Monitor</option>
                <option value='mouse'>Mouse</option>
                <option value='keyboard'>Keyboard</option>
                <option value='scanner'>Scanner</option>
                <option value='projector'>Projector</option>
                <option value='laptop'>Laptop</option>
                <option value='other'>Other</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Invoice Number
              </label>
              <input
                type='text'
                name='invoice_number'
                value={formData.invoice_number}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Date
              </label>
              <input
                type='date'
                name='date'
                value={formData.date}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Allocated Lab *
              </label>
              <select
                name='allocated_lab'
                value={formData.allocated_lab}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
                required
              >
                <option value='' disabled>
                  Select Lab
                </option>
                {labOptions.map(lab => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Price (₹) *
              </label>
              <input
                type='number'
                name='rate'
                value={formData.rate}
                onChange={handleChange}
                min='0'
                step='0.01'
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
                required
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Description
            </label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Remarks
            </label>
            <textarea
              name='remark'
              value={formData.remark}
              onChange={handleChange}
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
            />
          </div>

          <div className='flex justify-end space-x-3 pt-4'>
            <Button onClick={onClose} variant='danger' size='sm'>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              loading={loading}
              icon={<Save className="w-4 h-4" />}
            >
              {loading ? 'Saving...' : 'Save Asset'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;
