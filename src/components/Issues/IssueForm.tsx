import React, { useState, useEffect } from 'react';
import { X, Save, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Asset } from '../../lib/supabase';
import { Lab } from '../../types/lab';
import Button from '../Button';

interface IssueFormProps {
  onClose: () => void;
  onSave: () => void;
}

const IssueForm: React.FC<IssueFormProps> = ({ onClose, onSave }) => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLab, setSelectedLab] = useState<string>('');
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    asset_id: '',
    issue_description: '',
  });

  useEffect(() => {
    fetchAssets();
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const { data, error } = await supabase
        .from('labs')
        .select('id, name, description, location, lab_identifier, created_at, updated_at');
      if (error) throw error;
      setLabs(data || []);
    } catch (_error) {
      // console.error('Error fetching labs:', _error);
    }
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('approved', true)
        .order('name_of_supply');

      if (error) throw error;
      setAssets(data || []);
    } catch (_error) {
      // console.error('Error fetching assets:', _error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('asset_issues')
        .insert({
          ...formData,
          reported_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Issue reported successfully!');
      onSave();
  } catch (_error) {
    console.error('Error reporting issue:', _error);
    console.error('Error details:', {
      message: _error instanceof Error ? _error.message : 'Unknown error',
      code: (_error as any)?.code,
      details: (_error as any)?.details,
      hint: (_error as any)?.hint,
    });
    toast.error('Error reporting issue. Please try again.');
  } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const labName = labs.find(l => l.id === asset.allocated_lab)?.name || '';
    const matchesSearchTerm =
      asset.name_of_supply.toLowerCase().includes(searchTerm.toLowerCase()) ||
      labName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.sr_no.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.asset_id && asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSelectedLab = selectedLab
      ? labs.find(l => l.name === selectedLab)?.id === asset.allocated_lab
      : true;

    return matchesSearchTerm && matchesSelectedLab;
  });

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            Report Asset Issue
          </h2>
          <Button onClick={onClose} variant='ghost' size='sm'><X></X></Button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Select Lab *
            </label>
            <select
              value={selectedLab}
              onChange={e => setSelectedLab(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
              required
            >
              <option value=''>Select a lab</option>
              {labs.map(lab => (
                <option key={lab.id} value={lab.name}>
                  {lab.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Search and Select Asset *
            </label>
            <div className='relative mb-2'>
              <Search className='w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5' />
              <input
                type='text'
                placeholder='Search by asset name, lab, or SR number...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
              />
            </div>

            <div className='border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto'>
              {filteredAssets.length === 0 ? (
                <div className='p-4 text-center text-gray-500 dark:text-gray-400'>
                  No assets found
                </div>
              ) : (
                filteredAssets.map(asset => (
                  <label
                    key={asset.id}
                    className='flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0'
                  >
                    <input
                      type='radio'
                      name='asset_id'
                      value={asset.id}
                      checked={formData.asset_id === asset.id}
                      onChange={e => setFormData(prev => ({ ...prev, asset_id: e.target.value }))}
                      className='mr-3'
                    />
                    <div className='flex-1'>
                      <p className='font-medium text-gray-900 dark:text-gray-100'>
                        {asset.name_of_supply}
                      </p>
                      <p className='text-sm text-gray-500 dark:text-gray-400'>
                        SR: {asset.sr_no} • Lab:{' '}
                        {labs.find(l => l.id === asset.allocated_lab)?.name || asset.allocated_lab}
                      </p>
                      {asset.asset_id && (
                        <p className='text-xs text-gray-400 dark:text-gray-500'>
                          ID: {asset.asset_id}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              Issue Description *
            </label>
            <textarea
              value={formData.issue_description}
              onChange={e => setFormData(prev => ({ ...prev, issue_description: e.target.value }))}
              rows={4}
              placeholder='Describe the issue in detail...'
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
              required
            />
          </div>

          <div className='flex justify-end space-x-3 pt-4'>
            <Button onClick={onClose} variant='secondary' size='md' className='w-48'>
              Close
            </Button>

            <Button
              type="submit"
              disabled={
                loading || !formData.asset_id || !formData.issue_description || !selectedLab
              }
              variant="danger" // Using 'danger' variant for red styling
              loading={loading}
              icon={<Save className="w-4 h-4" />}
            >
              {loading ? 'Reporting...' : 'Report Issue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueForm;
