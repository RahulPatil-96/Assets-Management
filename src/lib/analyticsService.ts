import { Asset, AssetIssue } from './supabase';

export interface AssetAnalytics {
  totalAssets: number;
  totalQuantity: number;
  totalCost: number;
  approvedAssets: number;
  pendingAssets: number;
  byLab: { [lab: string]: number };
  byType: { [type: string]: number };
  costByLab: { [lab: string]: number };
  costByType: { [type: string]: number };
}

export interface IssueAnalytics {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  issuesByLab: { [lab: string]: number };
  issuesByStatus: { [status: string]: number };
  resolutionRate: number;
  averageResolutionTime?: number;
  costAnalysis: {
    estimatedRepairCost: number;
    replacementCost: number;
    totalPotentialCost: number;
  };
}

export class AnalyticsService {
  static analyzeAssets(assets: Asset[]): AssetAnalytics {
    const totalAssets = assets.length;
    const totalQuantity = assets.reduce((sum, asset) => sum + asset.quantity, 0);
    const totalCost = assets.reduce((sum, asset) => sum + asset.quantity * asset.rate, 0);

    const approvedAssets = assets.filter(asset => asset.approved).length;
    const pendingAssets = totalAssets - approvedAssets;

    const byLab: { [lab: string]: number } = {};
    const byType: { [type: string]: number } = {};
    const costByLab: { [lab: string]: number } = {};
    const costByType: { [type: string]: number } = {};

    assets.forEach(asset => {
      byLab[asset.allocated_lab] = (byLab[asset.allocated_lab] || 0) + 1;
      byType[asset.asset_type] = (byType[asset.asset_type] || 0) + 1;

      const assetCost = asset.quantity * asset.rate;
      costByLab[asset.allocated_lab] = (costByLab[asset.allocated_lab] || 0) + assetCost;
      costByType[asset.asset_type] = (costByType[asset.asset_type] || 0) + assetCost;
    });

    return {
      totalAssets,
      totalQuantity,
      totalCost,
      approvedAssets,
      pendingAssets,
      byLab,
      byType,
      costByLab,
      costByType,
    };
  }

  static analyzeIssues(issues: AssetIssue[]): IssueAnalytics {
    const totalIssues = issues.length;
    const openIssues = issues.filter(issue => issue.status === 'open').length;
    const resolvedIssues = totalIssues - openIssues;
    const resolutionRate = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0;

    const issuesByLab: { [lab: string]: number } = {};
    const issuesByStatus: { [status: string]: number } = {
      open: openIssues,
      resolved: resolvedIssues,
    };

    issues.forEach(issue => {
      const lab = issue.asset?.allocated_lab || 'Unknown';
      issuesByLab[lab] = (issuesByLab[lab] || 0) + 1;
    });

    // Calculate cost analysis (simplified - you might want more sophisticated logic)
    const estimatedRepairCost = issues.length * 500; // $500 per issue estimate
    const replacementCost = issues.filter(issue => issue.status === 'open').length * 1000; // $1000 replacement cost
    const totalPotentialCost = estimatedRepairCost + replacementCost;

    return {
      totalIssues,
      openIssues,
      resolvedIssues,
      issuesByLab,
      issuesByStatus,
      resolutionRate,
      costAnalysis: {
        estimatedRepairCost,
        replacementCost,
        totalPotentialCost,
      },
    };
  }

  static generateAssetChartsData(analytics: AssetAnalytics) {
    return {
      statusChart: {
        labels: ['Approved', 'Pending'],
        data: [analytics.approvedAssets, analytics.pendingAssets],
        backgroundColor: ['#10B981', '#EF4444'],
      },
      labDistributionChart: {
        labels: Object.keys(analytics.byLab),
        data: Object.values(analytics.byLab),
        backgroundColor: ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'],
      },
      costByLabChart: {
        labels: Object.keys(analytics.costByLab),
        data: Object.values(analytics.costByLab),
        backgroundColor: ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'],
      },
      typeDistributionChart: {
        labels: Object.keys(analytics.byType),
        data: Object.values(analytics.byType),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#EF4444',
          '#F59E0B',
          '#8B5CF6',
          '#EC4899',
          '#06B6D4',
        ],
      },
    };
  }

  static generateIssueChartsData(analytics: IssueAnalytics) {
    return {
      statusChart: {
        labels: ['Open', 'Resolved'],
        data: [analytics.openIssues, analytics.resolvedIssues],
        backgroundColor: ['#EF4444', '#10B981'],
      },
      labDistributionChart: {
        labels: Object.keys(analytics.issuesByLab),
        data: Object.values(analytics.issuesByLab),
        backgroundColor: ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'],
      },
      costAnalysisChart: {
        labels: ['Estimated Repair', 'Replacement', 'Total Potential'],
        data: [
          analytics.costAnalysis.estimatedRepairCost,
          analytics.costAnalysis.replacementCost,
          analytics.costAnalysis.totalPotentialCost,
        ],
        backgroundColor: ['#F59E0B', '#EF4444', '#3B82F6'],
      },
    };
  }
}
