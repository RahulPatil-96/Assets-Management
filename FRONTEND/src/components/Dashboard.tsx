interface ProcessingTime {
  date: string;
  avgTime: number;
}

interface UtilizationTrend {
  date: string;
  utilization: number;
}

import React, { useState } from 'react';
import { 
  FileText, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Activity,
  Server,
  ArrowRight,
  Plus,
  Search
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { QuickActions } from './QuickActions';
import { WelcomeGuide } from './WelcomeGuide';
import { HelpCenter } from './HelpCenter';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { analytics, isLoading } = useAnalytics();
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'upload':
        onNavigate?.('upload');
        break;
      case 'new-asset':
        onNavigate?.('assets');
        break;
      case 'search':
        onNavigate?.('search');
        break;
      case 'intake-form':
        onNavigate?.('intake');
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Good morning, Sarah! 👋</h1>
          <p className="text-lg text-gray-600 mt-2">Here's what's happening with your systems today</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowHelpCenter(true)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Need help?
          </button>
          <button
            onClick={() => setShowWelcomeGuide(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            Take a Tour
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Key Metrics Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Document Metrics */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900">{analytics?.documents.total.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% this month
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Queue</p>
                <p className="text-3xl font-bold text-gray-900">{analytics?.documents.pending}</p>
                <p className="text-sm text-orange-600">Avg: 1.9 min</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Clock className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-3xl font-bold text-gray-900">{analytics?.documents.processed}</p>
                <p className="text-sm text-green-600">97.2% accuracy</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent Items</p>
                <p className="text-3xl font-bold text-gray-900">{analytics?.documents.overdue}</p>
                <p className="text-sm text-red-600">Requires attention</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </div>

          {/* Asset Metrics */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-3xl font-bold text-gray-900">{analytics?.assets.total.toLocaleString()}</p>
                <p className="text-sm text-blue-600">Active: {analytics?.assets.active}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Package className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asset Value</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(analytics?.assets.totalValue || 0).toLocaleString()}
                </p>
                <p className="text-sm text-green-600">+5.2% YoY</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <DollarSign className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance Due</p>
                <p className="text-3xl font-bold text-gray-900">{analytics?.assets.maintenance}</p>
                <p className="text-sm text-orange-600">Next 30 days</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Activity className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-3xl font-bold text-gray-900">{analytics?.performance.systemUptime}%</p>
                <p className="text-sm text-green-600">Excellent</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Server className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>
          
          <div className="space-y-4">
            {[
              { action: 'Document processed', item: 'Equipment Purchase Agreement.pdf', time: '2 minutes ago', type: 'success' },
              { action: 'Asset maintenance scheduled', item: 'HVAC System Unit A', time: '15 minutes ago', type: 'warning' },
              { action: 'New asset registered', item: 'Dell Latitude 7420', time: '1 hour ago', type: 'info' },
              { action: 'Document uploaded', item: 'Maintenance Report.docx', time: '2 hours ago', type: 'info' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-3 h-3 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.item}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Links</h3>
          
          <div className="space-y-3">
            {[
              { title: 'View All Documents', icon: <FileText className="w-5 h-5" />, action: () => onNavigate?.('documents') },
              { title: 'Manage Assets', icon: <Package className="w-5 h-5" />, action: () => onNavigate?.('assets') },
              { title: 'Upload Files', icon: <Plus className="w-5 h-5" />, action: () => onNavigate?.('upload') },
              { title: 'Advanced Search', icon: <Search className="w-5 h-5" />, action: () => onNavigate?.('search') },
              { title: 'System Analytics', icon: <Activity className="w-5 h-5" />, action: () => onNavigate?.('analytics') }
            ].map((link, index) => (
              <button
                key={index}
                onClick={link.action}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-600 group-hover:text-blue-600 transition-colors">
                    {link.icon}
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {link.title}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Processing Trends */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Document Processing Trends</h3>
          <div className="space-y-4">
            {analytics?.documents.processingTimes.map((day: ProcessingTime, index: number) => (
              <div key={day.date} className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 w-20 font-medium">{day.date.slice(-5)}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(day.avgTime / 3) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">{day.avgTime}min</span>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Utilization */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Asset Utilization Trends</h3>
          <div className="space-y-4">
            {analytics?.assets.utilizationTrends.map((day: UtilizationTrend, index: number) => (
              <div key={day.date} className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 w-20 font-medium">{day.date.slice(-5)}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${day.utilization}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12">{day.utilization}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <WelcomeGuide
        isOpen={showWelcomeGuide}
        onClose={() => setShowWelcomeGuide(false)}
        onComplete={() => setShowWelcomeGuide(false)}
      />
      
      <HelpCenter
        isOpen={showHelpCenter}
        onClose={() => setShowHelpCenter(false)}
      />
    </div>
  );
};