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
  // Base input styling with semantic class names
  const inputBaseStyles = 'polydraw-input border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  const inputTextStyles = 'polydraw-input--text px-3 py-2';
  const inputRangeStyles = 'polydraw-input--range h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer';
  const inputCheckboxStyles = 'polydraw-input--checkbox sr-only';
  
  // Get appropriate styling based on input type
  const getInputStyles = () => {
    const disabledStyles = disabled ? 'polydraw-input--disabled' : 'polydraw-input--enabled';
    
    switch (type) {
      case 'range':
        return `polydraw-input polydraw-input--range ${inputRangeStyles} ${disabledStyles} ${className}`;
      case 'checkbox':
        return `polydraw-input polydraw-input--checkbox ${inputCheckboxStyles} ${disabledStyles} ${className}`;
      case 'number':
        return `polydraw-input polydraw-input--number ${inputBaseStyles} ${inputTextStyles} ${disabledStyles} ${className}`;
      case 'file':
        return `polydraw-input polydraw-input--file ${inputBaseStyles} ${inputTextStyles} ${disabledStyles} ${className}`;
      default:
        return `polydraw-input polydraw-input--text ${inputBaseStyles} ${inputTextStyles} ${disabledStyles} ${className}`;
    }
  };

  const inputElement = (
    <input
      type={type}
      value={type === 'checkbox' ? undefined : value}
      checked={type === 'checkbox' ? checked : undefined}
      onChange={onChange}
      placeholder={placeholder}
      className={getInputStyles()}
      min={min}
      max={max}
      step={step}
      accept={accept}
      disabled={disabled}
      data-testid="polydraw-input"
      data-input-type={type}
    />
  );

  // Special handling for checkbox with toggle switch styling
  if (type === 'checkbox' && label) {
    return (
      <label className="polydraw-toggle-switch relative inline-flex items-center cursor-pointer" data-testid="polydraw-toggle-switch">
        {inputElement}
        <div className="polydraw-toggle-switch__track w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        <span className="polydraw-toggle-switch__label ml-3 text-sm font-medium text-gray-700">{label}</span>
      </label>
    );
  }

  return inputElement;
};
