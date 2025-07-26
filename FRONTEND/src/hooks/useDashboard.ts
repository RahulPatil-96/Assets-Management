import { useState, useEffect } from 'react';
import { DashboardMetrics, Asset, MaintenanceAlert, Document } from '../types';

export const useDashboard = (assets: Asset[], documents: Document[] = []) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateMetrics = async () => {
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 800));

      const totalAssets = assets.length;
      const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
      
      const assetsNeedingMaintenance = assets.filter(asset => 
        asset.nextMaintenance && asset.nextMaintenance <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ).length;
      
      const overdueMaintenanceCount = assets.filter(asset => 
        asset.maintenanceSchedule.isOverdue
      ).length;
      
      const warrantyExpiringCount = assets.filter(asset => 
        asset.warrantyExpiry && asset.warrantyExpiry <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      ).length;

      // Assets by category
      const categoryMap = new Map<string, { count: number; value: number }>();
      assets.forEach(asset => {
        const existing = categoryMap.get(asset.category) || { count: 0, value: 0 };
        categoryMap.set(asset.category, {
          count: existing.count + 1,
          value: existing.value + asset.currentValue
        });
      });

      const assetsByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        value: data.value,
        percentage: (data.count / totalAssets) * 100
      }));

      // Assets by status
      const statusMap = new Map<string, number>();
      assets.forEach(asset => {
        const existing = statusMap.get(asset.status) || 0;
        statusMap.set(asset.status, existing + 1);
      });

      const assetsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
        percentage: (count / totalAssets) * 100
      }));

      // Assets by department
      const departmentMap = new Map<string, { assetCount: number; totalValue: number; maintenanceCost: number }>();
      assets.forEach(asset => {
        const existing = departmentMap.get(asset.department) || { assetCount: 0, totalValue: 0, maintenanceCost: 0 };
        const maintenanceCost = asset.maintenanceHistory.reduce((sum, record) => sum + record.cost, 0);
        departmentMap.set(asset.department, {
          assetCount: existing.assetCount + 1,
          totalValue: existing.totalValue + asset.currentValue,
          maintenanceCost: existing.maintenanceCost + maintenanceCost
        });
      });

      const assetsByDepartment = Array.from(departmentMap.entries()).map(([department, data]) => ({
        department,
        ...data
      }));

      // Document analytics calculations
      const totalDocuments = documents.length;

      const documentsByStatusMap = new Map<string, number>();
      documents.forEach(doc => {
        const existing = documentsByStatusMap.get(doc.status) || 0;
        documentsByStatusMap.set(doc.status, existing + 1);
      });
      const documentsByStatus = Array.from(documentsByStatusMap.entries()).map(([status, count]) => ({
        status,
        count,
        percentage: totalDocuments > 0 ? (count / totalDocuments) * 100 : 0
      }));

      const documentsByCategoryMap = new Map<string, number>();
      documents.forEach(doc => {
        const existing = documentsByCategoryMap.get(doc.category) || 0;
        documentsByCategoryMap.set(doc.category, existing + 1);
      });
      const documentsByCategory = Array.from(documentsByCategoryMap.entries()).map(([category, count]) => ({
        category,
        count,
        percentage: totalDocuments > 0 ? (count / totalDocuments) * 100 : 0
      }));

      const documentsByDepartmentMap = new Map<string, number>();
      documents.forEach(doc => {
        const existing = documentsByDepartmentMap.get(doc.department) || 0;
        documentsByDepartmentMap.set(doc.department, existing + 1);
      });
      const documentsByDepartment = Array.from(documentsByDepartmentMap.entries()).map(([department, documentCount]) => ({
        department,
        documentCount
      }));

      // Mock maintenance costs (last 12 months)
      const maintenanceCosts = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          preventive: Math.floor(Math.random() * 10000) + 5000,
          corrective: Math.floor(Math.random() * 8000) + 3000,
          emergency: Math.floor(Math.random() * 5000) + 1000,
          total: 0
        };
      }).reverse();

      maintenanceCosts.forEach(month => {
        month.total = month.preventive + month.corrective + month.emergency;
      });

      // Mock depreciation trends
      const depreciationTrends = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          totalDepreciation: Math.floor(Math.random() * 50000) + 20000,
          newAssets: Math.floor(Math.random() * 20) + 5,
          disposedAssets: Math.floor(Math.random() * 10) + 1
        };
      }).reverse();

      // Mock utilization metrics
      const utilizationMetrics = assets.slice(0, 10).map(asset => ({
        assetId: asset.id,
        assetName: asset.name,
        utilizationRate: Math.floor(Math.random() * 100),
        hoursUsed: Math.floor(Math.random() * 2000) + 500,
        totalHours: 2080, // Standard work year
        efficiency: Math.floor(Math.random() * 100) + 50
      }));

      // Recent activities
      const recentActivities = Array.from({ length: 10 }, (_, i) => ({
        id: `activity-${i}`,
        type: ['asset_added', 'maintenance_completed', 'transfer', 'disposal', 'alert'][Math.floor(Math.random() * 5)] as any,
        description: `Activity ${i + 1} description`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        user: `User ${Math.floor(Math.random() * 10)}`,
        assetId: assets[Math.floor(Math.random() * assets.length)]?.id,
        assetName: assets[Math.floor(Math.random() * assets.length)]?.name
      }));

      const dashboardMetrics: DashboardMetrics = {
        totalAssets,
        totalValue,
        assetsNeedingMaintenance,
        overdueMaintenanceCount,
        warrantyExpiringCount,
        assetsByCategory,
        assetsByStatus,
        assetsByDepartment,
        totalDocuments,
        documentsByStatus,
        documentsByCategory,
        documentsByDepartment,
        maintenanceCosts,
        depreciationTrends,
        utilizationMetrics,
        recentActivities
      };

      // Generate alerts
      const generatedAlerts: MaintenanceAlert[] = assets
        .filter(asset => 
          asset.maintenanceSchedule.isOverdue || 
          (asset.nextMaintenance && asset.nextMaintenance <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) ||
          (asset.warrantyExpiry && asset.warrantyExpiry <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        )
        .slice(0, 20)
        .map((asset, index) => ({
          id: `alert-${index}`,
          assetId: asset.id,
          assetName: asset.name,
          alertType: asset.maintenanceSchedule.isOverdue ? 'overdue_maintenance' : 
                    asset.warrantyExpiry && asset.warrantyExpiry <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'warranty_expiring' : 
                    'maintenance_due',
          severity: asset.maintenanceSchedule.isOverdue ? 'critical' : 'warning',
          message: asset.maintenanceSchedule.isOverdue ? 
                  `Maintenance overdue for ${asset.name}` :
                  asset.warrantyExpiry && asset.warrantyExpiry <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ?
                  `Warranty expiring soon for ${asset.name}` :
                  `Maintenance due soon for ${asset.name}`,
          dueDate: asset.nextMaintenance || asset.warrantyExpiry || new Date(),
          daysOverdue: asset.maintenanceSchedule.isOverdue ? 
                      Math.floor((Date.now() - (asset.nextMaintenance?.getTime() || Date.now())) / (24 * 60 * 60 * 1000)) : 
                      undefined,
          isAcknowledged: false,
          createdDate: new Date()
        }));

      setMetrics(dashboardMetrics);
      setAlerts(generatedAlerts);
      setIsLoading(false);
    };

    if (assets.length > 0) {
      calculateMetrics();
    }
  }, [assets, documents]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isAcknowledged: true, acknowledgedBy: 'Current User', acknowledgedDate: new Date() }
        : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  return {
    metrics,
    alerts,
    isLoading,
    acknowledgeAlert,
    dismissAlert
  };
};
