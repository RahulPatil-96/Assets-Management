import React from 'react';
import { 
  Package, TrendingUp, AlertTriangle, DollarSign, RefreshCw, Activity,
  Wrench, Calendar, Building, Shield, CheckCircle, XCircle, Eye, Bell,
  Clock
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { useAssets } from '../hooks/useAssets';
import { useDashboard } from '../hooks/useDashboard';
import { useToast } from '../hooks/useToast';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

interface Alert {
  id: string;
  severity: string;
  message: string;
  daysOverdue?: number;
  dueDate: Date;
}

interface DepartmentMetric {
  department: string;
  totalValue: number;
  assetCount: number;
  maintenanceCost: number;
}

interface Activity {
  id: string;
  type: 'asset_added' | 'maintenance_completed' | 'transfer' | 'disposal' | 'alert';
  description: string;
  assetName?: string;
  user: string;
  timestamp: Date;
}

interface AssetStatus {
  status: string;
  count: number;
  percentage: number;
}

type MetricCardProps = {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  borderColor?: string;
  bgColor?: string;
};

const MetricCard: React.FC<MetricCardProps> = ({
  icon, title, value, subtitle, borderColor = 'border-gray-200', bgColor = 'bg-white'
}) => (
  <div className={`overflow-hidden shadow-sm rounded-xl ${bgColor} border ${borderColor} hover:shadow-md transition-shadow`}>
    <div className="p-6 flex items-center">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-5 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="text-2xl font-bold text-gray-900">{value}</dd>
          {subtitle && <dd className="text-sm text-gray-600 mt-1">{subtitle}</dd>}
        </dl>
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { assets } = useAssets();
  const { metrics, alerts, isLoading, acknowledgeAlert, dismissAlert } = useDashboard(assets);
  const { success, info } = useToast();

  const onRefresh = () => success('Data Refreshed', 'Dashboard updated successfully.');
  const onAlertAction = (id: string, action: 'acknowledge' | 'dismiss') => {
    if (action === 'acknowledge') {
      acknowledgeAlert(id);
    } else {
      dismissAlert(id);
    }
    info(`Alert ${action === 'acknowledge' ? 'Acknowledged' : 'Dismissed'}`, `Alert has been ${action}ed.`);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-10 animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_: unknown, i: number) => (
          <div key={i} className="bg-gray-200 h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const criticalAlerts = alerts.filter((a: Alert) => a.severity === 'critical');

  return (
    <div className="px-6 py-8 space-y-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Asset Management Dashboard</h1>
          <p className="mt-1 text-lg text-gray-600">Comprehensive asset overview for your institution</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
          <button
            onClick={onRefresh}
            className="flex items-center px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-red-900">Critical Alerts</h3>
          </div>
          <div className="space-y-3">
            {criticalAlerts.slice(0, 3).map((alert: Alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-inner border border-red-200">
                <div>
                  <p className="font-medium text-red-900">{alert.message}</p>
                  <p className="text-sm text-red-600">
                    {alert.daysOverdue ? `${alert.daysOverdue} days overdue` : `Due: ${alert.dueDate.toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAlertAction(alert.id, 'acknowledge')}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => onAlertAction(alert.id, 'dismiss')}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<Package className="w-6 h-6 text-blue-600" />}
          title="Total Assets"
          value={metrics.totalAssets.toLocaleString()}
          subtitle={<span className="flex items-center text-green-600"><TrendingUp className="w-4 h-4 mr-1" />+5.2% from last month</span>}
        />
        <MetricCard
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          title="Total Value"
          value={`$${(metrics.totalValue / 1e6).toFixed(1)}M`}
          subtitle={<span>${metrics.totalValue.toLocaleString()} total</span>}
        />
        <MetricCard
          icon={<Wrench className="w-6 h-6 text-orange-600" />}
          title="Maintenance Due"
          value={metrics.assetsNeedingMaintenance}
          subtitle={<span className="text-orange-600">{metrics.overdueMaintenanceCount} overdue</span>}
        />
        <MetricCard
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          title="Critical Alerts"
          value={criticalAlerts.length}
          subtitle="Require immediate attention"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          title="Warranty Expiring"
          value={metrics.warrantyExpiringCount}
          subtitle="Next 90 days"
        />
        <MetricCard
          icon={<Package className="w-6 h-6 text-blue-600" />}
          title="Total Documents"
          value={metrics.totalDocuments.toLocaleString()}
        />
        <MetricCard
          icon={<Building className="w-6 h-6 text-indigo-600" />}
          title="Departments"
          value={metrics.assetsByDepartment.length}
          subtitle="Active departments"
        />
        <MetricCard
          icon={<Activity className="w-6 h-6 text-gray-600" />}
          title="Recent Activities"
          value={metrics.recentActivities.length}
          subtitle={`${metrics.recentActivities.length} actions`}
        />
      </div>

      {/* Additional Data Visualizations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Value by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.assetsByDepartment}
                dataKey="totalValue"
                nameKey="department"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {metrics.assetsByDepartment.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart for asset condition */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Condition Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={metrics.assetCondition}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="condition" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};