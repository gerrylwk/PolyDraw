import React from 'react';

export interface LoadingIndicatorProps {
  progress?: number;
  message?: string;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  progress = 0,
  message = 'Loading...',
  className = ''
}) => {
  return (
    <div className={`polydraw-loading-indicator flex flex-col items-center justify-center gap-3 ${className}`} data-testid="polydraw-loading-indicator">
      <div className="polydraw-loading-indicator__content relative w-full max-w-xs">
        <div className="polydraw-loading-indicator__track h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="polydraw-loading-indicator__bar h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <div className="polydraw-loading-indicator__labels flex justify-between items-center mt-2">
          <span className="polydraw-loading-indicator__message text-sm text-gray-600">{message}</span>
          <span className="polydraw-loading-indicator__percentage text-sm font-semibold text-blue-500">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <div className="polydraw-loading-indicator__dots flex gap-1">
        <div className="polydraw-loading-indicator__dot w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="polydraw-loading-indicator__dot w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="polydraw-loading-indicator__dot w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};
