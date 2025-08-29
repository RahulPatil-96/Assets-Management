import React, { useEffect, useState } from 'react';
import { LabService } from '../../lib/labService';
import { Lab, CreateLabRequest, UpdateLabRequest } from '../../types/lab';
import { useAuth } from '../../contexts/AuthContext';

const LabTable: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  const [newLab, setNewLab] = useState<CreateLabRequest>({
    name: '',
    description: '',
    location: '',
    lab_identifier: '', // Add lab_identifier field
  });
  const [editLab, setEditLab] = useState<UpdateLabRequest>({
    name: '',
    description: '',
    location: '',
    lab_identifier: '',
  });

  const { profile } = useAuth(); // Get the user profile from AuthContext

  const fetchLabs = async () => {
    try {
      const fetchedLabs = await LabService.getLabs(); // Fetch all labs
      console.log('Fetched labs:', fetchedLabs); // Log the fetched labs
      setLabs(fetchedLabs);
    } catch (err) {
      console.error('Error fetching labs:', err); // Log the error
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
    } catch (err) {
      console.error('Error creating lab:', err); // Log the error
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to create lab: ${errorMessage}`);
    }
  };

  const handleDeleteLab = async (labId: string) => {
    try {
      console.log('Attempting to delete lab with ID:', labId);
      await LabService.deleteLab(labId);
      console.log('Lab deleted successfully');
      fetchLabs(); // Refresh the list
    } catch (err) {
      console.error('Error deleting lab:', err); // Log the error
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to delete lab: ${errorMessage}`);
    }
  };

  const handleUpdateLab = async () => {
    if (!profile) {
      setError('User profile not found');
      return;
    }
    
    // Only HOD can update labs
    if (profile.role !== 'HOD') {
      setError('Only HOD can update labs');
      return;
    }
    
    if (!editingLabId) {
      setError('No lab selected for editing');
      return;
    }
    
    try {
      await LabService.updateLab(editingLabId, editLab);
      setEditingLabId(null);
      setEditLab({ name: '', description: '', location: '', lab_identifier: '' });
      fetchLabs(); // Refresh the list
    } catch (err) {
      console.error('Error updating lab:', err); // Log the error
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
            {editingLabId === lab.id ? (
              <div className='mb-4 p-4 border rounded bg-gray-50'>
                <h3 className='text-lg font-semibold mb-2'>Edit Lab</h3>
                <input
                  type='text'
                  placeholder='Lab Name'
                  value={editLab.name}
                  onChange={e => setEditLab({ ...editLab, name: e.target.value })}
                  className='border p-2 rounded mb-2 w-full'
                />
                <input
                  type='text'
                  placeholder='Description'
                  value={editLab.description}
                  onChange={e => setEditLab({ ...editLab, description: e.target.value })}
                  className='border p-2 rounded mb-2 w-full'
                />
                <input
                  type='text'
                  placeholder='Location'
                  value={editLab.location}
                  onChange={e => setEditLab({ ...editLab, location: e.target.value })}
                  className='border p-2 rounded mb-2 w-full'
                />
                <input
                  type='text'
                  placeholder='Lab Identifier'
                  value={editLab.lab_identifier}
                  onChange={e => setEditLab({ ...editLab, lab_identifier: e.target.value })}
                  className='border p-2 rounded mb-2 w-full bg-gray-100 cursor-not-allowed'
                  disabled
                />
                <div className='flex space-x-2'>
                  <button onClick={handleUpdateLab} className='bg-green-500 text-white px-4 py-2 rounded'>
                    Update
                  </button>
                  <button
                    onClick={cancelEdit}
                    className='bg-gray-500 text-white px-4 py-2 rounded'
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
                {profile?.role === 'HOD' && (
                  <div className='flex space-x-2 mt-2'>
                    <button
                      onClick={() => startEditingLab(lab)}
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
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabTable;
