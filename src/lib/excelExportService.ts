import * as ExcelJS from 'exceljs';
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
  static addSubtitle(
    sheet: ExcelJS.Worksheet,
    subtitle: string,
    row: number,
    colStart = 1,
    colEnd = 8
  ) {
    sheet.mergeCells(row, colStart, row, colEnd);
    const cell = sheet.getCell(row, colStart);
    cell.value = subtitle;
    cell.alignment = { horizontal: 'center' };
  }

  // Helper: Add summary table starting at given row
  static addSummary(
    sheet: ExcelJS.Worksheet,
    summaryData: [string, string | number][],
    startRow: number,
    colLabel = 1,
    colValue = 2
  ) {
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
  static addHeaders(
    sheet: ExcelJS.Worksheet,
    row: number,
    headers: string[],
    fillColorHex: string
  ) {
    headers.forEach((header, i) => {
      const cell = sheet.getCell(row, i + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fillColorHex },
      };
      cell.alignment = { horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }

  // Helper: Auto format all columns width of a sheet
  static autoFormatColumns(sheet: ExcelJS.Worksheet, width = 18) {
    sheet.columns.forEach(col => {
      col.width = width;
    });
  }

  // Helper: Apply zebra striping to data rows
  static applyZebraStriping(
    sheet: ExcelJS.Worksheet,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ) {
    for (let row = startRow; row <= endRow; row++) {
      const isEvenRow = row % 2 === 0;
      for (let col = startCol; col <= endCol; col++) {
        const cell = sheet.getCell(row, col);
        if (isEvenRow) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }, // Light gray for even rows
          };
        } else {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' }, // White for odd rows
          };
        }
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }
  }

  // Helper: Download workbook with correct filename & single .xlsx extension
  static async downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      fileName += '.xlsx';
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Export Assets Report
  static async exportAssetsToExcel(
    assets: Asset[],
    analytics: AssetAnalytics,
    fileName = 'assets-report.xlsx',
    labs: { [id: string]: string } = {}
  ) {
    const workbook = new ExcelJS.Workbook();

    // --- Asset Details Sheet ---
    const sheet = workbook.addWorksheet('Asset Details');

    // Titles
    this.addTitle(sheet, 'Asset Management Report', 1, 1, 6);
    this.addSubtitle(sheet, `Generated on: ${new Date().toLocaleDateString()}`, 2, 1, 6);

    // Summary
    const summaryData: [string, string | number][] = [
      ['Total Assets', analytics.totalAssets],
      ['Total Cost', analytics.totalCost],
      ['Approved Assets', analytics.approvedAssets],
      ['Pending Approval', analytics.pendingAssets],
    ];
    this.addSummary(sheet, summaryData, 4);

    // Add some space before next section
    sheet.mergeCells('A9:F9');
    const assetTitleCell = sheet.getCell('A9');
    assetTitleCell.value = 'Asset Details';
    assetTitleCell.font = { size: 14, bold: true };

    // Headers
    const headers = ['Name', 'Type', 'Lab', 'Price', 'Status', 'Created Date'];
    this.addHeaders(sheet, 11, headers, 'FF3B82F6'); // Blue

    // Data rows
    assets.forEach((asset, idx) => {
      const rowNum = 12 + idx;
      sheet.getCell(rowNum, 1).value = asset.name_of_supply;
      sheet.getCell(rowNum, 2).value = asset.asset_type;
      sheet.getCell(rowNum, 3).value = labs[asset.allocated_lab] || asset.allocated_lab;
      sheet.getCell(rowNum, 4).value = asset.rate;
      sheet.getCell(rowNum, 4).numFmt = '₹#,##0.00';

      // Status with color + icon
      const statusCell = sheet.getCell(rowNum, 5);
      if (asset.approved) {
        statusCell.value = '✓ Approved';
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF22C55E' }, // green
        };
      } else {
        statusCell.value = '⚠️ Pending';
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF87171' }, // red
        };
      }
      statusCell.font = { bold: true };
      statusCell.alignment = { horizontal: 'center' };

      // Created date
      const createdDateCell = sheet.getCell(rowNum, 6);
      createdDateCell.value = new Date(asset.created_at);
      createdDateCell.numFmt = 'mm/dd/yyyy';
    });

    // Auto format columns
    this.applyZebraStriping(sheet, 12, 11 + assets.length, 1, 6);
    this.autoFormatColumns(sheet);

    // Add analytics summary and tables below data rows in the same sheet
    let row = 12 + assets.length + 2;

    // Analytics Overview text block
    sheet.getCell(`A${row}`).value = 'Analytics Overview';
    sheet.getCell(`A${row}`).font = { size: 14, bold: true };
    row++;

    // Distribution by Lab text with counts formatted as requested
    sheet.getCell(`A${row}`).value = 'Distribution by Lab:';
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    for (const [lab, count] of Object.entries(analytics.byLab)) {
      sheet.getCell(`A${row}`).value = `${labs[lab] || lab}: ${count} assets`;
      row++;
    }

    // Empty row
    row++;

    // Cost by Lab text with currency formatting like your example
    sheet.getCell(`A${row}`).value = 'Cost by Lab:';
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    for (const [lab, cost] of Object.entries(analytics.costByLab)) {
      const costFormatted = `Rs.${cost.toLocaleString('en-IN')}`;
      sheet.getCell(`A${row}`).value = `${labs[lab] || lab}: ${costFormatted}`;
      row++;
    }

    // Add some space before detailed tables
    row += 2;

    // Detailed Distribution by Lab Table
    sheet.getCell(`A${row}`).value = 'Distribution by Lab';
    sheet.getCell(`A${row}`).font = { size: 14, bold: true };
    row++;

    sheet.getCell(`A${row}`).value = 'Lab';
    sheet.getCell(`B${row}`).value = 'Count';
    sheet.getRow(row).font = { bold: true };
    sheet.getRow(row).alignment = { horizontal: 'center' };
    row++;

    for (const [lab, count] of Object.entries(analytics.byLab)) {
      sheet.getCell(`A${row}`).value = labs[lab] || lab;
      sheet.getCell(`B${row}`).value = count;
      row++;
    }

    row += 2;

    // Cost by Lab Table
    sheet.getCell(`A${row}`).value = 'Cost by Lab';
    sheet.getCell(`A${row}`).font = { size: 14, bold: true };
    row++;

    sheet.getCell(`A${row}`).value = 'Lab';
    sheet.getCell(`B${row}`).value = 'Cost';
    sheet.getRow(row).font = { bold: true };
    sheet.getRow(row).alignment = { horizontal: 'center' };
    row++;

    for (const [lab, cost] of Object.entries(analytics.costByLab)) {
      sheet.getCell(`A${row}`).value = labs[lab] || lab;
      sheet.getCell(`B${row}`).value = cost;
      sheet.getCell(`B${row}`).numFmt = '₹#,##0.00';
      row++;
    }

    // Distribution by Type Table
    sheet.getCell(`A${row}`).value = 'Distribution by Type';
    sheet.getCell(`A${row}`).font = { size: 14, bold: true };
    row++;

    sheet.getCell(`A${row}`).value = 'Type';
    sheet.getCell(`B${row}`).value = 'Count';
    sheet.getRow(row).font = { bold: true };
    sheet.getRow(row).alignment = { horizontal: 'center' };
    row++;

    for (const [type, count] of Object.entries(analytics.byType)) {
      sheet.getCell(`A${row}`).value = type;
      sheet.getCell(`B${row}`).value = count;
      row++;
    }

    this.autoFormatColumns(sheet);

    // Download the file
    await this.downloadWorkbook(workbook, fileName);
  }

  // Export Issues Report (similar structure, can be extended similarly)
  static async exportIssuesToExcel(
    issues: AssetIssue[],
    analytics: IssueAnalytics,
    fileName = 'issues-report.xlsx',
    labs: { [id: string]: string } = {}
  ) {
    const workbook = new ExcelJS.Workbook();

    // --- Issue Details Sheet ---
    const sheet = workbook.addWorksheet('Issue Details');

    this.addTitle(sheet, 'Issue Management Report', 1, 1, 7);
    this.addSubtitle(sheet, `Generated on: ${new Date().toLocaleDateString()}`, 2, 1, 7);

    const summaryData: [string, string | number][] = [
      ['Total Issues', analytics.totalIssues],
      ['Open Issues', analytics.openIssues],
      ['Resolved Issues', analytics.resolvedIssues],
      ['Resolution Rate', `${analytics.resolutionRate.toFixed(1)}%`],
      ['Total Repair Cost', analytics.costAnalysis.totalRepairCost],
    ];
    this.addSummary(sheet, summaryData, 4, 1, 2);
    sheet.mergeCells('A12:G12');
    const issuesTitleCell = sheet.getCell('A12');
    issuesTitleCell.value = 'Issue Details';
    issuesTitleCell.font = { size: 14, bold: true };

    // Headers
    const headers = [
      'Asset',
      'Lab',
      'Description',
      'Status',
      'Reported Date',
      'Resolved Date',
      'Repair Cost',
    ];
    this.addHeaders(sheet, 14, headers, 'FFEF4444'); // Red

    // Data rows
    issues.forEach((issue, idx) => {
      const rowNum = 15 + idx;
      sheet.getCell(rowNum, 1).value = issue.asset?.name_of_supply || 'Unknown';
      sheet.getCell(rowNum, 2).value = issue.asset?.allocated_lab
        ? labs[issue.asset.allocated_lab] || issue.asset.allocated_lab
        : 'Unknown';
      sheet.getCell(rowNum, 3).value = issue.issue_description;

      // Status with color + icon
      const statusCell = sheet.getCell(rowNum, 4);
      const status = issue.status.toLowerCase();
      if (status === 'resolved') {
        statusCell.value = '✓ Resolved';
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF22C55E' }, // green
        };
      } else if (status === 'open') {
        statusCell.value = '⚠️ Open';
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF87171' }, // red
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

      // Repair Cost
      const costCell = sheet.getCell(rowNum, 7);
      if (issue.cost_required) {
        costCell.value = issue.cost_required;
        costCell.numFmt = '₹#,##0.00';
      } else {
        costCell.value = '-';
        costCell.alignment = { horizontal: 'center' };
      }
    });

    this.applyZebraStriping(sheet, 15, 14 + issues.length, 1, 7);
    this.autoFormatColumns(sheet, 20);

    // Add analytics summary and tables below data rows in the same sheet
    let row = 15 + issues.length + 2;

    // Issues by Lab Table
    sheet.getCell(`A${row}`).value = 'Issues by Lab';
    sheet.getCell(`A${row}`).font = { size: 14, bold: true };
    row++;

    sheet.getCell(`A${row}`).value = 'Lab';
    sheet.getCell(`B${row}`).value = 'Count';
    sheet.getRow(row).font = { bold: true };
    sheet.getRow(row).alignment = { horizontal: 'center' };
    row++;

    Object.entries(analytics.issuesByLab).forEach(([lab, count]) => {
      sheet.getCell(`A${row}`).value = labs[lab] || lab;
      sheet.getCell(`B${row}`).value = count;
      row++;
    });

    row += 2;

    // Cost Analysis Table
    sheet.getCell(`A${row}`).value = 'Cost Analysis';
    sheet.getCell(`A${row}`).font = { size: 14, bold: true };
    row++;

    sheet.getCell(`A${row}`).value = 'Category';
    sheet.getCell(`B${row}`).value = 'Amount';
    sheet.getRow(row).font = { bold: true };
    sheet.getRow(row).alignment = { horizontal: 'center' };
    row++;

    const costData: [string, number][] = [
      ['Total Repair Cost', analytics.costAnalysis.totalRepairCost],
    ];

    costData.forEach(([label, value]) => {
      sheet.getCell(`A${row}`).value = label;
      sheet.getCell(`B${row}`).value = value;
      sheet.getCell(`B${row}`).numFmt = '₹#,##0.00';
      row++;
    });

    this.autoFormatColumns(sheet, 20);

    // Download file
    await this.downloadWorkbook(workbook, fileName);
  }
}
