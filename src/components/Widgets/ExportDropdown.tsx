import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Download, ChevronDown, Image, FileImage, FileCode } from 'lucide-react';
import { Shape, ImageInfo } from '../../types';
import { copyImageToClipboard, exportAsImage, exportAsSVG, ExportFormat } from '../../utils';

export interface ExportDropdownProps {
  shapes: Shape[];
  imageInfo: ImageInfo;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  shapes,
  imageInfo
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyToClipboard = async () => {
    if (!imageInfo.element || isExporting) return;

    setIsExporting(true);
    const success = await copyImageToClipboard(imageInfo, shapes);
    setIsExporting(false);

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (!imageInfo.element) return;

    setDropdownOpen(false);

    if (format === 'svg') {
      exportAsSVG(imageInfo, shapes);
    } else {
      exportAsImage(imageInfo, shapes, { format });
    }
  };

  const isDisabled = !imageInfo.element;

  return (
    <div className="polydraw-export-dropdown flex items-center gap-2" data-testid="export-dropdown">
      <button
        onClick={handleCopyToClipboard}
        disabled={isDisabled || isExporting}
        className={`polydraw-copy-button flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
          isDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : copied
            ? 'bg-green-500 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
        }`}
        data-testid="copy-clipboard-button"
      >
        {copied ? (
          <>
            <Check size={16} />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy size={16} />
            <span>Copy to Clipboard</span>
          </>
        )}
      </button>

      <div className="polydraw-export-menu relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          disabled={isDisabled}
          className={`polydraw-export-button flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
            isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
          data-testid="export-button"
        >
          <Download size={16} />
          <span>Export</span>
          <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="polydraw-export-options absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50">
            <button
              onClick={() => handleExport('png')}
              className="polydraw-export-option w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              data-testid="export-png-option"
            >
              <Image size={16} className="text-gray-500" />
              <span>Export as PNG</span>
            </button>
            <button
              onClick={() => handleExport('jpeg')}
              className="polydraw-export-option w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              data-testid="export-jpeg-option"
            >
              <FileImage size={16} className="text-gray-500" />
              <span>Export as JPEG</span>
            </button>
            <button
              onClick={() => handleExport('svg')}
              className="polydraw-export-option w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              data-testid="export-svg-option"
            >
              <FileCode size={16} className="text-gray-500" />
              <span>Export as SVG</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
