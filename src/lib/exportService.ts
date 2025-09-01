import { Asset, AssetIssue, supabase } from './supabase';
import { AnalyticsService } from './analyticsService';
import { PDFExportService } from './pdfExportService';
import { ExcelExportService } from './excelExportService';

export class ExportService {
  static async exportAssets(assets: Asset[], format: 'pdf' | 'excel', fileName?: string) {
    const analytics = AnalyticsService.analyzeAssets(assets);

    // Fetch lab data for mapping lab IDs to lab names
    const { data: labsData, error } = await supabase.from('labs').select('id, name');

    const labs: { [id: string]: string } = {};
    if (!error && labsData) {
      labsData.forEach(lab => {
        labs[lab.id] = lab.name;
      });
    }

    if (format === 'pdf') {
      await PDFExportService.exportAssetsToPDF(assets, analytics, fileName, labs);
    } else {
      await ExcelExportService.exportAssetsToExcel(assets, analytics, fileName, labs);
    }
  }

  static async exportIssues(
    issues: AssetIssue[],
    format: 'pdf' | 'excel',
    fileName?: string,
    labs?: { [id: string]: string }
  ) {
    // If labs mapping is not provided, fetch it
    let labMapping = labs;
    if (!labMapping) {
      const { data: labsData, error } = await supabase.from('labs').select('id, name');

      const fetchedLabMapping: { [id: string]: string } = {};
      if (!error && labsData) {
        labsData.forEach(lab => {
          fetchedLabMapping[lab.id] = lab.name;
        });
      }
      labMapping = fetchedLabMapping;
    }

    const analytics = AnalyticsService.analyzeIssues(issues, labMapping);

    if (format === 'pdf') {
      await PDFExportService.exportIssuesToPDF(issues, analytics, fileName, labMapping);
    } else {
      await ExcelExportService.exportIssuesToExcel(issues, analytics, fileName, labMapping);
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
