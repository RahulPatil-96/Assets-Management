import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { Asset, AssetIssue } from './supabase';
import { AssetAnalytics, IssueAnalytics } from './analyticsService';

interface jsPDFAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

// ------------------- Constants -------------------
const COLORS: Record<string, [number, number, number]> = {
  primary: [59, 130, 246],
  danger: [239, 68, 68],
  approved: [34, 197, 94],
  pending: [239, 68, 68],
  watermark: [200, 200, 200],
};

const FONTS = {
  title: 20,
  section: 16,
  normal: 10,
  small: 8,
};

const MARGINS = {
  horizontal: 10,
  verticalSpacing: 15,
};

// ------------------- Helpers -------------------
const addHeader = (doc: jsPDF, title: string) => {
  // Optional logo
  // doc.addImage('/path/to/logo.png', 'PNG', 15, 10, 30, 15);

  doc.setFontSize(FONTS.title);
  doc.text(title, 105, 20, { align: 'center' });

  doc.setFontSize(FONTS.normal);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, {
    align: 'center',
  });
};

const addFooter = (doc: jsPDF, pageNumber: number) => {
  doc.setFontSize(FONTS.small);
  doc.text('© Asset Management System - CSBS Department', 105, 290, {
    align: 'center',
  });
  doc.text(`Page ${pageNumber}`, 200, 290, { align: 'right' });
};

const handlePageBreak = (doc: jsPDFAutoTable, yPos: number): number => {
  if (yPos > 250) {
    doc.addPage();
    return 20;
  }
  return yPos;
};

// ------------------- Main Service -------------------
export class PDFExportService {
  private static getDoc(): jsPDFAutoTable {
    const doc = new jsPDF() as jsPDFAutoTable;
    return doc;
  }

  static async exportAssetsToPDF(
    assets: Asset[],
    analytics: AssetAnalytics,
    fileName = 'assets-report.pdf',
    labs: { [id: string]: string } = {}
  ) {
    const doc = this.getDoc();
    const pageNum = 1;

    addHeader(doc, 'Asset Management Report');

    // Summary Section
    doc.setFontSize(FONTS.section);
    doc.text('Summary', 20, 45);

    const summaryData: RowInput[] = [
      ['Total Assets', analytics.totalAssets.toString()],
      ['Total Cost', `Rs.${analytics.totalCost.toLocaleString()}`],
      ['Approved Assets', analytics.approvedAssets.toString()],
      ['Pending Approval', analytics.pendingAssets.toString()],
      ['Average Cost per Asset', `Rs.${(analytics.totalCost / analytics.totalAssets).toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    let currentY = doc.lastAutoTable?.finalY ?? 70;

    // Asset Table
    doc.setFontSize(FONTS.section);
    doc.text('Asset Details', 20, currentY + MARGINS.verticalSpacing);

    const assetsData: RowInput[] = assets.map(asset => {
      const statusColor = asset.approved ? COLORS.approved : COLORS.pending;
      return [
        asset.asset_id || 'Pending...',
        asset.name_of_supply,
        asset.asset_type,
        labs[asset.allocated_lab] || asset.allocated_lab,
        `Rs.${asset.rate.toLocaleString()}`,
        {
          content: asset.approved ? 'Approved' : 'Pending',
          styles: { textColor: [statusColor[0], statusColor[1], statusColor[2]] },
        },
        new Date(asset.created_at).toLocaleDateString(),
      ];
    });

    autoTable(doc, {
      startY: currentY + 20,
      head: [['Asset ID', 'Name', 'Type', 'Lab', 'Price', 'Status', 'Created']],
      body: assetsData,
      theme: 'grid',
      headStyles: { fillColor: [COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]] },
      styles: { fontSize: 8 },
      margin: { horizontal: MARGINS.horizontal },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    currentY = doc.lastAutoTable?.finalY ?? currentY + 100;

    // Analytics - Group by Lab
    doc.setFontSize(FONTS.section);
    doc.text('Analytics Overview', 20, currentY + 15);

    let yPos = currentY + 25;

    doc.setFontSize(FONTS.normal);
    doc.text('Distribution by Lab:', 20, yPos);
    yPos += 7;
    for (const [lab, count] of Object.entries(analytics.byLab)) {
      yPos = handlePageBreak(doc, yPos);
      doc.text(`  ${labs[lab] || lab}: ${count} assets`, 25, yPos);
      yPos += 6;
    }

    yPos += 5;

    doc.text('Cost by Lab:', 20, yPos);
    yPos += 7;
    for (const [lab, cost] of Object.entries(analytics.costByLab)) {
      yPos = handlePageBreak(doc, yPos);
      doc.text(`  ${labs[lab] || lab}: Rs.${cost.toLocaleString()}`, 25, yPos);
      yPos += 6;
    }

    yPos += 5;
    yPos = handlePageBreak(doc, yPos);

    // Distribution by Type
    doc.text('Distribution by Type:', 20, yPos);
    yPos += 7;
    for (const [type, count] of Object.entries(analytics.byType)) {
      yPos = handlePageBreak(doc, yPos);
      doc.text(`  ${type}: ${count} assets`, 25, yPos);
      yPos += 6;
    }

    yPos += 5;
    yPos = handlePageBreak(doc, yPos);

    // Cost Analysis Table
    doc.text('Cost Analysis:', 20, yPos);
    yPos += 7;

    const costData: [string, number][] = [
      ['Total Cost', analytics.totalCost],
      ['Average Cost per Asset', analytics.totalCost / analytics.totalAssets],
    ];

    costData.forEach(([label, value]) => {
      yPos = handlePageBreak(doc, yPos);
      doc.text(`  ${label}: Rs.${value.toLocaleString()}`, 25, yPos);
      yPos += 6;
    });

    addFooter(doc, pageNum);
    doc.save(fileName);
  }

  static async exportIssuesToPDF(
    issues: AssetIssue[],
    analytics: IssueAnalytics,
    fileName = 'issues-report.pdf',
    labs: { [id: string]: string } = {}
  ) {
    const doc = this.getDoc();
    const pageNum = 1;

    addHeader(doc, 'Issue Management Report');

    // Summary
    doc.setFontSize(FONTS.section);
    doc.text('Summary', 20, 45);

    const summaryData: RowInput[] = [
      ['Total Issues', analytics.totalIssues.toString()],
      ['Open Issues', analytics.openIssues.toString()],
      ['Resolved Issues', analytics.resolvedIssues.toString()],
      ['Resolution Rate', `${analytics.resolutionRate.toFixed(1)}%`],
      ['Total Repair Cost', `Rs.${analytics.costAnalysis.totalRepairCost.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    let currentY = doc.lastAutoTable?.finalY ?? 70;

    // Issues Table
    doc.setFontSize(FONTS.section);
    doc.text('Issue Details', 20, currentY + MARGINS.verticalSpacing);

    const issuesData: RowInput[] = issues.map(issue => [
      issue.asset?.name_of_supply || 'Unknown',
      issue.asset?.allocated_lab
        ? labs[issue.asset.allocated_lab] || issue.asset.allocated_lab
        : 'Unknown',
      issue.issue_description.length > 50
        ? `${issue.issue_description.substring(0, 50)}...`
        : issue.issue_description,
      issue.status,
      new Date(issue.reported_at).toLocaleDateString(),
      issue.resolved_at ? new Date(issue.resolved_at).toLocaleDateString() : '-',
      issue.cost_required ? `Rs.${issue.cost_required.toLocaleString()}` : '-',
    ]);

    autoTable(doc, {
      startY: currentY + 20,
      head: [['Asset', 'Lab', 'Description', 'Status', 'Reported', 'Resolved', 'Repair Cost']],
      body: issuesData,
      theme: 'grid',
      headStyles: { fillColor: [COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]] },
      styles: { fontSize: 8 },
      margin: { horizontal: MARGINS.horizontal },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    currentY = doc.lastAutoTable?.finalY ?? currentY + 100;

    // Analytics by Lab
    doc.setFontSize(FONTS.section);
    doc.text('Analytics Overview', 20, currentY + 15);
    doc.setFontSize(FONTS.normal);

    let yPos = currentY + 25;
    doc.text('Issues by Lab:', 20, yPos);
    yPos += 7;

    for (const [lab, count] of Object.entries(analytics.issuesByLab)) {
      yPos = handlePageBreak(doc, yPos);
      doc.text(`  ${labs[lab] || lab}: ${count} issues`, 25, yPos);
      yPos += 6;
    }

    yPos += 5;
    yPos = handlePageBreak(doc, yPos);

    // Cost Analysis Section
    doc.text('Cost Analysis:', 20, yPos);
    yPos += 7;

    const costData: [string, number][] = [
      ['Total Repair Cost', analytics.costAnalysis.totalRepairCost],
    ];

    costData.forEach(([label, value]) => {
      yPos = handlePageBreak(doc, yPos);
      doc.text(`  ${label}: Rs.${value.toLocaleString()}`, 25, yPos);
      yPos += 6;
    });

    addFooter(doc, pageNum);
    doc.save(fileName);
  }
}
