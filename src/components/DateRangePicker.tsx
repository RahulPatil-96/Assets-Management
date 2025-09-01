import React from 'react';

/**
 * Props for the DateRangePicker component
 */
export interface DateRangePickerProps {
  /** The start date value */
  fromDate: string;
  /** Function called when the start date changes */
  onFromDateChange: (date: string) => void;
  /** The end date value */
  toDate: string;
  /** Function called when the end date changes */
  onToDateChange: (date: string) => void;
  /** Label for the date range picker */
  label?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Minimum selectable date */
  minDate?: string;
  /** Maximum selectable date */
  maxDate?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  label,
  disabled = false,
  className = '',
  minDate,
  maxDate,
}) => {
  /**
   * Handles the from date change event
   * @param event - The change event from the date input
   */
  const handleFromDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFromDateChange(event.target.value);
  };

  /**
   * Handles the to date change event
   * @param event - The change event from the date input
   */
  const handleToDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToDateChange(event.target.value);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <span className='text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 whitespace-nowrap'>
          {label}
        </span>
      )}
      <div className='flex flex-col sm:flex-row gap-2'>
        <div className='flex-1'>
          <label
            htmlFor='fromDate'
            className='block text-gray-700 dark:text-gray-300 font-medium text-sm mb-1 whitespace-nowrap'
          >
            From:
          </label>
          <input
            type='date'
            id='fromDate'
            value={fromDate}
            onChange={handleFromDateChange}
            disabled={disabled}
            min={minDate}
            max={toDate || maxDate}
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-colors duration-200'
            aria-label='Start date'
          />
        </div>
        <div className='flex-1'>
          <label
            htmlFor='toDate'
            className='block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1 whitespace-nowrap'
          >
            To:
          </label>
          <input
            type='date'
            id='toDate'
            value={toDate}
            onChange={handleToDateChange}
            disabled={disabled}
            min={fromDate || minDate}
            max={maxDate}
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 transition-colors duration-200'
            aria-label='End date'
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
