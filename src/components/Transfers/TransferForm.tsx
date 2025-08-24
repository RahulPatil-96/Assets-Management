import React, { useState, useEffect } from 'react';
import { X, Save, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Asset } from '../../lib/supabase';

interface TransferFormProps {
  onClose: () => void;
  onSave: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ onClose, onSave }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    asset_id: '',
    to_lab: '',
  });

  useEffect(() => {
    fetchAssets();
  }, [profile]);

  const fetchAssets = async () => {
    if (!profile?.lab_id) return;

    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('approved', true)
        .eq('allocated_lab', profile.lab_id)
        .order('name_of_supply');

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('asset_transfers')
        .insert({
          ...formData,
          from_lab: profile?.lab_id,
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
    } catch (error) {
      console.error('Error initiating transfer:', error);
      alert('Error initiating transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.name_of_supply.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Initiate Asset Transfer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search and Select Asset *
            </label>
            <div className="relative mb-2">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search assets in your lab..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
              />
            </div>
            
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
              {filteredAssets.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No assets found in your lab
                </div>
              ) : (
                filteredAssets.map((asset) => (
                  <label
                    key={asset.id}
                    className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                  >
                    <input
                      type="radio"
                      name="asset_id"
                      value={asset.id}
                      checked={formData.asset_id === asset.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, asset_id: e.target.value }))}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{asset.name_of_supply}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">SR: {asset.sr_no}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transfer To Lab *
            </label>
            <input
              type="text"
              value={formData.to_lab}
              onChange={(e) => setFormData(prev => ({ ...prev, to_lab: e.target.value }))}
              placeholder="e.g., CSE-LAB-02"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
              required
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-200">
              <strong>Note:</strong> This transfer will move the asset from <strong>{profile?.lab_id}</strong> to <strong>{formData.to_lab || '[Destination Lab]'}</strong>. 
              The receiving lab assistant must confirm receipt to complete the transfer.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.asset_id || !formData.to_lab}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Initiating...' : 'Initiate Transfer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferForm;