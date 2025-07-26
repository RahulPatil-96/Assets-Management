import { useState, useEffect, useCallback } from 'react';
import { Asset, MaintenanceRecord, TransferRecord, type MaintenanceSchedule } from '../types';

// Mock data generator for educational institution assets
const generateMockAssets = (): Asset[] => {
  const categories = [
    'IT Equipment',
    'Laboratory Equipment', 
    'Furniture',
    'Vehicles',
    'Library Resources',
    'Sports Equipment',
    'Medical Equipment',
    'Audio Visual',
    'Security Equipment',
    'Maintenance Equipment'
  ];

  const buildings = ['Main Building', 'Science Building', 'Library', 'Gymnasium', 'Dormitory A', 'Dormitory B', 'Administration'];
  const departments = ['Computer Science', 'Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'History', 'Administration', 'Facilities', 'Library'];

  return Array.from({ length: 500 }, (_, i) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const building = buildings[Math.floor(Math.random() * buildings.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const purchaseDate = new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000);
    const purchaseCost = Math.floor(Math.random() * 50000) + 500;
    const currentValue = purchaseCost * (0.3 + Math.random() * 0.7);

    const asset: Asset = {
      id: `asset-${i + 1}`,
      assetTag: `EDU-${String(i + 1).padStart(6, '0')}`,
      name: `${category} Item ${i + 1}`,
      category: category as Asset['category'],
      subCategory: getSubCategory(category),
      make: getMake(category),
      model: `Model-${Math.floor(Math.random() * 1000)}`,
      serialNumber: `SN${Math.floor(Math.random() * 1000000000)}`,
      barcode: `BC${Math.floor(Math.random() * 1000000000000)}`,
      qrCode: `QR${Math.floor(Math.random() * 1000000000000)}`,
      
      purchaseDate,
      purchaseCost,
      currentValue,
      depreciationRate: 0.1 + Math.random() * 0.2,
      salvageValue: purchaseCost * 0.1,
      
      building,
      room: `${Math.floor(Math.random() * 500) + 100}`,
      department,
      assignedTo: Math.random() > 0.3 ? `User ${Math.floor(Math.random() * 100)}` : undefined,
      custodian: `Custodian ${Math.floor(Math.random() * 20)}`,
      
      status: getRandomStatus(),
      condition: getRandomCondition(),
      
      warrantyProvider: Math.random() > 0.5 ? `Warranty Provider ${Math.floor(Math.random() * 10)}` : undefined,
      warrantyExpiry: Math.random() > 0.5 ? new Date(purchaseDate.getTime() + Math.random() * 3 * 365 * 24 * 60 * 60 * 1000) : undefined,
      lastMaintenance: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) : undefined,
      nextMaintenance: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
      
      maintenanceSchedule: {
        frequency: getRandomFrequency(),
        intervalDays: Math.floor(Math.random() * 365) + 30,
        nextDue: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
        isOverdue: Math.random() > 0.8,
        maintenanceType: getRandomMaintenanceType(),
        estimatedCost: Math.floor(Math.random() * 1000) + 100,
        requiredSkills: getRandomSkills()
      },
      
      maintenanceHistory: generateMaintenanceHistory(3),
      specifications: generateSpecifications(category),
      documents: [],
      photos: [],
      transferHistory: [],
      auditTrail: [],
      
      expectedLifespan: Math.floor(Math.random() * 15) + 5,
      disposalDate: undefined,
      disposalMethod: undefined,
      
      notes: Math.random() > 0.7 ? `Notes for asset ${i + 1}` : undefined,
      tags: generateRandomTags(),
      createdAt: purchaseDate,
      updatedAt: new Date(),
      createdBy: 'System',
      updatedBy: 'System',
      location: `${building} - ${Math.floor(Math.random() * 500) + 100}`,
      utilizationScore: Math.floor(Math.random() * 100)
    };

    return asset;
  });
};

const getSubCategory = (category: string): string => {
  const subCategories: Record<string, string[]> = {
    'IT Equipment': ['Computers', 'Printers', 'Servers', 'Network Equipment', 'Tablets'],
    'Laboratory Equipment': ['Microscopes', 'Centrifuges', 'Spectrometers', 'Balances', 'Incubators'],
    'Furniture': ['Desks', 'Chairs', 'Tables', 'Cabinets', 'Whiteboards'],
    'Vehicles': ['Cars', 'Vans', 'Buses', 'Maintenance Vehicles'],
    'Library Resources': ['Books', 'Journals', 'Digital Resources', 'Furniture'],
    'Sports Equipment': ['Exercise Machines', 'Sports Gear', 'Outdoor Equipment'],
    'Medical Equipment': ['First Aid', 'Diagnostic Equipment', 'Emergency Equipment'],
    'Audio Visual': ['Projectors', 'Screens', 'Sound Systems', 'Cameras'],
    'Security Equipment': ['Cameras', 'Access Control', 'Alarms', 'Monitoring'],
    'Maintenance Equipment': ['Tools', 'Cleaning Equipment', 'HVAC', 'Electrical']
  };
  
  const subs = subCategories[category] || ['General'];
  return subs[Math.floor(Math.random() * subs.length)];
};

const getMake = (category: string): string => {
  const makes: Record<string, string[]> = {
    'IT Equipment': ['Dell', 'HP', 'Apple', 'Lenovo', 'Cisco'],
    'Laboratory Equipment': ['Thermo Fisher', 'Agilent', 'PerkinElmer', 'Waters'],
    'Furniture': ['Steelcase', 'Herman Miller', 'Knoll', 'Haworth'],
    'Vehicles': ['Ford', 'Chevrolet', 'Toyota', 'Honda'],
    'Audio Visual': ['Epson', 'Sony', 'Panasonic', 'BenQ'],
    'Sports Equipment': ['Life Fitness', 'Precor', 'Cybex', 'NordicTrack']
  };
  
  const makesForCategory = makes[category] || ['Generic'];
  return makesForCategory[Math.floor(Math.random() * makesForCategory.length)];
};

const getRandomStatus = (): Asset['status'] => {
  const statuses: Asset['status'][] = ['active', 'maintenance', 'retired', 'disposed', 'missing', 'reserved'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const getRandomCondition = (): Asset['condition'] => {
  const conditions: Asset['condition'][] = ['excellent', 'good', 'fair', 'poor', 'needs_repair'];
  return conditions[Math.floor(Math.random() * conditions.length)];
};

const getRandomFrequency = (): MaintenanceSchedule['frequency'] => {
  const frequencies: MaintenanceSchedule['frequency'][] = ['monthly', 'quarterly', 'semi-annual', 'annual'];
  return frequencies[Math.floor(Math.random() * frequencies.length)];
};

const getRandomMaintenanceType = (): MaintenanceSchedule['maintenanceType'] => {
  const types: MaintenanceSchedule['maintenanceType'][] = ['preventive', 'corrective', 'predictive'];
  return types[Math.floor(Math.random() * types.length)];
};

const getRandomSkills = (): string[] => {
  const skills = ['Electrical', 'Mechanical', 'Software', 'Cleaning', 'Calibration', 'Inspection'];
  return skills.filter(() => Math.random() > 0.5);
};

const generateMaintenanceHistory = (count: number): MaintenanceRecord[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `maint-${i + 1}`,
    assetId: '',
    type: getRandomMaintenanceType() as MaintenanceRecord['type'],
    description: `Maintenance activity ${i + 1}`,
    performedBy: `Technician ${Math.floor(Math.random() * 10)}`,
    performedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    completedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    cost: Math.floor(Math.random() * 1000) + 50,
    laborHours: Math.floor(Math.random() * 8) + 1,
    partsUsed: [],
    status: 'completed',
    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as MaintenanceRecord['priority'],
    workOrderNumber: `WO-${Math.floor(Math.random() * 10000)}`,
    photos: [],
    documents: []
  }));
};

const generateSpecifications = (category: string): Record<string, any> => {
  const specs: Record<string, Record<string, any>> = {
    'IT Equipment': {
      processor: 'Intel Core i7',
      memory: '16GB',
      storage: '512GB SSD',
      os: 'Windows 11'
    },
    'Laboratory Equipment': {
      accuracy: '±0.1mg',
      capacity: '220g',
      calibration: 'External',
      connectivity: 'USB, Ethernet'
    },
    'Furniture': {
      material: 'Steel/Wood',
      dimensions: '120x60x75cm',
      weight: '25kg',
      color: 'Gray'
    }
  };
  
  return specs[category] || { type: 'Standard' };
};

const generateRandomTags = (): string[] => {
  const allTags = ['critical', 'high-value', 'portable', 'shared', 'research', 'teaching', 'administrative'];
  return allTags.filter(() => Math.random() > 0.7);
};

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  useEffect(() => {
    const loadAssets = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const savedAssets = localStorage.getItem('educational_assets');
      if (savedAssets) {
        const parsedAssets = JSON.parse(savedAssets).map((asset: any) => ({
          ...asset,
          purchaseDate: new Date(asset.purchaseDate),
          warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : undefined,
          lastMaintenance: asset.lastMaintenance ? new Date(asset.lastMaintenance) : undefined,
          nextMaintenance: asset.nextMaintenance ? new Date(asset.nextMaintenance) : undefined,
          createdAt: new Date(asset.createdAt),
          updatedAt: new Date(asset.updatedAt)
        }));
        setAssets(parsedAssets);
      } else {
        const mockAssets = generateMockAssets();
        setAssets(mockAssets);
        localStorage.setItem('educational_assets', JSON.stringify(mockAssets));
      }
      
      setIsLoading(false);
    };

    loadAssets();
  }, []);

  const addAsset = useCallback((assetData: Omit<Asset, 'id' | 'assetTag' | 'createdAt' | 'updatedAt' | 'auditTrail'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: `asset-${Date.now()}`,
      assetTag: `EDU-${String(assets.length + 1).padStart(6, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      auditTrail: [{
        id: `audit-${Date.now()}`,
        action: 'created',
        userId: 'current-user',
        userName: 'Current User',
        timestamp: new Date(),
        notes: 'Asset created'
      }]
    };

    const updatedAssets = [newAsset, ...assets];
    setAssets(updatedAssets);
    localStorage.setItem('educational_assets', JSON.stringify(updatedAssets));
    return newAsset;
  }, [assets]);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    const updatedAssets = assets.map(asset => {
      if (asset.id === id) {
        const updatedAsset = {
          ...asset,
          ...updates,
          updatedAt: new Date(),
          auditTrail: [
            ...asset.auditTrail,
            {
              id: `audit-${Date.now()}`,
              action: 'updated' as const,
              userId: 'current-user',
              userName: 'Current User',
              timestamp: new Date(),
              changes: Object.keys(updates).reduce((acc, key) => {
                acc[key] = { old: (asset as any)[key], new: (updates as any)[key] };
                return acc;
              }, {} as Record<string, { old: any; new: any }>),
              notes: 'Asset updated'
            }
          ]
        };
        return updatedAsset;
      }
      return asset;
    });

    setAssets(updatedAssets);
    localStorage.setItem('educational_assets', JSON.stringify(updatedAssets));
  }, [assets]);

  const deleteAsset = useCallback((id: string) => {
    const updatedAssets = assets.filter(asset => asset.id !== id);
    setAssets(updatedAssets);
    localStorage.setItem('educational_assets', JSON.stringify(updatedAssets));
    setSelectedAssets(prev => prev.filter(assetId => assetId !== id));
  }, [assets]);

  const transferAsset = useCallback((assetId: string, transferData: Omit<TransferRecord, 'id'>) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const transferRecord: TransferRecord = {
      ...transferData,
      id: `transfer-${Date.now()}`
    };

    updateAsset(assetId, {
      building: transferData.toLocation.split(' - ')[0] || asset.building,
      room: transferData.toLocation.split(' - ')[1] || asset.room,
      department: transferData.toDepartment,
      custodian: transferData.toCustodian,
      transferHistory: [...asset.transferHistory, transferRecord]
    });
  }, [assets, updateAsset]);

  const scheduleMaintenanceForAsset = useCallback((assetId: string, maintenanceData: Omit<MaintenanceRecord, 'id' | 'assetId'>) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const maintenanceRecord: MaintenanceRecord = {
      ...maintenanceData,
      id: `maint-${Date.now()}`,
      assetId
    };

    updateAsset(assetId, {
      maintenanceHistory: [...asset.maintenanceHistory, maintenanceRecord],
      lastMaintenance: maintenanceData.status === 'completed' ? maintenanceData.performedDate : asset.lastMaintenance,
      nextMaintenance: maintenanceData.nextMaintenanceDate
    });
  }, [assets, updateAsset]);

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
      asset.maintenanceSchedule.isOverdue || 
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
        asset.assetTag.toLowerCase().includes(searchTerm) ||
        asset.serialNumber.toLowerCase().includes(searchTerm) ||
        asset.make.toLowerCase().includes(searchTerm) ||
        asset.model.toLowerCase().includes(searchTerm) ||
        asset.department.toLowerCase().includes(searchTerm) ||
        asset.building.toLowerCase().includes(searchTerm)
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
    searchAssets
  };
};