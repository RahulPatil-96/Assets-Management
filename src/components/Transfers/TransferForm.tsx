import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Asset } from '../../lib/supabase';
import { LabService } from '../../lib/labService';
import Button from '../Button';

// UUID validation
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Helper to resolve lab_id (whether it's a UUID or a lab name)
const resolveLabId = async (labIdentifier: string | null): Promise<string | null> => {
  if (!labIdentifier) return null;

  // If it's already a UUID, return it
  if (isValidUUID(labIdentifier)) {
    return labIdentifier;
  }

  // Otherwise treat it as a lab name and look up the UUID
  const { data, error } = await supabase
    .from('labs')
    .select('id')
    .eq('name', labIdentifier)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
};

interface TransferFormProps {
  onClose: () => void;
  onSave: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ onClose, onSave }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [labs, setLabs] = useState<{ id: string; name: string }[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    asset_id: '',
    to_lab: '',
  });

  // Fetch assets for the logged-in user's lab
  const fetchAssets = useCallback(async () => {
    if (!profile?.lab_id) return;

    try {
      const labUuid = await resolveLabId(profile.lab_id);
      if (!labUuid) {
        setAssets([]);
        return;
      }

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('approved', true)
        .eq('allocated_lab', labUuid)
        .order('name_of_supply');

      if (error) throw error;
      setAssets(data || []);
    } catch {
      setAssets([]);
    }
  }, [profile?.lab_id]);

  useEffect(() => {
    if (profile?.role === 'Lab Incharge') {
      fetchAssets();
    }
  }, [profile?.role, profile?.lab_id, fetchAssets]);

  // Fetch labs for dropdown
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const fetchedLabs = await LabService.getLabs();
        setLabs(fetchedLabs);
      } catch {
        // fail silently
      }
    };

    fetchLabs();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        // Validate UUIDs
        if (!isValidUUID(formData.to_lab)) {
          throw new Error('Invalid destination lab ID format');
        }
        if (!isValidUUID(formData.asset_id)) {
          throw new Error('Invalid asset ID format');
        }

        // Resolve source lab UUID
        const sourceLabId = await resolveLabId(profile?.lab_id || null);
        if (!sourceLabId) {
          throw new Error('Unable to find source lab information');
        }

        // Insert into asset_transfers
        const { error } = await supabase.from('asset_transfers').insert({
          ...formData,
          from_lab: sourceLabId,
          initiated_by: profile?.id,
        });

        if (error) throw error;

        // Update asset's allocated_lab
        const { error: updateError } = await supabase
          .from('assets')
          .update({ allocated_lab: formData.to_lab })
          .eq('id', formData.asset_id);

        if (updateError) throw updateError;

        onSave();
        onClose();
      } catch (_error) {
        alert(
          `Error initiating transfer: ${
            _error instanceof Error ? _error.message : 'Unknown error'
          }`
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, profile?.lab_id, profile?.id, onSave, onClose]
  );

  if (profile?.role !== 'Lab Incharge') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="mt-4 text-gray-700 dark:text-gray-300">
            Only Lab Incharge can initiate asset transfers.
          </p>
          <Button onClick={onClose} className="mt-4" variant="primary" size="md">
            Close
          </Button>
        </div>
      </div>
    );
  }

  const filteredAssets = assets.filter(asset =>
    asset.asset_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Initiate Asset Transfer
          </h2>
          <Button onClick={onClose} variant='ghost' size='sm'><X></X></Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Asset selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search and Select Asset by Asset ID *
            </label>
            <div className="relative mb-2">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search assets by asset ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
              />
            </div>

            <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
              {filteredAssets.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No assets found in your lab
                </div>
              ) : (
                filteredAssets.map(asset => (
                  <label
                    key={asset.id}
                    className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  >
                    <input
                      type="radio"
                      name="asset_id"
                      value={asset.id}
                      checked={formData.asset_id === asset.id}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, asset_id: e.target.value }))
                      }
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {asset.asset_id}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Name: {asset.name_of_supply}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Destination lab */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transfer To Lab *
            </label>
            <select
              value={formData.to_lab}
              onChange={e => setFormData(prev => ({ ...prev, to_lab: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
              required
            >
              <option value="">Select a lab</option>
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>
                  {lab.name}
                </option>
              ))}
            </select>
          </div>

          {/* Info note */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              <strong>Note:</strong> This transfer will move the asset from{' '}
              <strong>{profile?.lab_name || profile?.lab_id}</strong> to{' '}
              <strong>
                {labs.find(lab => lab.id === formData.to_lab)?.name || '[Destination Lab]'}
              </strong>
              . The receiving lab assistant must confirm receipt to complete the transfer.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" onClick={onClose} variant="secondary" size="md">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.asset_id || !formData.to_lab}
              variant="primary"
              size="md"
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Initiating...' : 'Initiate Transfer'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferForm;