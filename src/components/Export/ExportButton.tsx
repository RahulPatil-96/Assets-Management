import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { ExportService, ExportFormat } from '../../lib/exportService';

interface ExportButtonProps {
  data: any[];
  type: 'assets' | 'issues';
  fileName?: string;
  className?: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  type,
  fileName,
  className = '',
  disabled = false
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
        await ExportService.exportAssets(data, format, exportFileName);
      } else {
        await ExportService.exportIssues(data, format, exportFileName);
      }
    } catch (error) {
      console.error(`Error exporting ${type} to ${format}:`, error);
      alert(`Failed to export ${type} report. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const formats = ExportService.getAvailableFormats();

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowFormatMenu(!showFormatMenu)}
        disabled={disabled || data.length === 0}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          disabled || data.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
            : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
        } ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Export Report</span>
        {isExporting && (
          <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        )}
      </button>

      {showFormatMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <div className="p-2">
            {formats.map((format) => (
              <button
                key={format.value}
                onClick={() => handleExport(format.value)}
                disabled={isExporting}
                className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                {format.value === 'pdf' ? (
                  <FileText className="w-4 h-4 text-red-500" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-green-500" />
                )}
                <span>{format.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showFormatMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowFormatMenu(false)}
        />
      )}
    </div>
  );
};

export default ExportButton;
