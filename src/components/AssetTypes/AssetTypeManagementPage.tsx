import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAssetTypes, createAssetType, updateAssetType, deleteAssetType, AssetType } from '../../lib/assetTypeService';
import Button from '../Button';
import ConfirmationModal from '../Layout/ConfirmationModal';

const AssetTypeManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<AssetType | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
  });

  useEffect(() => {
    loadAssetTypes();
  }, []);

  const loadAssetTypes = async () => {
    try {
      const types = await fetchAssetTypes();
      setAssetTypes(types);
    } catch (error) {
      console.error('Error loading asset types:', error);
      toast.error('Failed to load asset types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== 'HOD') {
      toast.error('Only HOD can manage asset types');
      return;
    }

    try {
      if (editingType) {
        await updateAssetType(editingType.id, formData.name, formData.identifier);
        toast.success('Asset type updated successfully');
      } else {
        await createAssetType(formData.name, formData.identifier);
        toast.success('Asset type created successfully');
      }
      loadAssetTypes();
      setShowForm(false);
      setEditingType(null);
      setFormData({ name: '', identifier: '' });
    } catch (error: any) {
      console.error('Error saving asset type:', error);
      toast.error(error.message || 'Failed to save asset type');
    }
  };

  const handleEdit = (type: AssetType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      identifier: type.identifier,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setTypeToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!typeToDelete) return;

    setIsDeleting(true);
    try {
      await deleteAssetType(typeToDelete);
      toast.success('Asset type deleted successfully');
      loadAssetTypes();
    } catch (error: any) {
      console.error('Error deleting asset type:', error);
      toast.error(error.message || 'Failed to delete asset type');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setTypeToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTypeToDelete(null);
    setIsDeleting(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingType(null);
    setFormData({ name: '', identifier: '' });
  };

  if (loading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6'></div>
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
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
          Asset Type Management
        </h1>
        {profile?.role === 'HOD' && (
          <Button
            onClick={() => setShowForm(true)}
            variant='primary'
            size='md'
            className='flex items-center space-x-2'
          >
            <Plus className='w-4 h-4' />
            <span>Add Asset Type</span>
          </Button>
        )}
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
        {assetTypes.length === 0 ? (
          <div className='text-center py-12'>
            <Settings className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
            <p className='text-gray-500 dark:text-gray-300'>No asset types found</p>
            {profile?.role === 'HOD' && (
              <p className='text-gray-400 dark:text-gray-500 mt-2'>
                Click "Add Asset Type" to create your first asset type
              </p>
            )}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Sr No
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Name
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Identifier
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Created At
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {assetTypes.map((type, index) => (
                  <tr key={type.id} className='border-b border-gray-200 dark:border-gray-600'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                      {index + 1}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                      {type.name}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                      {type.identifier}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                      {new Date(type.created_at).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400'>
                      {profile?.role === 'HOD' && (
                        <div className='flex space-x-2'>
                          <Button
                            onClick={() => handleEdit(type)}
                            variant='edit'
                            size='sm'
                          >
                            <Edit className='w-4 h-4' />
                          </Button>
                          <Button
                            onClick={() => handleDelete(type.id)}
                            variant='trash'
                            size='sm'
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Asset Type Form Modal */}
      {showForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full'>
            <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
              <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                {editingType ? 'Edit Asset Type' : 'Add New Asset Type'}
              </h2>
              <Button onClick={handleCancel} variant='ghost' size='sm'>
                ×
              </Button>
            </div>

            <form onSubmit={handleSubmit} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Name *
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Identifier *
                </label>
                <input
                  type='text'
                  value={formData.identifier}
                  onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200'
                  required
                  placeholder='e.g., cpu, printer, laptop'
                />
              </div>

              <div className='flex justify-end space-x-3 pt-4'>
                <Button onClick={handleCancel} variant='danger' size='sm'>
                  Cancel
                </Button>
                <Button type='submit' variant='primary' size='md'>
                  {editingType ? 'Update' : 'Create'} Asset Type
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title='Delete Asset Type'
        message='Are you sure you want to delete this asset type? This action cannot be undone and may affect existing assets.'
        confirmText='Delete'
        cancelText='Cancel'
        type='delete'
        isLoading={isDeleting}
        destructive={true}
      />
    </div>
  );
};

export default AssetTypeManagementPage;
