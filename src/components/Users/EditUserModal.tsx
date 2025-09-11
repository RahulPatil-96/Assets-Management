import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { PasswordService } from '../../lib/passwordService';
import { UserProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUserUpdated: () => void;
}

interface LabOption {
  id: string;
  name: string;
  lab_identifier: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Lab Assistant' as 'HOD' | 'Lab Assistant' | 'Lab Incharge',
    lab_id: '',
    password: '',
  });
  const [labs, setLabs] = useState<LabOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email || '',
        role: user.role,
        lab_id: user.lab_id || '',
        password: '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchLabs();
    }
  }, [isOpen]);

  const fetchLabs = async () => {
    try {
      const { data, error } = await supabase
        .from('labs')
        .select('id, name, lab_identifier')
        .order('name');

      if (error) throw error;
      setLabs(data || []);
    } catch (err) {
      console.error('Error fetching labs:', err);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }

      // Handle password update
      if (formData.password.trim()) {
        let passwordResult;

        // Check if this is self-password change
        if (profile?.id === user.auth_id) {
          passwordResult = await PasswordService.updateCurrentUserPassword(formData.password.trim());
        } else {
          passwordResult = await PasswordService.updateUserPassword(user.auth_id, formData.password.trim(), profile?.role);
        }

        if (!passwordResult.success) {
          throw new Error(passwordResult.error || 'Password update failed');
        }
      }

      // Call the database function to update user profile (without password)
      const { error: updateError } = await supabase.rpc('update_user_profile', {
        p_user_id: user.id,
        p_name: formData.name.trim(),
        p_email: formData.email.trim(),
        p_role: formData.role,
        p_lab_id: formData.lab_id || null,
      });

      if (updateError) throw updateError;

      onUserUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit User</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('role', e.target.value as 'HOD' | 'Lab Assistant' | 'Lab Incharge')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Lab Assistant">Lab Assistant</option>
              <option value="Lab Incharge">Lab Incharge</option>
              <option value="HOD">HOD</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab
            </label>
            <select
              value={formData.lab_id}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleInputChange('lab_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Lab Assigned</option>
              {labs.map((lab: LabOption) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} ({lab.lab_identifier})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={'leave blank to keep unchanged'}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
