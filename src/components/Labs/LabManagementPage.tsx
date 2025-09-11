import React, { useEffect, useState } from 'react';
import { LabService } from '../../lib/labService';
import { Lab, CreateLabRequest, UpdateLabRequest } from '../../types/';
import { UserProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ListItemSkeleton } from '../Layout/LoadingSkeleton';
import { Edit, Plus, Trash2 } from 'lucide-react';
import Button from '../Button';
import ConfirmationModal from '../Layout/ConfirmationModal';
import EditUserModal from '../Users/EditUserModal';
import DeleteUserModal from '../Users/DeleteUserModal';


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
    lab_assistant: {
      name: '',
      email: '',
      password: '',
    },
    lab_incharge: {
      name: '',
      email: '',
      password: '',
    },
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
  const [labStaff, setLabStaff] = useState<{ [labId: string]: any[] }>({});
  const [expandedLabs, setExpandedLabs] = useState<Set<string>>(new Set());
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { profile } = useAuth();

  const fetchLabs = async () => {
    try {
      const fetchedLabs = await LabService.getLabs();
      setLabs(fetchedLabs);

      // Fetch lab staff for each lab
      const staffMap: { [labId: string]: any[] } = {};
      for (const lab of fetchedLabs) {
        const staff = await LabService.getLabStaff(lab.id);
        staffMap[lab.id] = staff;
      }
      setLabStaff(staffMap);
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
      setNewLab({
        name: '',
        description: '',
        location: '',
        lab_identifier: '',
        lab_assistant: { name: '', email: '', password: '' },
        lab_incharge: { name: '', email: '', password: '' }
      });
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



  const openEditModal = (user: UserProfile) => {
    setUserToEdit(user);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setUserToEdit(null);
    setEditModalOpen(false);
  };

  const openDeleteModal = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleUserUpdated = () => {
    fetchLabs();
    closeEditModal();
  };

  const handleUserDeleted = () => {
    fetchLabs();
    closeDeleteModal();
  };

  const toggleLabExpansion = (labId: string) => {
    setExpandedLabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(labId)) {
        newSet.delete(labId);
      } else {
        newSet.add(labId);
      }
      return newSet;
    });
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
            <Plus className='w-4 h-4' />
            <span>Create Lab</span>
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
              key={`create-${field}`}
              type="text"
              placeholder={field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              value={(newLab as any)[field]}
              onChange={e => setNewLab({ ...newLab, [field]: e.target.value })}
              className="border p-2 rounded mb-2 w-full dark:bg-gray-700 dark:text-white"
            />
          ))}

          <h4 className="text-md font-semibold mt-4 mb-2 text-gray-900 dark:text-white">
            Lab Assistant Details
          </h4>
          <input
            type="text"
            placeholder="Lab Assistant Name"
            value={newLab.lab_assistant?.name || ''}
            onChange={e => setNewLab({
              ...newLab,
              lab_assistant: { ...newLab.lab_assistant!, name: e.target.value }
            })}
            className="border p-2 rounded mb-2 w-full dark:bg-gray-700 dark:text-white"
          />
          <input
            type="email"
            placeholder="Lab Assistant Email"
            value={newLab.lab_assistant?.email || ''}
            onChange={e => setNewLab({
              ...newLab,
              lab_assistant: { ...newLab.lab_assistant!, email: e.target.value }
            })}
            className="border p-2 rounded mb-2 w-full dark:bg-gray-700 dark:text-white"
          />
          <input
            type="password"
            placeholder="Lab Assistant Password"
            value={newLab.lab_assistant?.password || ''}
            onChange={e => setNewLab({
              ...newLab,
              lab_assistant: { ...newLab.lab_assistant!, password: e.target.value }
            })}
            className="border p-2 rounded mb-2 w-full dark:bg-gray-700 dark:text-white"
          />

          <h4 className="text-md font-semibold mt-4 mb-2 text-gray-900 dark:text-white">
            Lab Incharge Details
          </h4>
          <input
            type="text"
            placeholder="Lab Incharge Name"
            value={newLab.lab_incharge?.name || ''}
            onChange={e => setNewLab({
              ...newLab,
              lab_incharge: { ...newLab.lab_incharge!, name: e.target.value }
            })}
            className="border p-2 rounded mb-2 w-full dark:bg-gray-700 dark:text-white"
          />
          <input
            type="email"
            placeholder="Lab Incharge Email"
            value={newLab.lab_incharge?.email || ''}
            onChange={e => setNewLab({
              ...newLab,
              lab_incharge: { ...newLab.lab_incharge!, email: e.target.value }
            })}
            className="border p-2 rounded mb-2 w-full dark:bg-gray-700 dark:text-white"
          />
          <input
            type="password"
            placeholder="Lab Incharge Password"
            value={newLab.lab_incharge?.password || ''}
            onChange={e => setNewLab({
              ...newLab,
              lab_incharge: { ...newLab.lab_incharge!, password: e.target.value }
            })}
            className="border p-2 rounded mb-2 w-full dark:bg-gray-700 dark:text-white"
          />
          <div className="flex space-x-2">

            <Button
              onClick={handleCreateLab}
              variant="success"
            >
              Create
            </Button>

            <Button
              onClick={() => setShowCreateForm(false)}
              variant="secondary"
            >
              Cancel
            </Button>
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
                    key={`edit-${field}`}
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
                {/* Lab Header with Expand/Collapse Button */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-lg text-gray-900 dark:text-white">{lab.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{lab.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location: {lab.location}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Identifier: {lab.lab_identifier}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleLabExpansion(lab.id)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title={expandedLabs.has(lab.id) ? 'Collapse staff section' : 'Expand staff section'}
                    >
                      {expandedLabs.has(lab.id) ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                    {profile?.role === 'HOD' && (
                      <div className="flex space-x-1">
                        <Button onClick={() => startEditingLab(lab)} variant="edit" size="sm">
                          <Edit></Edit>
                        </Button>
                        <Button
                          onClick={() => {
                            setShowDeleteModal(true);
                            setLabToDelete(lab.id);
                          }}
                          variant="trash"
                          size="sm"
                        >
                          <Trash2></Trash2>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expandable Lab Staff Section */}
                {expandedLabs.has(lab.id) && (
                  <div className="mt-3 border-t border-gray-200 dark:border-gray-600 pt-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Lab Staff:</h4>
                    {labStaff[lab.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {labStaff[lab.id].map((staff: any, index: number) => (
                          <div key={`${staff.id}-${index}`} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {staff.name} ({staff.role})
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {staff.email}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                onClick={() => openEditModal(staff)}
                                variant="edit"
                                size="sm"
                              >
                                <Edit></Edit>
                              </Button>
                              <Button
                                onClick={() => openDeleteModal(staff)}
                                variant="trash"
                                size="sm"
                              >
                                <Trash2></Trash2>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No staff assigned</p>
                    )}
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

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        user={userToEdit}
        onUserUpdated={handleUserUpdated}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        user={userToDelete}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
};

export default LabManagementPage;
