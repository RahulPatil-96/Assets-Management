import { useState, useEffect, useCallback } from 'react';
import assetService, { FrontendAsset } from '../services/assetService';
import authService from '../services/authService';

export interface UseAssetsReturn {
  assets: FrontendAsset[];
  loading: boolean;
  error: string | null;
  isLoading: boolean;
  selectedAssets: string[];
  setSelectedAssets: React.Dispatch<React.SetStateAction<string[]>>;
  addAsset: (asset: Omit<FrontendAsset, 'id'>) => Promise<void>;
  updateAsset: (id: string, asset: Partial<FrontendAsset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  loadAssets: () => Promise<void>;
  refetch: () => Promise<void>;
  searchAssets: (query: string) => Promise<void>;
}

export const useAssets = (): UseAssetsReturn => {
  const [assets, setAssets] = useState<FrontendAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!authService.isAuthenticated()) {
        setError('Please login to access assets');
        setLoading(false);
        return;
      }

      const fetchedAssets = await assetService.getAssets();
      setAssets(fetchedAssets);
    } catch (error: any) {
      console.error('Error loading assets:', error);
      
      if (error.status === 401) {
        setError('Authentication required. Please login again.');
        authService.logout();
      } else if (error.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (error.status === 400) {
        setError('Invalid request. Please check your input.');
      } else if (error.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(error.message || 'Failed to load assets');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addAsset = useCallback(async (asset: Omit<FrontendAsset, 'id'>) => {
    try {
      setLoading(true);
      const newAsset = await assetService.createAsset(asset);
      setAssets(prev => [...prev, newAsset]);
    } catch (error: any) {
      console.error('Error adding asset:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAsset = useCallback(async (id: string, asset: Partial<FrontendAsset>) => {
    try {
      setLoading(true);
      const updatedAsset = await assetService.updateAsset(id, asset);
      setAssets(prev => prev.map(a => a.id === id ? updatedAsset : a));
    } catch (error: any) {
      console.error('Error updating asset:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAsset = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await assetService.deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
      setSelectedAssets(prev => prev.filter(assetId => assetId !== id));
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchAssets = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!authService.isAuthenticated()) {
        setError('Please login to search assets');
        return;
      }

      const searchResults = await assetService.searchAssets(query);
      setAssets(searchResults);
    } catch (error: any) {
      console.error('Error searching assets:', error);
      
      if (error.status === 401) {
        setError('Authentication required. Please login again.');
        authService.logout();
      } else {
        setError(error.message || 'Failed to search assets');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  return {
    assets,
    loading,
    error,
    isLoading: loading,
    selectedAssets,
    setSelectedAssets,
    addAsset,
    updateAsset,
    deleteAsset,
    loadAssets,
    refetch: loadAssets,
    searchAssets,
  };
};
