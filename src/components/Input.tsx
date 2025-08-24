import { ChangeEvent, ReactNode, Ref } from 'react';

interface InputProps {
  label?: string;
  name: string;
  type?: string;
  value?: string | number;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
  reference?: Ref<HTMLInputElement>;
}

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
}: InputProps) {
  return (
    <div className="flex flex-col text-left">
      {label && (
        <label htmlFor={name} className="mb-1 text-white/80 dark:text-gray-300 text-sm font-medium">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          ref={reference}
          className={
            `w-full px-4 py-2 rounded-md border border-white/20 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ease-in-out ` +
            `dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 ` +
            className
          }
          aria-label={label}
        />
        {icon && (
          <div className="absolute right-3 cursor-pointer select-none text-white/60 dark:text-gray-400" style={{ padding: '4px' }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
