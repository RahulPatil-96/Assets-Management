// Enhanced Asset Service aligned with backend API
import { api } from './api';
import { BackendAsset } from '../types/backend';

// Frontend asset interface for UI
export interface FrontendAsset {
  id: string;
  name: string;
  description: string;
  lab: string;
  issue: string;
  status: 'active' | 'maintenance' | 'retired' | 'disposed' | 'missing';
  category?: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  assetTag?: string;
  barcode?: string;
  qrCode?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  purchaseOrder?: string;
  vendor?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair';
  warrantyExpiry?: Date;
  warrantyProvider?: string;
  building?: string;
  department?: string;
  room?: string;
  floor?: string;
  custodian?: string;
  assignedTo?: string;
  specifications?: Record<string, any>;
  photos?: string[];
  documents?: string[];
  tags?: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  nextMaintenance?: Date;
  lastMaintenance?: Date;
  maintenanceSchedule?: {
    frequency: string;
    intervalDays: number;
    nextDue: Date;
    isOverdue: boolean;
    maintenanceType: string;
    estimatedCost: number;
    requiredSkills: string[];
  };
  maintenanceHistory?: any[];
  predictedEOL?: Date;
}

// Mapping functions between backend and frontend
const mapBackendToFrontend = (backendAsset: BackendAsset): FrontendAsset => {
  return {
    id: backendAsset.item_id,
    name: backendAsset.name,
    description: backendAsset.description,
    lab: backendAsset.lab,
    issue: backendAsset.issue,
    status: backendAsset.current_status as FrontendAsset['status'],
    category: backendAsset.category,
    make: backendAsset.make,
    model: backendAsset.model,
    serialNumber: backendAsset.serial_number,
    assetTag: backendAsset.asset_tag,
    barcode: backendAsset.barcode,
    qrCode: backendAsset.qr_code,
    purchaseDate: backendAsset.purchase_date ? new Date(backendAsset.purchase_date) : undefined,
    purchaseCost: backendAsset.purchase_cost,
    purchaseOrder: backendAsset.purchase_order,
    vendor: backendAsset.vendor,
    condition: backendAsset.condition_status as FrontendAsset['condition'],
    warrantyExpiry: backendAsset.warranty_expiry ? new Date(backendAsset.warranty_expiry) : undefined,
    warrantyProvider: backendAsset.warranty_provider,
    building: backendAsset.building,
    department: backendAsset.department,
    room: backendAsset.room,
    floor: backendAsset.floor,
    custodian: backendAsset.custodian,
    assignedTo: backendAsset.assigned_to,
    specifications: backendAsset.specifications,
    photos: backendAsset.photos,
    documents: backendAsset.documents,
    tags: backendAsset.tags,
    notes: backendAsset.notes,
    createdAt: backendAsset.created_at ? new Date(backendAsset.created_at) : undefined,
    updatedAt: backendAsset.updated_at ? new Date(backendAsset.updated_at) : undefined,
    createdBy: backendAsset.created_by,
    updatedBy: backendAsset.updated_by,
  };
};

const mapFrontendToBackend = (frontendAsset: FrontendAsset): BackendAsset => {
  return {
    item_id: frontendAsset.id,
    name: frontendAsset.name,
    description: frontendAsset.description,
    lab: frontendAsset.lab,
    issue: frontendAsset.issue,
    current_status: frontendAsset.status,
    category: frontendAsset.category,
    make: frontendAsset.make,
    model: frontendAsset.model,
    serial_number: frontendAsset.serialNumber,
    asset_tag: frontendAsset.assetTag,
    barcode: frontendAsset.barcode,
    qr_code: frontendAsset.qrCode,
    purchase_date: frontendAsset.purchaseDate?.toISOString().split('T')[0],
    purchase_cost: frontendAsset.purchaseCost,
    purchase_order: frontendAsset.purchaseOrder,
    vendor: frontendAsset.vendor,
    condition_status: frontendAsset.condition,
    warranty_expiry: frontendAsset.warrantyExpiry?.toISOString().split('T')[0],
    warranty_provider: frontendAsset.warrantyProvider,
    building: frontendAsset.building,
    department: frontendAsset.department,
    room: frontendAsset.room,
    floor: frontendAsset.floor,
    custodian: frontendAsset.custodian,
    assigned_to: frontendAsset.assignedTo,
    specifications: frontendAsset.specifications,
    photos: frontendAsset.photos,
    documents: frontendAsset.documents,
    tags: frontendAsset.tags,
    notes: frontendAsset.notes,
  };
};

class AssetService {
  async getAssets(): Promise<FrontendAsset[]> {
    try {
      const backendAssets: BackendAsset[] = await api.get('/api/inventory');
      return backendAssets.map(mapBackendToFrontend);
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  }

  async getAssetById(id: string): Promise<FrontendAsset> {
    try {
      const backendAsset: BackendAsset = await api.get(`/api/inventory/${id}`);
      return mapBackendToFrontend(backendAsset);
    } catch (error) {
      console.error('Error fetching asset by ID:', error);
      throw error;
    }
  }

  async createAsset(asset: Omit<FrontendAsset, 'id'>): Promise<FrontendAsset> {
    try {
      const backendAsset = mapFrontendToBackend({ ...asset, id: '' });
      const createdBackendAsset: BackendAsset = await api.post('/api/inventory', backendAsset);
      return mapBackendToFrontend(createdBackendAsset);
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  }

  async updateAsset(id: string, asset: Partial<FrontendAsset>): Promise<FrontendAsset> {
    try {
      const backendAsset = mapFrontendToBackend({ ...asset, id } as FrontendAsset);
      const updatedBackendAsset: BackendAsset = await api.put(`/api/inventory/${id}`, backendAsset);
      return mapBackendToFrontend(updatedBackendAsset);
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  }

  async deleteAsset(id: string): Promise<void> {
    try {
      await api.delete(`/api/inventory/${id}`);
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  }

  async getAssetsSummary(): Promise<any> {
    try {
      return await api.get('/api/inventory/summary');
    } catch (error) {
      console.error('Error fetching assets summary:', error);
      throw error;
    }
  }

  async searchAssets(query: string): Promise<FrontendAsset[]> {
    try {
      const backendAssets: BackendAsset[] = await api.get(`/api/inventory?search=${encodeURIComponent(query)}`);
      return backendAssets.map(mapBackendToFrontend);
    } catch (error) {
      console.error('Error searching assets:', error);
      throw error;
    }
  }
}

export default new AssetService();
