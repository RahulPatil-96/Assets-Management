import { Asset, AssetIssue } from './supabase';
import { AnalyticsService } from './analyticsService';
import { PDFExportService } from './pdfExportService';
import { ExcelExportService } from './excelExportService';

export class ExportService {
  static async exportAssets(assets: Asset[], format: 'pdf' | 'excel', fileName?: string) {
    const analytics = AnalyticsService.analyzeAssets(assets);

    if (format === 'pdf') {
      await PDFExportService.exportAssetsToPDF(assets, analytics, fileName);
    } else {
      await ExcelExportService.exportAssetsToExcel(assets, analytics, fileName);
    }
  }

  static async exportIssues(issues: AssetIssue[], format: 'pdf' | 'excel', fileName?: string) {
    const analytics = AnalyticsService.analyzeIssues(issues);

    if (format === 'pdf') {
      await PDFExportService.exportIssuesToPDF(issues, analytics, fileName);
    } else {
      await ExcelExportService.exportIssuesToExcel(issues, analytics, fileName);
    }
  }

  static generateFileName(type: 'assets' | 'issues', format: 'pdf' | 'excel'): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${type}-report-${timestamp}.${format}`;
  }

  static getAvailableFormats(): Array<{ value: 'pdf' | 'excel'; label: string }> {
    return [
      { value: 'pdf', label: 'PDF Document' },
      { value: 'excel', label: 'Excel Spreadsheet' },
    ];
  }
}

export type ExportFormat = 'pdf' | 'excel';
