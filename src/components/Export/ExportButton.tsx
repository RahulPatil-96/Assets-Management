import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { ExportService, ExportFormat } from '../../lib/exportService';
import { Asset, AssetIssue, AssetTransfer } from '../../lib/supabase';

interface ExportButtonProps {
  data: Asset[] | AssetIssue[] | AssetTransfer[];
  type: 'assets' | 'issues' | 'transfers';
  fileName?: string;
  className?: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  type,
  fileName,
  className = '',
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (disabled || data.length === 0) return;

    setIsExporting(true);
    setShowFormatMenu(false);

    try {
      const exportFileName = fileName || ExportService.generateFileName(type, format);

      if (type === 'assets') {
        // Type guard to ensure data is Asset[]
        if (data.length > 0 && 'name_of_supply' in data[0]) {
          await ExportService.exportAssets(data as Asset[], format, exportFileName);
        } else {
          throw new Error('Invalid data type for assets export');
        }
      } else if (type === 'issues') {
        // Type guard to ensure data is AssetIssue[]
        if (data.length > 0 && 'issue_description' in data[0]) {
          await ExportService.exportIssues(data as AssetIssue[], format, exportFileName);
        } else {
          throw new Error('Invalid data type for issues export');
        }
      } else if (type === 'transfers') {
        // Type guard to ensure data is AssetTransfer[]
        if (data.length > 0 && 'from_lab' in data[0]) {
          await ExportService.exportTransfers(data as AssetTransfer[], format, exportFileName);
        } else {
          throw new Error('Invalid data type for transfers export');
        }
      }
    } catch (_error) {
      // console.error(`Error exporting ${type} to ${format}:`, _error);
      alert(`Failed to export ${type} report. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const formats = ExportService.getAvailableFormats();

  return (
    <div className='relative inline-block'>
      <button
        onClick={() => setShowFormatMenu(!showFormatMenu)}
        disabled={disabled || data.length === 0}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          disabled || data.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
            : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
        } ${className}`}
      >
        <Download className='w-4 h-4' />
        <span>Export Report</span>
        {isExporting && (
          <div className='ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
        )}
      </button>

      {showFormatMenu && (
        <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10'>
          <div className='p-2'>
            {formats.map(format => (
              <button
                key={format.value}
                onClick={() => handleExport(format.value)}
                disabled={isExporting}
                className='flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors'
              >
                {format.value === 'pdf' ? (
                  <FileText className='w-4 h-4 text-red-500' />
                ) : (
                  <FileSpreadsheet className='w-4 h-4 text-green-500' />
                )}
                <span>{format.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showFormatMenu && (
        <div className='fixed inset-0 z-0' onClick={() => setShowFormatMenu(false)} />
      )}
    </div>
  );
};

export default ExportButton;
