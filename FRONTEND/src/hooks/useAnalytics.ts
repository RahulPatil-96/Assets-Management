import { useState, useEffect } from 'react';
import { AnalyticsData } from '../types';

const mockAnalytics: AnalyticsData = {
  documents: {
    total: 1247,
    processed: 1189,
    pending: 43,
    overdue: 15,
    byDepartment: [
      { department: 'Finance', count: 324 },
      { department: 'HR', count: 298 },
      { department: 'Legal', count: 187 },
      { department: 'Procurement', count: 156 },
      { department: 'Facilities', count: 134 },
      { department: 'IT', count: 148 }
    ],
    byStatus: [
      { status: 'Completed', count: 1189 },
      { status: 'Processing', count: 28 },
      { status: 'Pending', count: 15 },
      { status: 'Urgent', count: 15 }
    ],
    processingTimes: [
      { date: '2024-01-08', avgTime: 2.3 },
      { date: '2024-01-09', avgTime: 1.8 },
      { date: '2024-01-10', avgTime: 2.1 },
      { date: '2024-01-11', avgTime: 1.9 },
      { date: '2024-01-12', avgTime: 2.4 },
      { date: '2024-01-13', avgTime: 2.0 },
      { date: '2024-01-14', avgTime: 1.7 }
    ]
  },
  assets: {
    total: 2847,
    active: 2456,
    maintenance: 234,
    retired: 157,
    totalValue: 4250000,
    byCategory: [
      { category: 'IT Equipment', count: 1245, value: 1850000 },
      { category: 'Facility Equipment', count: 456, value: 1200000 },
      { category: 'Vehicles', count: 234, value: 890000 },
      { category: 'Furniture', count: 567, value: 180000 },
      { category: 'Tools', count: 345, value: 130000 }
    ],
    byStatus: [
      { status: 'Active', count: 2456 },
      { status: 'Maintenance', count: 234 },
      { status: 'Retired', count: 157 }
    ],
    utilizationTrends: [
      { date: '2024-01-08', utilization: 87 },
      { date: '2024-01-09', utilization: 89 },
      { date: '2024-01-10', utilization: 85 },
      { date: '2024-01-11', utilization: 91 },
      { date: '2024-01-12', utilization: 88 },
      { date: '2024-01-13', utilization: 86 },
      { date: '2024-01-14', utilization: 90 }
    ],
    maintenanceCosts: [
      { month: 'Sep', cost: 45000 },
      { month: 'Oct', cost: 52000 },
      { month: 'Nov', cost: 38000 },
      { month: 'Dec', cost: 61000 },
      { month: 'Jan', cost: 47000 }
    ]
  },
  performance: {
    systemUptime: 99.7,
    avgResponseTime: 0.8,
    userActivity: [
      { date: '2024-01-08', activeUsers: 145 },
      { date: '2024-01-09', activeUsers: 167 },
      { date: '2024-01-10', activeUsers: 134 },
      { date: '2024-01-11', activeUsers: 189 },
      { date: '2024-01-12', activeUsers: 156 },
      { date: '2024-01-13', activeUsers: 142 },
      { date: '2024-01-14', activeUsers: 178 }
    ],
    storageUsage: { used: 2.4, total: 10.0 }
  }
};

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setIsLoading(false);
    }, 600);
  }, []);

  return { analytics, isLoading };
};