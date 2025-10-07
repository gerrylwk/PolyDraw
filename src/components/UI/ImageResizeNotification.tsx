import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface ImageResizeNotificationProps {
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  onDismiss: () => void;
}

export const ImageResizeNotification: React.FC<ImageResizeNotificationProps> = ({
  originalWidth,
  originalHeight,
  newWidth,
  newHeight,
  onDismiss
}) => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-md animate-slide-in">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-900 mb-1">
            Image Automatically Resized
          </h4>
          <p className="text-sm text-amber-800 mb-2">
            Your image was resized to optimize performance:
          </p>
          <div className="bg-white rounded px-3 py-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-600">Original:</span>
              <span className="text-gray-900 font-semibold">
                {originalWidth} × {originalHeight}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-600">Resized to:</span>
              <span className="text-blue-600 font-semibold">
                {newWidth} × {newHeight}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-600 hover:text-amber-800 transition-colors flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
