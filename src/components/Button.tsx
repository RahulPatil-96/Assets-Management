import React, { ReactNode } from 'react';

/**
 * Props for the Button component
 */
export interface ButtonProps {
  /** The content of the button */
  children: ReactNode;
  /** The type of button */
  type?: 'button' | 'submit' | 'reset';
  /** The variant of the button */
  variant?: | 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'trash' | 'view' | 'edit' | 'approve' | 'gradient' | 'card';
  /** The size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Function called when the button is clicked */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Icon to display before the button text */
  icon?: ReactNode;
  /** Whether the button should take full width */
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  icon,
  fullWidth = false,
}) => {
  /**
   * Gets the base CSS classes for the button based on variant and state
   * @returns The CSS classes for the button
   */
  const getButtonClasses = (): string => {
    const baseClasses = [
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2',
      fullWidth ? 'w-full' : '',
    ];

    // Variant classes
    const variantClasses: Record<string, string> = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400',
      gradient: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 dark:from-indigo-600 dark:to-purple-700 dark:hover:from-indigo-700 dark:hover:to-purple-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition duration-200 ease-in-out',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-600',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-400',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-400',
      warning: 'bg-yellow-500 text-black hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400 dark:bg-yellow-400 dark:text-gray-900 dark:hover:bg-yellow-500 dark:focus:ring-yellow-300',
      trash: 'bg-transparent text-red-700 hover:bg-red-100 focus:ring-2 focus:ring-red-400 dark:text-red-300 dark:hover:bg-red-700 dark:focus:ring-red-600',
      edit: 'bg-transparent text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 dark:text-blue-300 dark:hover:bg-blue-700 dark:focus:ring-blue-600',
      approve: 'bg-transparent text-green-700 hover:bg-green-100 focus:ring-2 focus:ring-green-400 dark:text-green-300 dark:hover:bg-green-700 dark:focus:ring-green-600',
      view: 'bg-transparent text-purple-700 hover:bg-purple-100 focus:ring-2 focus:ring-purple-400 dark:text-purple-300 dark:hover:bg-purple-700 dark:focus:ring-purple-600',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-600',
      card: 'border border-gray-200 dark:border-gray-600 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-left shadow-sm',

    };

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    // Disabled state
    const disabledClasses =
      disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    return [
      ...baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      disabledClasses,
      className,
    ].join(' ');
  };

  /**
   * Handles the button click event
   */
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      type={type}
      className={getButtonClasses()}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && (
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' />
      )}
      {icon && !loading && <span className='mr-2'>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
