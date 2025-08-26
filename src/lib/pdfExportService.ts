import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { Asset, AssetIssue } from "./supabase";
import { AssetAnalytics, IssueAnalytics } from "./analyticsService";

interface jsPDFAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export class PDFExportService {
  private static getDoc(): jsPDFAutoTable {
    return new jsPDF() as jsPDFAutoTable;
  }

  static async exportAssetsToPDF(
    assets: Asset[],
    analytics: AssetAnalytics,
    fileName: string = "assets-report.pdf"
  ) {
    const doc = this.getDoc();

    // Title
    doc.setFontSize(20);
    doc.text("Asset Management Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, {
      align: "center",
    });

    // Summary Section
    doc.setFontSize(16);
    doc.text("Summary", 20, 45);
    doc.setFontSize(10);

    const summaryData: RowInput[] = [
      ["Total Assets", analytics.totalAssets.toString()],
      ["Total Quantity", analytics.totalQuantity.toString()],
      ["Total Cost", `Rs.${analytics.totalCost.toLocaleString()}`],
      ["Approved Assets", analytics.approvedAssets.toString()],
      ["Pending Approval", analytics.pendingAssets.toString()],
    ];

    autoTable(doc, {
      startY: 50,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 70;

    // Assets Table
    doc.setFontSize(16);
    doc.text("Asset Details", 20, currentY + 15);

    const assetsData: RowInput[] = assets.map((asset) => [
      asset.asset_id || 'Pending...',
      asset.name_of_supply,
      asset.asset_type,
      asset.allocated_lab,
      asset.quantity.toString(),
      `Rs.${asset.rate.toLocaleString()}`,
      `Rs.${(asset.quantity * asset.rate).toLocaleString()}`,
      asset.approved ? "Approved" : "Pending",
      new Date(asset.created_at).toLocaleDateString(),
    ]);

    autoTable(doc, {
      startY: currentY + 20,
      head: [
        ["Asset ID", "Name", "Type", "Lab", "Qty", "Rate", "Total", "Status", "Created"],
      ],
      body: assetsData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      margin: { horizontal: 10 },
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 100;

    // Analytics Charts Section (text-based representation)
    doc.setFontSize(16);
    doc.text("Analytics Overview", 20, currentY + 15);
    doc.setFontSize(10);

    let yPos = currentY + 25;

    // Lab Distribution
    doc.text("Distribution by Lab:", 20, yPos);
    yPos += 7;
    Object.entries(analytics.byLab).forEach(([lab, count]) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`  ${lab}: ${count} assets`, 25, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Cost by Lab
    doc.text("Cost by Lab:", 20, yPos);
    yPos += 7;
    Object.entries(analytics.costByLab).forEach(([lab, cost]) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`  ${lab}: Rs.${cost.toLocaleString()}`, 25, yPos);
      yPos += 6;
    });

    // Footer
    doc.setFontSize(8);
    doc.text("© Asset Management System - Generated Report", 105, 290, {
      align: "center",
    });

    doc.save(fileName);
  }

  static async exportIssuesToPDF(
    issues: AssetIssue[],
    analytics: IssueAnalytics,
    fileName: string = "issues-report.pdf"
  ) {
    const doc = this.getDoc();

    // Title
    doc.setFontSize(20);
    doc.text("Issue Management Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, {
      align: "center",
    });

    // Summary Section
    doc.setFontSize(16);
    doc.text("Summary", 20, 45);
    doc.setFontSize(10);

    const summaryData: RowInput[] = [
      ["Total Issues", analytics.totalIssues.toString()],
      ["Open Issues", analytics.openIssues.toString()],
      ["Resolved Issues", analytics.resolvedIssues.toString()],
      ["Resolution Rate", `${analytics.resolutionRate.toFixed(1)}%`],
      [
        "Estimated Repair Cost",
        `Rs.${analytics.costAnalysis.estimatedRepairCost.toLocaleString()}`,
      ],
      [
        "Potential Replacement Cost",
        `Rs.${analytics.costAnalysis.replacementCost.toLocaleString()}`,
      ],
      [
        "Total Potential Cost",
        `Rs.${analytics.costAnalysis.totalPotentialCost.toLocaleString()}`,
      ],
    ];

    autoTable(doc, {
      startY: 50,
      head: [["Metric", 
        "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68] },
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 70;

    // Issues Table
    doc.setFontSize(16);
    doc.text("Issue Details", 20, currentY + 15);

    const issuesData: RowInput[] = issues.map((issue) => [
      issue.asset?.name_of_supply || "Unknown",
      issue.asset?.allocated_lab || "Unknown",
      issue.issue_description.substring(0, 50) +
        (issue.issue_description.length > 50 ? "..." : ""),
      issue.status,
      new Date(issue.reported_at).toLocaleDateString(),
      issue.resolved_at
        ? new Date(issue.resolved_at).toLocaleDateString()
        : "-",
    ]);

    autoTable(doc, {
      startY: currentY + 20,
      head: [["Asset", "Lab", "Description", "Status", "Reported", "Resolved"]],
      body: issuesData,
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 8 },
      margin: { horizontal: 10 },
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 100;

    // Analytics Section
    doc.setFontSize(16);
    doc.text("Analytics Overview", 20, currentY + 15);
    doc.setFontSize(10);

    let yPos = currentY + 25;

    // Issues by Lab
    doc.text("Issues by Lab:", 20, yPos);
    yPos += 7;
    Object.entries(analytics.issuesByLab).forEach(([lab, count]) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`  ${lab}: ${count} issues`, 25, yPos);
      yPos += 6;
    });

    // Footer
    doc.setFontSize(8);
    doc.text("© Asset Management System - Generated Report", 105, 290, {
      align: "center",
    });

    doc.save(fileName);
  }
}
