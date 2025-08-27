import ExcelJS from 'exceljs';
import { Asset, AssetIssue } from './supabase';
import { AssetAnalytics, IssueAnalytics } from './analyticsService';

export class ExcelExportService {
  // Helper: Add title (merged, bold, centered)
  static addTitle(sheet: ExcelJS.Worksheet, title: string, row = 1, colStart = 1, colEnd = 8) {
    sheet.mergeCells(row, colStart, row, colEnd);
    const cell = sheet.getCell(row, colStart);
    cell.value = title;
    cell.font = { size: 16, bold: true };
    cell.alignment = { horizontal: 'center' };
  }

  // Helper: Add subtitle (merged, centered)
  static addSubtitle(sheet: ExcelJS.Worksheet, subtitle: string, row: number, colStart = 1, colEnd = 8) {
    sheet.mergeCells(row, colStart, row, colEnd);
    const cell = sheet.getCell(row, colStart);
    cell.value = subtitle;
    cell.alignment = { horizontal: 'center' };
  }

  // Helper: Add summary table starting at given row
  static addSummary(sheet: ExcelJS.Worksheet, summaryData: [string, string | number][], startRow: number, colLabel = 1, colValue = 2) {
    sheet.mergeCells(startRow - 1, colLabel, startRow - 1, colValue);
    const headerCell = sheet.getCell(startRow - 1, colLabel);
    headerCell.value = 'Summary';
    headerCell.font = { size: 14, bold: true };

    summaryData.forEach(([label, value], i) => {
      const labelCell = sheet.getCell(startRow + i, colLabel);
      const valueCell = sheet.getCell(startRow + i, colValue);
      labelCell.value = label;
      labelCell.font = { bold: true };
      valueCell.value = value;

      // Number formatting for currency or numbers
      if (typeof value === 'number') {
        if (label.toLowerCase().includes('cost') || label.toLowerCase().includes('total')) {
          valueCell.numFmt = '₹#,##0.00';
        } else {
          valueCell.numFmt = '#,##0';
        }
      }
    });
  }

  // Helper: Add headers row with fill color and center alignment
  static addHeaders(sheet: ExcelJS.Worksheet, row: number, headers: string[], fillColorHex: string) {
    headers.forEach((header, i) => {
      const cell = sheet.getCell(row, i + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColorHex }
      };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  // Helper: Auto format all columns width of a sheet
  static autoFormatColumns(sheet: ExcelJS.Worksheet, width = 18) {
    sheet.columns.forEach(col => {
      col.width = width;
    });
  }

  // Helper: Download workbook with correct filename & single .xlsx extension
  static async downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      fileName += '.xlsx';
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Export Assets Report
  static async exportAssetsToExcel(assets: Asset[], analytics: AssetAnalytics, fileName = 'assets-report.xlsx') {
    const workbook = new ExcelJS.Workbook();

    // --- Asset Details Sheet ---
    const sheet = workbook.addWorksheet('Asset Details');

    // Titles
    this.addTitle(sheet, 'Asset Management Report', 1, 1, 8);
    this.addSubtitle(sheet, `Generated on: ${new Date().toLocaleDateString()}`, 2, 1, 8);

    // Summary
    const summaryData: [string, string | number][] = [
      ['Total Assets', analytics.totalAssets],
      ['Total Quantity', analytics.totalQuantity],
      ['Total Cost', analytics.totalCost],
      ['Approved Assets', analytics.approvedAssets],
      ['Pending Approval', analytics.pendingAssets]
    ];
    this.addSummary(sheet, summaryData, 4);

    // Add some space before next section
    sheet.mergeCells('A9:H9');
    const assetTitleCell = sheet.getCell('A9');
    assetTitleCell.value = 'Asset Details';
    assetTitleCell.font = { size: 14, bold: true };

    // Headers
    const headers = ['Name', 'Type', 'Lab', 'Quantity', 'Rate', 'Total', 'Status', 'Created Date'];
    this.addHeaders(sheet, 11, headers, 'FF3B82F6'); // Blue

    // Data rows
    assets.forEach((asset, idx) => {
      const rowNum = 12 + idx;
      sheet.getCell(rowNum, 1).value = asset.name_of_supply;
      sheet.getCell(rowNum, 2).value = asset.asset_type;
      sheet.getCell(rowNum, 3).value = asset.allocated_lab;
      sheet.getCell(rowNum, 4).value = asset.quantity;
      sheet.getCell(rowNum, 5).value = asset.rate;
      sheet.getCell(rowNum, 5).numFmt = '₹#,##0.00';
      const total = asset.quantity * asset.rate;
      sheet.getCell(rowNum, 6).value = total;
      sheet.getCell(rowNum, 6).numFmt = '₹#,##0.00';

      // Status with color + icon
      const statusCell = sheet.getCell(rowNum, 7);
      if (asset.approved) {
        statusCell.value = '✓ Approved';
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF22C55E' } // green
        };
      } else {
        statusCell.value = '⚠️ Pending';
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF87171' } // red
        };
      }
      statusCell.font = { bold: true };
      statusCell.alignment = { horizontal: 'center' };

      // Created date
      const createdDateCell = sheet.getCell(rowNum, 8);
      createdDateCell.value = new Date(asset.created_at);
      createdDateCell.numFmt = 'mm/dd/yyyy';
    });

    // Auto format columns
    this.autoFormatColumns(sheet);

    // --- Analytics Sheet ---
    const analyticsSheet = workbook.addWorksheet('Analytics');

    this.addTitle(analyticsSheet, 'Asset Analytics', 1, 1, 3);

    // Analytics Overview text block
    analyticsSheet.getCell('A3').value = 'Analytics Overview';
    analyticsSheet.getCell('A3').font = { size: 14, bold: true };

    // Distribution by Lab text with counts formatted as requested
    let row = 5;
    analyticsSheet.getCell(`A${row}`).value = 'Distribution by Lab:';
    analyticsSheet.getCell(`A${row}`).font = { bold: true };
    row++;

    for (const [lab, count] of Object.entries(analytics.byLab)) {
      analyticsSheet.getCell(`A${row}`).value = `${lab}: ${count} assets`;
      row++;
    }

    // Empty row
    row++;

    // Cost by Lab text with currency formatting like your example
    analyticsSheet.getCell(`A${row}`).value = 'Cost by Lab:';
    analyticsSheet.getCell(`A${row}`).font = { bold: true };
    row++;

    for (const [lab, cost] of Object.entries(analytics.costByLab)) {
      // Format cost with "Rs." and commas
      const costFormatted = `Rs.${cost.toLocaleString('en-IN')}`;
      analyticsSheet.getCell(`A${row}`).value = `${lab}: ${costFormatted}`;
      row++;
    }

    // Add some space before detailed tables
    row += 2;

    // Detailed Distribution by Lab Table
    analyticsSheet.getCell(`A${row}`).value = 'Distribution by Lab';
    analyticsSheet.getCell(`A${row}`).font = { size: 14, bold: true };
    row++;

    analyticsSheet.getCell(`A${row}`).value = 'Lab';
    analyticsSheet.getCell(`B${row}`).value = 'Count';
    analyticsSheet.getRow(row).font = { bold: true };
    analyticsSheet.getRow(row).alignment = { horizontal: 'center' };
    row++;

    for (const [lab, count] of Object.entries(analytics.byLab)) {
      analyticsSheet.getCell(`A${row}`).value = lab;
      analyticsSheet.getCell(`B${row}`).value = count;
      row++;
    }

    row += 2;

    // Cost by Lab Table
    analyticsSheet.getCell(`A${row}`).value = 'Cost by Lab';
    analyticsSheet.getCell(`A${row}`).font = { size: 14, bold: true };
    row++;

    analyticsSheet.getCell(`A${row}`).value = 'Lab';
    analyticsSheet.getCell(`B${row}`).value = 'Cost';
    analyticsSheet.getRow(row).font = { bold: true };
    analyticsSheet.getRow(row).alignment = { horizontal: 'center' };
    row++;

    for (const [lab, cost] of Object.entries(analytics.costByLab)) {
      analyticsSheet.getCell(`A${row}`).value = lab;
      analyticsSheet.getCell(`B${row}`).value = cost;
      analyticsSheet.getCell(`B${row}`).numFmt = '₹#,##0.00';
      row++;
    }

    row += 2;

    // Distribution by Type Table
    analyticsSheet.getCell(`A${row}`).value = 'Distribution by Type';
    analyticsSheet.getCell(`A${row}`).font = { size: 14, bold: true };
    row++;

    analyticsSheet.getCell(`A${row}`).value = 'Type';
    analyticsSheet.getCell(`B${row}`).value = 'Count';
    analyticsSheet.getRow(row).font = { bold: true };
    analyticsSheet.getRow(row).alignment = { horizontal: 'center' };
    row++;

    for (const [type, count] of Object.entries(analytics.byType)) {
      analyticsSheet.getCell(`A${row}`).value = type;
      analyticsSheet.getCell(`B${row}`).value = count;
      row++;
    }

    this.autoFormatColumns(analyticsSheet);

    // Download the file
    await this.downloadWorkbook(workbook, fileName);
  }

  // Export Issues Report (similar structure, can be extended similarly)
  static async exportIssuesToExcel(issues: AssetIssue[], analytics: IssueAnalytics, fileName = 'issues-report.xlsx') {
    const workbook = new ExcelJS.Workbook();

    // --- Issue Details Sheet ---
    const sheet = workbook.addWorksheet('Issue Details');

    this.addTitle(sheet, 'Issue Management Report', 1, 1, 6);
    this.addSubtitle(sheet, `Generated on: ${new Date().toLocaleDateString()}`, 2, 1, 6);

    // Summary Section
    const summaryData: [string, string | number][] = [
      ['Total Issues', analytics.totalIssues],
      ['Open Issues', analytics.openIssues],
      ['Resolved Issues', analytics.resolvedIssues],
      ['Resolution Rate', `${analytics.resolutionRate.toFixed(1)}%`],
      ['Estimated Repair Cost', analytics.costAnalysis.estimatedRepairCost],
      ['Replacement Cost', analytics.costAnalysis.replacementCost],
      ['Total Potential Cost', analytics.costAnalysis.totalPotentialCost]
    ];
    this.addSummary(sheet, summaryData, 4, 1, 2);

    sheet.mergeCells('A12:F12');
    const issuesTitleCell = sheet.getCell('A12');
    issuesTitleCell.value = 'Issue Details';
    issuesTitleCell.font = { size: 14, bold: true };

    // Headers
    const headers = ['Asset', 'Lab', 'Description', 'Status', 'Reported Date', 'Resolved Date'];
    this.addHeaders(sheet, 14, headers, 'FFEF4444'); // Red

    // Data rows
    issues.forEach((issue, idx) => {
      const rowNum = 15 + idx;
      sheet.getCell(rowNum, 1).value = issue.asset?.name_of_supply || 'Unknown';
      sheet.getCell(rowNum, 2).value = issue.asset?.allocated_lab || 'Unknown';
      sheet.getCell(rowNum, 3).value = issue.issue_description;

      // Status with color + icon
      const statusCell = sheet.getCell(rowNum, 4);
      const status = issue.status.toLowerCase();
      if (status === 'resolved') {
        statusCell.value = '✓ Resolved';
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF22C55E' } // green
        };
      } else if (status === 'open') {
        statusCell.value = '⚠️ Open';
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF87171' } // red
        };
      } else {
        statusCell.value = issue.status;
      }
      statusCell.font = { bold: true };
      statusCell.alignment = { horizontal: 'center' };

      sheet.getCell(rowNum, 5).value = new Date(issue.reported_at);
      sheet.getCell(rowNum, 5).numFmt = 'mm/dd/yyyy';

      const resolvedCell = sheet.getCell(rowNum, 6);
      if (issue.resolved_at) {
        resolvedCell.value = new Date(issue.resolved_at);
        resolvedCell.numFmt = 'mm/dd/yyyy';
      } else {
        resolvedCell.value = '-';
        resolvedCell.alignment = { horizontal: 'center' };
      }
    });

    this.autoFormatColumns(sheet, 20);

    // --- Analytics Sheet ---
    const analyticsSheet = workbook.addWorksheet('Analytics');
    this.addTitle(analyticsSheet, 'Issue Analytics', 1, 1, 3);

    analyticsSheet.getCell('A3').value = 'Issues by Lab';
    analyticsSheet.getCell('A3').font = { bold: true };

    let row = 4;
    Object.entries(analytics.issuesByLab).forEach(([lab, count]) => {
      analyticsSheet.getCell(`A${row}`).value = lab;
      analyticsSheet.getCell(`B${row}`).value = count;
      row++;
    });

    row += 2;

    analyticsSheet.getCell('A10').value = 'Cost Analysis';
    analyticsSheet.getCell('A10').font = { bold: true };

    const costData: [string, number][] = [
      ['Estimated Repair Cost', analytics.costAnalysis.estimatedRepairCost],
      ['Replacement Cost', analytics.costAnalysis.replacementCost],
      ['Total Potential Cost', analytics.costAnalysis.totalPotentialCost]
    ];

    costData.forEach(([label, value], i) => {
      analyticsSheet.getCell(`A${11 + i}`).value = label;
      analyticsSheet.getCell(`B${11 + i}`).value = value;
      analyticsSheet.getCell(`B${11 + i}`).numFmt = '₹#,##0.00';
    });

    this.autoFormatColumns(analyticsSheet, 20);

    // Download file
    await this.downloadWorkbook(workbook, fileName);
  }
}
