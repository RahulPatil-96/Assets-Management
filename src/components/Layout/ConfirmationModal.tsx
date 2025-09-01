import React from 'react';
import { X, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

export type ConfirmationType = 'delete' | 'approve' | 'warning' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  isLoading?: boolean;
  destructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
  destructive = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className='w-6 h-6 text-red-600' />;
      case 'approve':
        return <CheckCircle className='w-6 h-6 text-green-600' />;
      case 'warning':
        return <AlertTriangle className='w-6 h-6 text-yellow-600' />;
      case 'info':
        return <AlertTriangle className='w-6 h-6 text-blue-600' />;
      default:
        return <AlertTriangle className='w-6 h-6 text-yellow-600' />;
    }
  };

  const getButtonColor = () => {
    if (destructive) return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    switch (type) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'approve':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !isLoading) {
      onConfirm();
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
      role='dialog'
      aria-modal='true'
      aria-labelledby='confirmation-modal-title'
      aria-describedby='confirmation-modal-description'
      onKeyDown={handleKeyDown}
    >
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4'>
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center space-x-3'>
            {getIcon()}
            <h2
              id='confirmation-modal-title'
              className='text-lg font-semibold text-gray-900 dark:text-white'
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
            aria-label='Close confirmation modal'
            disabled={isLoading}
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-6'>
          <p id='confirmation-modal-description' className='text-gray-600 dark:text-gray-300 mb-6'>
            {message}
          </p>

          <div className='flex space-x-3 justify-end'>
            <button
              onClick={onClose}
              className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={isLoading}
              aria-label={cancelText}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white ${getButtonColor()} rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isLoading}
              aria-label={confirmText}
              autoFocus
            >
              {isLoading ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Processing...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
