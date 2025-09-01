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
    totalRepairCost: number;
  };
}

export class AnalyticsService {
  static analyzeAssets(assets: Asset[], labs?: { [id: string]: string }): AssetAnalytics {
    const totalAssets = assets.length;
    const totalQuantity = assets.reduce((sum, asset) => sum + (asset.quantity || 1), 0);
    const totalCost = assets.reduce((sum, asset) => sum + (asset.total_amount || asset.rate), 0);

    const approvedAssets = assets.filter(asset => asset.approved).length;
    const pendingAssets = totalAssets - approvedAssets;

    const byLab: { [lab: string]: number } = {};
    const byType: { [type: string]: number } = {};
    const costByLab: { [lab: string]: number } = {};
    const costByType: { [type: string]: number } = {};

    assets.forEach(asset => {
      const labName =
        labs && labs[asset.allocated_lab] ? labs[asset.allocated_lab] : asset.allocated_lab;
      byLab[labName] = (byLab[labName] || 0) + 1;
      byType[asset.asset_type] = (byType[asset.asset_type] || 0) + 1;

      const assetCost = asset.total_amount || asset.rate;
      costByLab[labName] = (costByLab[labName] || 0) + assetCost;
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

  static analyzeIssues(issues: AssetIssue[], labs?: { [id: string]: string }): IssueAnalytics {
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
      const labId = issue.asset?.allocated_lab || 'Unknown';
      const labName = labs && labs[labId] ? labs[labId] : labId;
      issuesByLab[labName] = (issuesByLab[labName] || 0) + 1;
    });

    // Calculate cost analysis
    const totalRepairCost = issues.reduce((sum, issue) => sum + (issue.cost_required || 0), 0);

    return {
      totalIssues,
      openIssues,
      resolvedIssues,
      issuesByLab,
      issuesByStatus,
      resolutionRate,
      costAnalysis: {
        totalRepairCost,
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
        labels: ['Total Repair Cost'],
        data: [analytics.costAnalysis.totalRepairCost],
        backgroundColor: ['#3B82F6'],
      },
    };
  }

  static generateMonthlyCostData(issues: AssetIssue[], labs?: { [id: string]: string }) {
    const monthlyData: { [month: string]: { [lab: string]: number } } = {};
    const labNames: { [id: string]: string } = {};

    issues.forEach(issue => {
      const date = new Date(issue.reported_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const labId = issue.asset?.allocated_lab || 'Unknown';
      const labName = labs && labs[labId] ? labs[labId] : labId;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      monthlyData[monthKey][labName] =
        (monthlyData[monthKey][labName] || 0) + (issue.cost_required || 0);
      labNames[labId] = labName;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const datasets = Object.values(labNames).map((labName, index) => {
      const colors = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
      return {
        label: labName,
        data: sortedMonths.map(month => monthlyData[month][labName] || 0),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        fill: false,
      };
    });

    return {
      labels: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        });
      }),
      datasets,
      data: [], // dummy for interface
      backgroundColor: [], // dummy for interface
    };
  }

  static generateLabWiseRepairCostData(issues: AssetIssue[], labs?: { [id: string]: string }) {
    const labCostData: { [lab: string]: number } = {};

    issues.forEach(issue => {
      const labId = issue.asset?.allocated_lab || 'Unknown';
      const labName = labs && labs[labId] ? labs[labId] : labId;
      labCostData[labName] = (labCostData[labName] || 0) + (issue.cost_required || 0);
    });

    const sortedLabs = Object.keys(labCostData).sort();
    const colors = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

    return {
      labels: sortedLabs,
      data: sortedLabs.map(lab => labCostData[lab]),
      backgroundColor: sortedLabs.map((_, index) => colors[index % colors.length]),
    };
  }
}
