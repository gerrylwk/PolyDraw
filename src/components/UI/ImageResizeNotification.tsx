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
    <div className="polydraw-resize-notification bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-md animate-slide-in" data-testid="polydraw-resize-notification">
      <div className="polydraw-resize-notification__content flex items-start gap-3">
        <AlertCircle className="polydraw-resize-notification__icon text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="polydraw-resize-notification__body flex-1">
          <h4 className="polydraw-resize-notification__title text-sm font-semibold text-amber-900 mb-1">
            Image Automatically Resized
          </h4>
          <p className="polydraw-resize-notification__message text-sm text-amber-800 mb-2">
            Your image was resized to optimize performance:
          </p>
          <div className="polydraw-resize-notification__dimensions bg-white rounded px-3 py-2 text-xs font-mono">
            <div className="polydraw-resize-notification__dimension-row flex justify-between">
              <span className="polydraw-resize-notification__dimension-label text-gray-600">Original:</span>
              <span className="polydraw-resize-notification__dimension-value text-gray-900 font-semibold">
                {originalWidth} × {originalHeight}
              </span>
            </div>
            <div className="polydraw-resize-notification__dimension-row flex justify-between mt-1">
              <span className="polydraw-resize-notification__dimension-label text-gray-600">Resized to:</span>
              <span className="polydraw-resize-notification__dimension-value text-blue-600 font-semibold">
                {newWidth} × {newHeight}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="polydraw-resize-notification__dismiss-button text-amber-600 hover:text-amber-800 transition-colors flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
