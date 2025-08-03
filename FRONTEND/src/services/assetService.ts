// src/services/assetService.ts
import { api } from './api';
import { Asset as FrontendAsset } from '../types';

// Backend asset structure
export interface BackendAsset {
  item_id?: string;
  name: string;
  description: string;
  lab: string;
  issue: string;
  current_status: string;
  category?: string;
  make?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_cost?: number;
  room?: string;
  condition_status?: string;
  warranty_expiry?: string;
}

class AssetService {
  async getAssets(): Promise<FrontendAsset[]> {
    const backendAssets: BackendAsset[] = await api.get('/api/inventory');
    return backendAssets.map(mapBackendAssetToFrontendAsset);
  }

  async getAssetById(id: string): Promise<FrontendAsset> {
    const backendAsset: BackendAsset = await api.get(`/api/inventory/${id}`);
    return mapBackendAssetToFrontendAsset(backendAsset);
  }

  async createAsset(asset: FrontendAsset): Promise<FrontendAsset> {
    const backendAsset = mapFrontendAssetToBackendAsset(asset);
    const createdBackendAsset: BackendAsset = await api.post('/api/inventory', backendAsset);
    return mapBackendAssetToFrontendAsset(createdBackendAsset);
  }

  async updateAsset(id: string, asset: FrontendAsset): Promise<FrontendAsset> {
    const backendAsset = mapFrontendAssetToBackendAsset(asset);
    const updatedBackendAsset: BackendAsset = await api.put(`/api/inventory/${id}`, backendAsset);
    return mapBackendAssetToFrontendAsset(updatedBackendAsset);
  }

  async deleteAsset(id: string): Promise<void> {
    return api.delete(`/api/inventory/${id}`);
  }
}

// Helper function to map backend asset to frontend asset
const mapBackendAssetToFrontendAsset = (backendAsset: any): FrontendAsset => {
  // Generate a unique ID for the frontend asset
  const id = backendAsset.item_id || `asset-${Date.now()}`;
  
  const frontendAsset: FrontendAsset = {
    id: id,
    name: backendAsset.name,
    category: backendAsset.category || 'IT Equipment',
    make: backendAsset.make || 'Unknown',
    serialNumber: backendAsset.serial_number || 'Unknown',
    barcode: undefined,
    qrCode: undefined,
    
    // Financial Information
    purchaseDate: backendAsset.purchase_date ? new Date(backendAsset.purchase_date) : new Date(),
    purchaseCost: backendAsset.purchase_cost || 0,
    
    // Location and Assignment
    room: backendAsset.room || '100',
    assignedTo: undefined,
    
    // Status and Condition
    status: mapBackendStatusToFrontendStatus(backendAsset.current_status),
    condition: backendAsset.condition_status || 'good',
    
    // Warranty and Maintenance
    warrantyExpiry: backendAsset.warranty_expiry ? new Date(backendAsset.warranty_expiry) : undefined,
    lastMaintenance: undefined,
    nextMaintenance: undefined,
    maintenanceSchedule: {
      frequency: 'annual',
      intervalDays: 365,
      nextDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isOverdue: false,
      maintenanceType: 'preventive',
      estimatedCost: 100,
      requiredSkills: []
    },
    maintenanceHistory: [],
    
    // Technical Specifications
    specifications: {},
    
    // Documentation
    photos: [],
    
    // Tracking
    transferHistory: [],
    auditTrail: [],
    
    // Lifecycle
    disposalDate: undefined,
    disposalMethod: undefined,
    
    // Additional Fields
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'System',
    updatedBy: 'System',
    predictedEOL: undefined
  };
  
  return frontendAsset;
};

// Helper function to map frontend asset to backend asset
const mapFrontendAssetToBackendAsset = (frontendAsset: FrontendAsset): any => {
  const backendAsset: any = {
    item_id: frontendAsset.id,
    name: frontendAsset.name,
    description: '', // Map notes to description
    lab: 'Unknown Lab', // Map building to lab
    issue: 'None', // Default issue
    current_status: mapFrontendStatusToBackendStatus(frontendAsset.status),
    category: frontendAsset.category,
    make: frontendAsset.make,
    serial_number: frontendAsset.serialNumber,
    purchase_date: frontendAsset.purchaseDate ? frontendAsset.purchaseDate.toISOString().split('T')[0] : undefined,
    purchase_cost: frontendAsset.purchaseCost,
    room: frontendAsset.room,
    condition_status: frontendAsset.condition,
    warranty_expiry: frontendAsset.warrantyExpiry ? frontendAsset.warrantyExpiry.toISOString().split('T')[0] : undefined
  };
  
  return backendAsset;
}

// Helper function to map backend status to frontend status
const mapBackendStatusToFrontendStatus = (backendStatus: string): FrontendAsset['status'] => {
  switch (backendStatus.toLowerCase()) {
    case 'active':
      return 'active';
    case 'maintenance':
      return 'maintenance';
    case 'retired':
      return 'retired';
    case 'disposed':
      return 'disposed';
    default:
      return 'active';
  }
};

// Helper function to map frontend status to backend status
const mapFrontendStatusToBackendStatus = (frontendStatus: FrontendAsset['status']): string => {
  return frontendStatus;
};

export default new AssetService();
