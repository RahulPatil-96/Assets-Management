import React, { useEffect, useState } from 'react';
import { LabService } from '../../lib/labService';
import { Lab, CreateLabRequest, UpdateLabRequest } from '../../types/lab';
import { useAuth } from '../../contexts/AuthContext';
import { ListItemSkeleton } from '../Layout/LoadingSkeleton';
import Button from '../Button';
import ConfirmationModal from '../Layout/ConfirmationModal';

const LabManagementPage: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLabId, setEditingLabId] = useState<string | null>(null);

  const [newLab, setNewLab] = useState<CreateLabRequest>({
    name: '',
    description: '',
    location: '',
    lab_identifier: '',
  });

  const [editLab, setEditLab] = useState<UpdateLabRequest>({
    name: '',
    description: '',
    location: '',
    lab_identifier: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [labToDelete, setLabToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { profile } = useAuth();

  const fetchLabs = async () => {
    try {
      const fetchedLabs = await LabService.getLabs();
      setLabs(fetchedLabs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch labs: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleCreateLab = async () => {
    if (!profile) return setError('User profile not found');
    if (profile.role !== 'HOD') return setError('Only HOD can create labs');

    try {
      await LabService.createLab(newLab);
      setShowCreateForm(false);
      setNewLab({ name: '', description: '', location: '', lab_identifier: '' });
      fetchLabs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to create lab: ${errorMessage}`);
    }
  };

  const confirmDelete = async () => {
    if (!labToDelete) return;

    setIsDeleting(true);
    try {
      await LabService.deleteLab(labToDelete);
      fetchLabs();
      setShowDeleteModal(false);
      setLabToDelete(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to delete lab: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateLab = async () => {
    if (!profile) return setError('User profile not found');
    if (profile.role !== 'HOD') return setError('Only HOD can update labs');
    if (!editingLabId) return setError('No lab selected for editing');

    try {
      await LabService.updateLab(editingLabId, editLab);
      setEditingLabId(null);
      setEditLab({ name: '', description: '', location: '', lab_identifier: '' });
      fetchLabs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update lab: ${errorMessage}`);
    }
  };

  const startEditingLab = (lab: Lab) => {
    setEditingLabId(lab.id);
    setEditLab({
      name: lab.name,
      description: lab.description || '',
      location: lab.location || '',
      lab_identifier: lab.lab_identifier || '',
    });
  };

  const cancelEdit = () => {
    setEditingLabId(null);
    setEditLab({ name: '', description: '', location: '', lab_identifier: '' });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <ListItemSkeleton count={3} className="h-20" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600 dark:text-red-400">{error}</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lab Management</h2>
        {profile?.role === 'HOD' && !showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} variant="primary" size="md">
            Create Lab
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-4 p-4 border rounded bg-white dark:bg-gray-800 shadow">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Create New Lab
          </h3>
          {['name', 'description', 'location', 'lab_identifier'].map(field => (
            <input
              key={field}
              type="text"
              placeholder={field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              value={(newLab as any)[field]}
              onChange={e => setNewLab({ ...newLab, [field]: e.target.value })}
              className="border p-2 rounded mb-2 w-full dark:bg-gray-700 dark:text-white"
            />
          ))}
          <div className="flex space-x-2">
            <button onClick={handleCreateLab} className='bg-green-500 text-white px-4 py-2 rounded'>
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className='bg-gray-500 text-white px-4 py-2 rounded'
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Labs List */}
      <div className="space-y-3">
        {labs.map(lab => (
          <div
            key={lab.id}
            className="border border-gray-200 dark:border-gray-600 rounded p-4 bg-white dark:bg-gray-800"
          >
            {editingLabId === lab.id ? (
              <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-700">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Edit Lab
                </h3>
                {['name', 'description', 'location'].map(field => (
                  <input
                    key={field}
                    type="text"
                    placeholder={field}
                    value={(editLab as any)[field]}
                    onChange={e => setEditLab({ ...editLab, [field]: e.target.value })}
                    className="border p-2 rounded mb-2 w-full dark:bg-gray-700 dark:text-white"
                  />
                ))}
                <input
                  type="text"
                  placeholder="Lab Identifier"
                  value={editLab.lab_identifier}
                  disabled
                  className="border p-2 rounded mb-2 w-full bg-gray-100 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                />
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateLab} variant="success" size="md">
                    Update
                  </Button>
                  <Button onClick={cancelEdit} variant="secondary" size="md">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-medium text-lg text-gray-900 dark:text-white">{lab.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{lab.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location: {lab.location}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Identifier: {lab.lab_identifier}
                </p>
                {profile?.role === 'HOD' && (
                  <div className="flex space-x-2 mt-2">
                    <Button onClick={() => startEditingLab(lab)} variant="warning" size="sm">
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setLabToDelete(lab.id);
                      }}
                      variant="danger"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setLabToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Lab"
        message="Are you sure you want to delete this lab? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        isLoading={isDeleting}
        destructive
      />
    </div>
  );
};

export default LabManagementPage;
