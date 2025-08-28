import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  AlertTriangle,
  CheckSquare,
  ArrowRightLeft,
  Clock,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Asset, AssetIssue } from '../../lib/supabase';
import AssetAnalyticsDashboard from '../Analytics/AssetAnalyticsDashboard';
import IssueAnalyticsDashboard from '../Analytics/IssueAnalyticsDashboard';

interface DashboardStats {
  totalAssets: number;
  approvedAssets: number;
  pendingIssues: number;
  pendingTransfers: number;
  pendingApprovals: number;
  recentActivities: unknown[]; // Change to unknown for better type safety
}

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'assetAnalytics' | 'issueAnalytics'>(
    'overview'
  );

  const fetchDashboardStats = async (): Promise<DashboardStats> => {
    // Fetch total assets
    const { data: assets } = await supabase.from('assets').select('id, approved');

    // Fetch pending issues
    const { data: issues } = await supabase.from('asset_issues').select('id').eq('status', 'open');

    // Fetch pending transfers
    const { data: transfers } = await supabase
      .from('asset_transfers')
      .select('id')
      .eq('status', 'pending');

    return {
      totalAssets: assets?.length || 0,
      approvedAssets: assets?.filter(a => a.approved).length || 0,
      pendingIssues: issues?.length || 0,
      pendingTransfers: transfers?.length || 0,
      pendingApprovals: assets?.filter(a => !a.approved).length || 0,
      recentActivities: [],
    };
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', profile?.id],
    queryFn: fetchDashboardStats,
    enabled: !!profile,
  });

  // Fetch assets for analytics
  const fetchAssets = async (): Promise<Asset[]> => {
    // console.log('Fetching assets for analytics...');
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // console.error('Error fetching assets:', error);
      throw error;
    }

    // console.log('Assets fetched successfully:', data?.length || 0, 'assets');
    return data || [];
  };

  const { data: assets = [] } = useQuery({
    queryKey: ['dashboard-assets'],
    queryFn: fetchAssets,
    enabled: activeTab === 'assetAnalytics',
  });

  // Fetch issues for analytics
  const fetchIssues = async (): Promise<AssetIssue[]> => {
    // console.log('Fetching issues for analytics...');
    const { data, error } = await supabase
      .from('asset_issues')
      .select(
        `
        *,
        asset:assets(name_of_supply, allocated_lab)
      `
      )
      .order('reported_at', { ascending: false });

    if (error) {
      // console.error('Error fetching issues:', error);
      throw error;
    }

    // console.log('Issues fetched successfully:', data?.length || 0, 'issues');
    return data || [];
  };

  const { data: issues = [] } = useQuery({
    queryKey: ['dashboard-issues'],
    queryFn: fetchIssues,
    enabled: activeTab === 'issueAnalytics',
  });

  const getStatCards = () => {
    const defaultStats = {
      totalAssets: 0,
      approvedAssets: 0,
      pendingIssues: 0,
      pendingTransfers: 0,
      pendingApprovals: 0,
      recentActivities: [],
    };

    const currentStats = stats || defaultStats;

    const baseCards = [
      {
        title: 'Total Assets',
        value: currentStats.totalAssets,
        icon: Package,
        color: 'bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      },
      {
        title: 'Approved Assets',
        value: currentStats.approvedAssets,
        icon: CheckSquare,
        color: 'bg-green-500',
        textColor: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
      },
    ];

    const roleSpecificCards = {
      HOD: [
        {
          title: 'Pending Approvals',
          value: currentStats.pendingApprovals,
          icon: Clock,
          color: 'bg-orange-500',
          textColor: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/30',
        },
        {
          title: 'System Alerts',
          value: currentStats.pendingIssues + currentStats.pendingTransfers,
          icon: AlertTriangle,
          color: 'bg-red-500',
          textColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/30',
        },
      ],
      'Lab Assistant': [
        {
          title: 'Open Issues',
          value: currentStats.pendingIssues,
          icon: AlertTriangle,
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
        },
        {
          title: 'Pending Transfers',
          value: currentStats.pendingTransfers,
          icon: ArrowRightLeft,
          color: 'bg-purple-500',
          textColor: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/30',
        },
      ],
      'Lab Incharge': [
        {
          title: 'Open Issues',
          value: currentStats.pendingIssues,
          icon: AlertTriangle,
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
        },
      ],
    };

    return [
      ...baseCards,
      ...(roleSpecificCards[profile?.role as keyof typeof roleSpecificCards] || []),
    ];
  };

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='bg-gray-200 dark:bg-gray-700 h-32 rounded-lg'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2'>Dashboard</h1>
        <p className='text-gray-600 dark:text-gray-400'>Welcome back, {profile?.name}</p>
      </div>

      {/* Tab Navigation */}
      <div className='flex border-b border-gray-200 dark:border-gray-700 mb-6'>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('assetAnalytics')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'assetAnalytics'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 className='w-4 h-4 inline mr-2' />
          Asset Analytics
        </button>
        <button
          onClick={() => setActiveTab('issueAnalytics')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'issueAnalytics'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 className='w-4 h-4 inline mr-2' />
          Issue Analytics
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            {getStatCards().map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className={`${card.bgColor} rounded-lg p-6`}>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-600'>{card.title}</p>
                      <p className={`text-3xl font-bold ${card.textColor} mt-1`}>{card.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${card.color}`}>
                      <Icon className='w-6 h-6 text-white' />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                Quick Actions
              </h2>
              <div className='space-y-3'>
                {profile?.role === 'Lab Assistant' && (
                  <>
                    <button
                      onClick={() => onNavigate?.('assets')}
                      className='w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hover:shadow-sm'
                    >
                      <div className='flex items-center space-x-3'>
                        <Package className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          Add New Asset
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => onNavigate?.('transfers')}
                      className='w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hover:shadow-sm'
                    >
                      <div className='flex items-center space-x-3'>
                        <ArrowRightLeft className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          Initiate Transfer
                        </span>
                      </div>
                    </button>
                  </>
                )}
                {profile?.role === 'Lab Incharge' && (
                  <button
                    onClick={() => onNavigate?.('issues')}
                    className='w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hover:shadow-sm'
                  >
                    <div className='flex items-center space-x-3'>
                      <AlertTriangle className='w-5 h-5 text-red-600 dark:text-red-400' />
                      <span className='font-medium text-gray-900 dark:text-gray-100'>
                        Report Issue
                      </span>
                    </div>
                  </button>
                )}
                {profile?.role === 'HOD' && (
                  <button
                    onClick={() => onNavigate?.('approvals')}
                    className='w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hover:极速赛车开奖直播shadow-sm'
                  >
                    <div className='flex items-center space-x-3'>
                      <CheckSquare className='w-5 h-5 text-green-600 dark:text-green-400' />
                      <span className='font-medium text-gray-900 dark:text-gray-100'>
                        Review Approvals
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
                Recent Activity
              </h2>
              <div className='text-center text-gray-500 dark:text-gray-400 py-8'>
                <Clock className='w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600' />
                <p>No recent activity</p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'assetAnalytics' && <AssetAnalyticsDashboard assets={assets} />}

      {activeTab === 'issueAnalytics' && <IssueAnalyticsDashboard issues={issues} />}
    </div>
  );
};

export default Dashboard;
