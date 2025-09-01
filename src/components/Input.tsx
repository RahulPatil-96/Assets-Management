import React, { ChangeEvent, ReactNode, Ref } from 'react';

/**
 * Props for the Input component
 */
export interface InputProps {
  /** The label for the input field */
  label?: string;
  /** The name attribute of the input */
  name: string;
  /** The type of input */
  type?: string;
  /** The current value of the input */
  value?: string | number;
  /** Function called when the input value changes */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Icon to display in the input */
  icon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** React ref for the input element */
  reference?: Ref<HTMLInputElement>;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * A reusable input component with consistent styling and behavior
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   name="email"
 *   type="email"
 *   value={email}
 *   onChange={handleEmailChange}
 *   placeholder="Enter your email"
 *   required
 * />
 * ```
 */
export function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  className = '',
  reference,
  disabled = false,
  required = false,
  error,
}: InputProps) {
  /**
   * Gets the base CSS classes for the input based on state
   * @returns The CSS classes for the input
   */
  const getInputClasses = (): string => {
    const baseClasses = [
      'w-full px-4 py-2 rounded-md border bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out',
      'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400',
    ];

    if (error) {
      baseClasses.push('border-red-500 focus:ring-red-500 focus:border-red-500');
    } else {
      baseClasses.push('border-white/20 focus:ring-indigo-500 focus:border-indigo-500');
    }

    if (disabled) {
      baseClasses.push('opacity-50 cursor-not-allowed');
    }

    return [...baseClasses, className].join(' ');
  };

  return (
    <div className='flex flex-col text-left'>
      {label && (
        <label htmlFor={name} className='mb-1 text-white/80 dark:text-gray-300 text-sm font-medium'>
          {label}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </label>
      )}
      <div className='relative flex items-center'>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          ref={reference}
          className={getInputClasses()}
          disabled={disabled}
          required={required}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {icon && (
          <div
            className='absolute right-3 cursor-pointer select-none text-white/60 dark:text-gray-400'
            style={{ padding: '4px' }}
          >
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p
          id={`${name}-error`}
          className='mt-1 text-sm text-red-500 dark:text-red-400'
          role='alert'
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
