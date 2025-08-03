import { useState, useEffect, useCallback } from 'react';
import { Asset, MaintenanceRecord, TransferRecord } from '../types';
import AssetService from '../services/assetService';

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const fetchedAssets = await AssetService.getAssets();
      setAssets(fetchedAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
      // If there's an error, we'll use mock data as a fallback
      setAssets([]);
    }
    setIsLoading(false);
  };

  const addAsset = useCallback(async (assetData: Omit<Asset, 'id' | 'assetTag' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => {
    try {
      // Create a unique temporary ID for the frontend
      const tempId = `temp-${Date.now()}`;

      // Create a temporary asset with required fields for the frontend
      const tempAsset: Asset = {
        ...assetData,
        id: tempId,
        assetTag: `EDU-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        auditTrail: []
      };

      // Add the temporary asset to the state immediately for better UX
      setAssets(prevAssets => [tempAsset, ...prevAssets]);

      // Create the asset in the backend
      const newAsset = await AssetService.createAsset(tempAsset);
      
      // Replace the temporary asset with the real one
      setAssets(prevAssets => [newAsset, ...prevAssets.filter(asset => asset.id !== tempId)]);
      
      return newAsset;
    } catch (error) {
      console.error('Error adding asset:', error);
      // Remove the temporary asset if the backend call fails
      setAssets(prevAssets => prevAssets.filter(asset => !asset.id.startsWith('temp-')));
      throw error;
    }
  }, []);

  const updateAsset = useCallback(async (id: string, updates: Partial<Asset>) => {
    try {
      // Find the asset to update
      const assetToUpdate = assets.find(asset => asset.id === id);
      if (!assetToUpdate) {
        throw new Error('Asset not found');
      }

      // Update the asset in the state immediately for better UX
      setAssets(prevAssets => 
        prevAssets.map(asset => 
          asset.id === id ? { ...asset, ...updates, updatedAt: new Date() } : asset
        )
      );

      // Update the asset in the backend
      const updatedAsset = await AssetService.updateAsset(id, { ...assetToUpdate, ...updates });
      
      // Replace the asset in the state with the updated one from the backend
      setAssets(prevAssets => 
        prevAssets.map(asset => 
          asset.id === id ? updatedAsset : asset
        )
      );
    } catch (error) {
      console.error('Error updating asset:', error);
      // Revert the state update if the backend call fails
      loadAssets(); // Reload all assets to ensure consistency
      throw error;
    }
  }, [assets]);

  const deleteAsset = useCallback(async (id: string) => {
    try {
      // Remove the asset from the state immediately for better UX
      setAssets(prevAssets => prevAssets.filter(asset => asset.id !== id));
      setSelectedAssets(prev => prev.filter(assetId => assetId !== id));

      // Delete the asset from the backend
      await AssetService.deleteAsset(id);
    } catch (error) {
      console.error('Error deleting asset:', error);
      // Reload assets if the backend call fails
      loadAssets();
      throw error;
    }
  }, []);

  const transferAsset = useCallback((assetId: string, transferData: Omit<TransferRecord, 'id'>) => {
    // This function would need to be implemented based on your specific requirements
    // For now, we'll just update the asset's location and department
    updateAsset(assetId, {
      building: transferData.toLocation.split(' - ')[0],
      department: transferData.toDepartment,
      custodian: transferData.toCustodian,
    });
  }, [updateAsset]);

  const scheduleMaintenanceForAsset = useCallback((assetId: string, maintenanceData: Omit<MaintenanceRecord, 'id' | 'assetId'>) => {
    // This function would need to be implemented based on your specific requirements
    // For now, we'll just log that it was called
    console.log('Scheduling maintenance for asset:', assetId, maintenanceData);
  }, []);

  const getAssetsByCategory = useCallback(() => {
    const categoryMap = new Map<string, Asset[]>();
    assets.forEach(asset => {
      const existing = categoryMap.get(asset.category) || [];
      categoryMap.set(asset.category, [...existing, asset]);
    });
    return categoryMap;
  }, [assets]);

  const getAssetsByDepartment = useCallback(() => {
    const departmentMap = new Map<string, Asset[]>();
    assets.forEach(asset => {
      const existing = departmentMap.get(asset.department) || [];
      departmentMap.set(asset.department, [...existing, asset]);
    });
    return departmentMap;
  }, [assets]);

  const getAssetsNeedingMaintenance = useCallback(() => {
    return assets.filter(asset => 
      asset.maintenanceSchedule?.isOverdue || 
      (asset.nextMaintenance && asset.nextMaintenance <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    );
  }, [assets]);

  const getAssetById = useCallback((id: string) => {
    return assets.find(asset => asset.id === id);
  }, [assets]);

  const searchAssets = useCallback((query: string, filters?: Record<string, any>) => {
    let filtered = assets;

    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm) ||
        asset.assetTag?.toLowerCase().includes(searchTerm) ||
        asset.serialNumber?.toLowerCase().includes(searchTerm) ||
        asset.make?.toLowerCase().includes(searchTerm) ||
        asset.model?.toLowerCase().includes(searchTerm) ||
        asset.department?.toLowerCase().includes(searchTerm) ||
        asset.building?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          filtered = filtered.filter(asset => (asset as any)[key] === value);
        }
      });
    }

    return filtered;
  }, [assets]);

  return {
    assets,
    isLoading,
    selectedAssets,
    setSelectedAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    transferAsset,
    scheduleMaintenanceForAsset,
    getAssetsByCategory,
    getAssetsByDepartment,
    getAssetsNeedingMaintenance,
    getAssetById,
    searchAssets,
    loadAssets // Expose loadAssets function for manual reloading
  };
};
