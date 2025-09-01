import React from 'react';

/**
 * Props for the FilterDropdown component
 */
export interface FilterDropdownProps {
  /** The label for the dropdown */
  label?: string;
  /** The current selected value */
  value: string;
  /** Function called when the value changes */
  onChange: (value: string) => void;
  /** Array of options for the dropdown */
  options: Array<{ value: string; label: string }>;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Icon to display before the dropdown */
  icon?: React.ReactNode;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  className = '',
  placeholder = 'Select an option',
  icon,
}) => {
  const id = React.useId();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          {label}
        </label>
      )}

      <div className='relative flex items-center'>
        {icon && (
          <span className='absolute left-3 text-gray-400 dark:text-gray-500 pointer-events-none'>
            {icon}
          </span>
        )}

        <select
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`pl-${icon ? '9' : '3'} pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            dark:bg-gray-700 dark:text-gray-200 transition-colors duration-200 w-full`}
          aria-label={label || placeholder}
        >
          {placeholder && (
            <option value='' disabled={value !== ''}>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterDropdown;
