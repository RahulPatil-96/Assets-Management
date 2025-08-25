import React from 'react';
import { Package, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Asset } from '../../lib/supabase';
import { AnalyticsService } from '../../lib/analyticsService';
import ChartCard from './ChartCard';

interface AssetAnalyticsDashboardProps {
  assets: Asset[];
}

const AssetAnalyticsDashboard: React.FC<AssetAnalyticsDashboardProps> = ({ assets }) => {
  const analytics = AnalyticsService.analyzeAssets(assets);
  const chartsData = AnalyticsService.generateAssetChartsData(analytics);

  const statCards = [
    {
      title: 'Total Assets',
      value: analytics.totalAssets,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      title: 'Approved Assets',
      value: analytics.approvedAssets,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      title: 'Pending Approval',
      value: analytics.pendingAssets,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900'
    },
    {
      title: 'Total Cost',
      value: `₹${analytics.totalCost.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900'
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
          title="Asset Status Distribution"
          type="doughnut"
          data={chartsData.statusChart}
        />
        <ChartCard
          title="Assets by Lab"
          type="bar"
          data={chartsData.labDistributionChart}
        />
        <ChartCard
          title="Cost Distribution by Lab"
          type="bar"
          data={chartsData.costByLabChart}
        />
        <ChartCard
          title="Assets by Type"
          type="pie"
          data={chartsData.typeDistributionChart}
        />
      </div>

      {/* Detailed Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Detailed Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lab Distribution */}
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Assets by Lab</h4>
            <div className="space-y-2">
              {Object.entries(analytics.byLab).map(([lab, count]) => (
                <div key={lab} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{lab}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost by Lab */}
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Cost by Lab</h4>
            <div className="space-y-2">
              {Object.entries(analytics.costByLab).map(([lab, cost]) => (
                <div key={lab} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{lab}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ₹{cost.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetAnalyticsDashboard;