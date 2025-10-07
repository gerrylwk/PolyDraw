import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  icon
}) => {
  // Base button styling with semantic class names
  const buttonBaseStyles = 'polydraw-button inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Variant-specific styling with semantic naming
  const buttonVariants = {
    primary: 'polydraw-button--primary bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'polydraw-button--secondary bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
    danger: 'polydraw-button--danger bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    ghost: 'polydraw-button--ghost bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500'
  };

  // Size variants with semantic naming
  const buttonSizes = {
    sm: 'polydraw-button--small px-2 py-1 text-xs',
    md: 'polydraw-button--medium px-4 py-2 text-sm',
    lg: 'polydraw-button--large px-6 py-3 text-base'
  };

  // Disabled state styling
  const buttonDisabledStyles = disabled ? 'polydraw-button--disabled opacity-50 cursor-not-allowed' : 'polydraw-button--enabled';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${buttonBaseStyles} ${buttonVariants[variant]} ${buttonSizes[size]} ${buttonDisabledStyles} ${className}`}
      data-testid="polydraw-button"
      data-variant={variant}
      data-size={size}
    >
      {icon && <span className="polydraw-button__icon mr-2">{icon}</span>}
      <span className="polydraw-button__content">{children}</span>
    </button>
  );
};
