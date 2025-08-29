import React, { useEffect, useState } from 'react';
import { LabService } from '../../lib/labService';
import { Lab, CreateLabRequest, UpdateLabRequest } from '../../types/lab';
import { useAuth } from '../../contexts/AuthContext';

const LabTable: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
const [newLab, setNewLab] = useState<CreateLabRequest>({
    name: '',
    description: '',
    location: '',
    lab_identifier: '', // Add lab_identifier field
  });

const { profile } = useAuth(); // Get the user profile from AuthContext

const fetchLabs = async () => {
    try {
      const fetchedLabs = await LabService.getLabs(); // Fetch all labs
      console.log('Fetched labs:', fetchedLabs); // Log the fetched labs
      setLabs(fetchedLabs);
    } catch (_err) {
      console.error('Error fetching labs:', _err); // Log the error
      setError('Failed to fetch labs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleCreateLab = async () => {
    if (!profile) {
      setError('User profile not found');
      return;
    }
    
    // Only HOD can create labs
    if (profile.role !== 'HOD') {
      setError('Only HOD can create labs');
      return;
    }
    
    try {
      await LabService.createLab(newLab);
      setShowCreateForm(false);
      setNewLab({ name: '', description: '', location: '', lab_identifier: '' });
      fetchLabs(); // Refresh the list
    } catch (_err) {
      console.error('Error creating lab:', _err); // Log the error
      setError('Failed to create lab');
    }
  };

  const handleEditLab = async (lab: Lab) => {
    setEditingLab(lab);
  };

  const handleUpdateLab = async () => {
    if (!editingLab) return;
    try {
      const updates: UpdateLabRequest = {
        name: editingLab.name,
        description: editingLab.description,
        location: editingLab.location,
        lab_identifier: editingLab.lab_identifier,
      };
      await LabService.updateLab(editingLab.id, updates);
      setEditingLab(null);
      fetchLabs(); // Refresh the list
    } catch (_err) {
      setError('Failed to update lab');
    }
  };

  const handleDeleteLab = async (labId: string) => {
    try {
      await LabService.deleteLab(labId);
      fetchLabs(); // Refresh the list
    } catch (_err) {
      setError('Failed to delete lab');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>Lab Management</h2>

      {showCreateForm ? (
        <div className='mb-4 p-4 border rounded'>
          <h3 className='text-lg font-semibold mb-2'>Create New Lab</h3>
          <input
            type='text'
            placeholder='Lab Name'
            value={newLab.name}
            onChange={e => setNewLab({ ...newLab, name: e.target.value })}
            className='border p-2 rounded mb-2 w-full'
          />
          <input
            type='text'
            placeholder='Description'
            value={newLab.description}
            onChange={e => setNewLab({ ...newLab, description: e.target.value })}
            className='border p-2 rounded mb-2 w-full'
          />
          <input
            type='text'
            placeholder='Location'
            value={newLab.location}
            onChange={e => setNewLab({ ...newLab, location: e.target.value })}
            className='border p-2 rounded mb-2 w-full'
          />
          <input
            type='text'
            placeholder='Lab Identifier'
            value={newLab.lab_identifier}
            onChange={e => setNewLab({ ...newLab, lab_identifier: e.target.value })}
            className='border p-2 rounded mb-2 w-full'
          />
            {/* Removed Incharge ID input field as requested */}
          <div className='flex space-x-2'>
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
      ) : (
        profile?.role === 'HOD' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className='bg-blue-500 text-white px-4 py-2 rounded mb-4'
          >
            Create Lab
          </button>
        )
      )}

      <div className='space-y-3'>
        {labs.map(lab => (
          <div key={lab.id} className='border border-gray-200 dark:border-gray-600 rounded p-4'>
            {editingLab?.id === lab.id ? (
              <div>
                <input
                  type='text'
                  value={editingLab.name}
                  onChange={e => setEditingLab({ ...editingLab, name: e.target.value })}
                  className='border p-2 rounded mb-2 w-full'
                />
                <input
                  type='text'
                  value={editingLab.description}
                  onChange={e => setEditingLab({ ...editingLab, description: e.target.value })}
                  className='border p-2 rounded mb-2 w-full'
                />
                <input
                  type='text'
                  value={editingLab.location}
                  onChange={e => setEditingLab({ ...editingLab, location: e.target.value })}
                  className='border p-2 rounded mb-2 w-full'
                />
                <input
                  type='text'
                  value={editingLab.lab_identifier}
                  onChange={e => setEditingLab({ ...editingLab, lab_identifier: e.target.value })}
                  className='border p-2 rounded mb-2 w-full'
                />
                {/* Removed Incharge ID input field */}
                <div className='flex space-x-2'>
                  <button
                    onClick={handleUpdateLab}
                    className='bg-green-500 text-white px-3 py-1 rounded'
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingLab(null)}
                    className='bg-gray-500 text-white px-3 py-1 rounded'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className='font-medium text-lg'>{lab.name}</h3>
                <p className='text-sm text-gray-600'>{lab.description}</p>
                <p className='text-sm text-gray-500'>Location: {lab.location}</p>
                <p className='text-sm text-gray-500'>Identifier: {lab.lab_identifier}</p>
                {/* Removed Incharge display */}
                <div className='flex space-x-2 mt-2'>
                  <button
                    onClick={() => handleEditLab(lab)}
                    className='bg-yellow-500 text-white px-3 py-1 rounded'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteLab(lab.id)}
                    className='bg-red-500 text-white px-3 py-1 rounded'
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabTable;
