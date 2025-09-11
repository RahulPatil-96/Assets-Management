import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Users, Search, Key, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PasswordService } from '../../lib/passwordService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import EditUserModal from '../Users/EditUserModal';
import DeleteUserModal from '../Users/DeleteUserModal';

interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  role: 'HOD' | 'Lab Assistant' | 'Lab Incharge';
  name: string;
  lab_id: string;
  lab_name?: string;
  created_at: string;
  updated_at: string;
}

interface PasswordUpdateModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (userId: string, newPassword: string) => Promise<void>;
}

const PasswordUpdateModal: React.FC<PasswordUpdateModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!newPassword) {
      setError('Password is required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onUpdate(user.auth_id, newPassword);
      toast.success(`Password updated successfully for ${user.name}`);
      onClose();
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4'>
        <div className='p-6'>
          <div className='flex items-center space-x-3 mb-4'>
            <Key className='h-6 w-6 text-blue-600' />
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Update Password
            </h3>
          </div>

          <div className='mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              <strong>User:</strong> {user.name}
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              <strong>Email:</strong> {user.email}
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              <strong>Role:</strong> {user.role}
            </p>
          </div>

          {error && (
            <div className='bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm border border-red-200 dark:border-red-800'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <Input
              label='New Password'
              name='newPassword'
              type='password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder='Enter new password (min. 6 characters)'
              required
            />

            <Input
              label='Confirm Password'
              name='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='Confirm new password'
              required
            />

            <div className='flex space-x-3 pt-4'>
              <Button
                type='button'
                variant='secondary'
                onClick={onClose}
                className='flex-1'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='primary'
                loading={loading}
                className='flex-1'
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const UserManagement: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Check if current user is HOD
  if (profile?.role !== 'HOD') {
    return (
      <div className='p-6'>
        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
          <p className='text-red-600 dark:text-red-400'>
            Access denied. Only HOD can manage user passwords.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('name');

      if (error) throw error;

      // Enrich with lab names
      const enrichedUsers = await Promise.all(
        data.map(async (user) => {
          if (user.lab_id) {
            try {
              const { data: lab } = await supabase
                .from('labs')
                .select('name')
                .eq('id', user.lab_id)
                .single();
              return { ...user, lab_name: lab?.name };
            } catch {
              return user;
            }
          }
          return user;
        })
      );

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (userId: string, newPassword: string) => {
    const result = await PasswordService.updateUserPassword(userId, newPassword, profile?.role);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update password');
    }

    toast.success('Password updated successfully.');
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openPasswordModal = (user: UserProfile) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const closePasswordModal = () => {
    setSelectedUser(null);
    setModalOpen(false);
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
    fetchUsers(); // Refresh the user list
    toast.success('User updated successfully');
  };

  const handleUserDeleted = () => {
    fetchUsers(); // Refresh the user list
    toast.success('User deleted successfully');
  };

  if (loading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4'></div>
          <div className='space-y-3'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='h-16 bg-gray-200 dark:bg-gray-700 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <div className='flex items-center space-x-3 mb-4'>
          <Users className='h-8 w-8 text-blue-600' />
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            User Management
          </h1>
        </div>
        <p className='text-gray-600 dark:text-gray-400'>
          Manage user accounts and passwords for your organization.
        </p>
      </div>

      <div className='mb-6'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5' />
          <Input
            name='search'
            type='text'
            placeholder='Search users by name, email, or role...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 dark:bg-gray-700'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  User
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Role
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Lab
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
              {filteredUsers.map((user) => (
                <tr key={user.id} className='hover:bg-gray-50 dark:hover:bg-gray-700'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div>
                      <div className='text-sm font-medium text-gray-900 dark:text-white'>
                        {user.name}
                      </div>
                      <div className='text-sm text-gray-500 dark:text-gray-400'>
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'>
                      {user.role}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {user.lab_name || user.lab_id || 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <div className='flex space-x-2'>
                      <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => openEditModal(user)}
                        className='inline-flex items-center space-x-1'
                      >
                        <Edit className='h-4 w-4' />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => openPasswordModal(user)}
                        className='inline-flex items-center space-x-1'
                      >
                        <Key className='h-4 w-4' />
                        <span>Password</span>
                      </Button>
                      <Button
                        variant='danger'
                        size='sm'
                        onClick={() => openDeleteModal(user)}
                        className='inline-flex items-center space-x-1'
                      >
                        <Trash2 className='h-4 w-4' />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className='text-center py-12'>
            <Users className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
              No users found
            </h3>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              {searchTerm ? 'Try adjusting your search terms.' : 'No users available.'}
            </p>
          </div>
        )}
      </div>

      <PasswordUpdateModal
        user={selectedUser}
        isOpen={modalOpen}
        onClose={closePasswordModal}
        onUpdate={handlePasswordUpdate}
      />

      <EditUserModal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        user={userToEdit}
        onUserUpdated={handleUserUpdated}
      />

      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        user={userToDelete}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
};
