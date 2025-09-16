import React from 'react';

export interface InputProps {
  type?: 'text' | 'number' | 'range' | 'file' | 'checkbox';
  value?: string | number;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
  disabled?: boolean;
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  checked,
  onChange,
  placeholder,
  className = '',
  min,
  max,
  step,
  accept,
  disabled = false,
  label
}) => {
  const baseClasses = 'border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const textInputClasses = 'px-3 py-2';
  const rangeClasses = 'h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer';
  const checkboxClasses = 'sr-only';
  
  const getInputClasses = () => {
    switch (type) {
      case 'range':
        return `${rangeClasses} ${className}`;
      case 'checkbox':
        return `${checkboxClasses} ${className}`;
      default:
        return `${baseClasses} ${textInputClasses} ${className}`;
    }
  };

  const input = (
    <input
      type={type}
      value={type === 'checkbox' ? undefined : value}
      checked={type === 'checkbox' ? checked : undefined}
      onChange={onChange}
      placeholder={placeholder}
      className={getInputClasses()}
      min={min}
      max={max}
      step={step}
      accept={accept}
      disabled={disabled}
    />
  );

  if (type === 'checkbox' && label) {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        {input}
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
      </label>
    );
  }

  return input;
};
