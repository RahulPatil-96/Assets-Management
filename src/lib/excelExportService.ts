import ExcelJS from 'exceljs';
import { Asset, AssetIssue } from './supabase';
import { AssetAnalytics, IssueAnalytics } from './analyticsService';

export class ExcelExportService {
  static async exportAssetsToExcel(assets: Asset[], analytics: AssetAnalytics, fileName: string = 'assets-report.xlsx') {
    const workbook = new ExcelJS.Workbook();
    
    // Main Assets Sheet
    const assetsSheet = workbook.addWorksheet('Asset Details');
    
    // Add title
    assetsSheet.mergeCells('A1:H1');
    assetsSheet.getCell('A1').value = 'Asset Management Report';
    assetsSheet.getCell('A1').font = { size: 16, bold: true };
    assetsSheet.getCell('A1').alignment = { horizontal: 'center' };
    
    assetsSheet.mergeCells('A2:H2');
    assetsSheet.getCell('A2').value = `Generated on: ${new Date().toLocaleDateString()}`;
    assetsSheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Summary Section
    assetsSheet.mergeCells('A4:B4');
    assetsSheet.getCell('A4').value = 'Summary';
    assetsSheet.getCell('A4').font = { size: 14, bold: true };
    
    const summaryData = [
      ['Total Assets', analytics.totalAssets],
      ['Total Quantity', analytics.totalQuantity],
      ['Total Cost', analytics.totalCost],
      ['Approved Assets', analytics.approvedAssets],
      ['Pending Approval', analytics.pendingAssets]
    ];
    
    summaryData.forEach(([label, value], index) => {
      assetsSheet.getCell(`A${5 + index}`).value = label;
      assetsSheet.getCell(`B${5 + index}`).value = value;
      assetsSheet.getCell(`B${5 + index}`).numFmt = '#,##0';
    });
    
    assetsSheet.getCell('B7').numFmt = '₹#,##0.00';
    
    // Assets Table
    assetsSheet.mergeCells('A9:H9');
    assetsSheet.getCell('A9').value = 'Asset Details';
    assetsSheet.getCell('A9').font = { size: 14, bold: true };
    
    // Headers
    const headers = ['Name', 'Type', 'Lab', 'Quantity', 'Rate', 'Total', 'Status', 'Created Date'];
    headers.forEach((header, index) => {
      const cell = assetsSheet.getCell(11, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' }
      };
      cell.alignment = { horizontal: 'center' };
    });
    
    // Data rows
    assets.forEach((asset, rowIndex) => {
      const row = 12 + rowIndex;
      assetsSheet.getCell(row, 1).value = asset.name_of_supply;
      assetsSheet.getCell(row, 2).value = asset.asset_type;
      assetsSheet.getCell(row, 3).value = asset.allocated_lab;
      assetsSheet.getCell(row, 4).value = asset.quantity;
      assetsSheet.getCell(row, 5).value = asset.rate;
      assetsSheet.getCell(row, 5).numFmt = '₹#,##0.00';
      assetsSheet.getCell(row, 6).value = asset.quantity * asset.rate;
      assetsSheet.getCell(row, 6).numFmt = '₹#,##0.00';
      assetsSheet.getCell(row, 7).value = asset.approved ? 'Approved' : 'Pending';
      assetsSheet.getCell(row, 8).value = new Date(asset.created_at);
      assetsSheet.getCell(row, 8).numFmt = 'mm/dd/yyyy';
    });
    
    // Analytics Sheet
    const analyticsSheet = workbook.addWorksheet('Analytics');
    
    analyticsSheet.mergeCells('A1:C1');
    analyticsSheet.getCell('A1').value = 'Asset Analytics';
    analyticsSheet.getCell('A1').font = { size: 16, bold: true };
    
    // Lab Distribution
    analyticsSheet.getCell('A3').value = 'Distribution by Lab';
    analyticsSheet.getCell('A3').font = { bold: true };
    
    let row = 4;
    Object.entries(analytics.byLab).forEach(([lab, count]) => {
      analyticsSheet.getCell(`A${row}`).value = lab;
      analyticsSheet.getCell(`B${row}`).value = count;
      row++;
    });
    
    // Cost by Lab
    analyticsSheet.getCell('A10').value = 'Cost by Lab';
    analyticsSheet.getCell('A10').font = { bold: true };
    
    row = 11;
    Object.entries(analytics.costByLab).forEach(([lab, cost]) => {
      analyticsSheet.getCell(`A${row}`).value = lab;
      analyticsSheet.getCell(`B${row}`).value = cost;
      analyticsSheet.getCell(`B${row}`).numFmt = '₹#,##0.00';
      row++;
    });
    
    // Type Distribution
    analyticsSheet.getCell('A20').value = 'Distribution by Type';
    analyticsSheet.getCell('A20').font = { bold: true };
    
    row = 21;
    Object.entries(analytics.byType).forEach(([type, count]) => {
      analyticsSheet.getCell(`A${row}`).value = type;
      analyticsSheet.getCell(`B${row}`).value = count;
      row++;
    });
    
    // Format columns
    [assetsSheet, analyticsSheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        column.width = 15;
      });
    });
    
    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  static async exportIssuesToExcel(issues: AssetIssue[], analytics: IssueAnalytics, fileName: string = 'issues-report.xlsx') {
    const workbook = new ExcelJS.Workbook();
    
    // Main Issues Sheet
    const issuesSheet = workbook.addWorksheet('Issue Details');
    
    // Add title
    issuesSheet.mergeCells('A1:F1');
    issuesSheet.getCell('A1').value = 'Issue Management Report';
    issuesSheet.getCell('A1').font = { size: 16, bold: true };
    issuesSheet.getCell('A1').alignment = { horizontal: 'center' };
    
    issuesSheet.mergeCells('A2:F2');
    issuesSheet.getCell('A2').value = `Generated on: ${new Date().toLocaleDateString()}`;
    issuesSheet.getCell('A2').alignment = { horizontal: 'center' };
    
    // Summary Section
    issuesSheet.mergeCells('A4:B4');
    issuesSheet.getCell('A4').value = 'Summary';
    issuesSheet.getCell('A4').font = { size: 14, bold: true };
    
    const summaryData = [
      ['Total Issues', analytics.totalIssues],
      ['Open Issues', analytics.openIssues],
      ['Resolved Issues', analytics.resolvedIssues],
      ['Resolution Rate', `${analytics.resolutionRate.toFixed(1)}%`],
      ['Estimated Repair Cost', analytics.costAnalysis.estimatedRepairCost],
      ['Replacement Cost', analytics.costAnalysis.replacementCost],
      ['Total Potential Cost', analytics.costAnalysis.totalPotentialCost]
    ];
    
    summaryData.forEach(([label, value], index) => {
      issuesSheet.getCell(`A${5 + index}`).value = label;
      issuesSheet.getCell(`B${5 + index}`).value = value;
      if (typeof value === 'number' && value > 1000) {
        issuesSheet.getCell(`B${5 + index}`).numFmt = '₹#,##0.00';
      }
    });
    
    // Issues Table
    issuesSheet.mergeCells('A12:F12');
    issuesSheet.getCell('A12').value = 'Issue Details';
    issuesSheet.getCell('A12').font = { size: 14, bold: true };
    
    // Headers
    const headers = ['Asset', 'Lab', 'Description', 'Status', 'Reported Date', 'Resolved Date'];
    headers.forEach((header, index) => {
      const cell = issuesSheet.getCell(14, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEF4444' }
      };
      cell.alignment = { horizontal: 'center' };
    });
    
    // Data rows
    issues.forEach((issue, rowIndex) => {
      const row = 15 + rowIndex;
      issuesSheet.getCell(row, 1).value = issue.asset?.name_of_supply || 'Unknown';
      issuesSheet.getCell(row, 2).value = issue.asset?.allocated_lab || 'Unknown';
      issuesSheet.getCell(row, 3).value = issue.issue_description;
      issuesSheet.getCell(row, 4).value = issue.status;
      issuesSheet.getCell(row, 5).value = new Date(issue.reported_at);
      issuesSheet.getCell(row, 5).numFmt = 'mm/dd/yyyy';
      issuesSheet.getCell(row, 6).value = issue.resolved_at ? new Date(issue.resolved_at) : '-';
      if (issue.resolved_at) {
        issuesSheet.getCell(row, 6).numFmt = 'mm/dd/yyyy';
      }
    });
    
    // Analytics Sheet
    const analyticsSheet = workbook.addWorksheet('Analytics');
    
    analyticsSheet.mergeCells('A1:C1');
    analyticsSheet.getCell('A1').value = 'Issue Analytics';
    analyticsSheet.getCell('A1').font = { size: 16, bold: true };
    
    // Issues by Lab
    analyticsSheet.getCell('A3').value = 'Issues by Lab';
    analyticsSheet.getCell('A3').font = { bold: true };
    
    let row = 4;
    Object.entries(analytics.issuesByLab).forEach(([lab, count]) => {
      analyticsSheet.getCell(`A${row}`).value = lab;
      analyticsSheet.getCell(`B${row}`).value = count;
      row++;
    });
    
    // Cost Analysis
    analyticsSheet.getCell('A10').value = 'Cost Analysis';
    analyticsSheet.getCell('A10').font = { bold: true };
    
    const costData = [
      ['Estimated Repair Cost', analytics.costAnalysis.estimatedRepairCost],
      ['Replacement Cost', analytics.costAnalysis.replacementCost],
      ['Total Potential Cost', analytics.costAnalysis.totalPotentialCost]
    ];
    
    costData.forEach(([label, value], index) => {
      analyticsSheet.getCell(`A${11 + index}`).value = label;
      analyticsSheet.getCell(`B${11 + index}`).value = value;
      analyticsSheet.getCell(`B${11 + index}`).numFmt = '₹#,##0.00';
    });
    
    // Format columns
    [issuesSheet, analyticsSheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        column.width = 20;
      });
    });
    
    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
