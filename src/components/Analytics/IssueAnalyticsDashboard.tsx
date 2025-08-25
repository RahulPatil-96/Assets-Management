import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { AssetIssue } from '../../lib/supabase';
import { AnalyticsService } from '../../lib/analyticsService';
import ChartCard from './ChartCard';

interface IssueAnalyticsDashboardProps {
  issues: AssetIssue[];
}

const IssueAnalyticsDashboard: React.FC<IssueAnalyticsDashboardProps> = ({ issues }) => {
  const analytics = AnalyticsService.analyzeIssues(issues);
  const chartsData = AnalyticsService.generateIssueChartsData(analytics);

  const statCards = [
    {
      title: 'Total Issues',
      value: analytics.totalIssues,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900'
    },
    {
      title: 'Open Issues',
      value: analytics.openIssues,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900'
    },
    {
      title: 'Resolved Issues',
      value: analytics.resolvedIssues,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      title: 'Resolution Rate',
      value: `${analytics.resolutionRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Issue Status Distribution"
          type="doughnut"
          data={chartsData.statusChart}
        />
        <ChartCard
          title="Issues by Lab"
          type="bar"
          data={chartsData.labDistributionChart}
        />
        <ChartCard
          title="Cost Analysis"
          type="bar"
          data={chartsData.costAnalysisChart}
        />
      </div>

      {/* Detailed Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Detailed Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Issues by Lab */}
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Issues by Lab</h4>
            <div className="space-y-2">
              {Object.entries(analytics.issuesByLab).map(([lab, count]) => (
                <div key={lab} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{lab}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Analysis */}
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Cost Analysis</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Estimated Repair Cost</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  ₹{analytics.costAnalysis.estimatedRepairCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Replacement Cost</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  ₹{analytics.costAnalysis.replacementCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Potential Cost</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  ₹{analytics.costAnalysis.totalPotentialCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueAnalyticsDashboard;
