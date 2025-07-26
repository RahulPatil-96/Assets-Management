export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'department_head' | 'maintenance_staff' | 'finance' | 'it_team' | 'staff';
  department: string;
  permissions: string[];
  avatar?: string;
  lastLogin: Date;
  isActive: boolean;
}

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: 'IT Equipment' | 'Laboratory Equipment' | 'Furniture' | 'Vehicles' | 'Library Resources' | 'Sports Equipment' | 'Medical Equipment' | 'Audio Visual' | 'Security Equipment' | 'Maintenance Equipment';
  subCategory: string;
  make: string;
  model: string;
  serialNumber: string;
  barcode?: string;
  qrCode?: string;

  // Financial Information
  purchaseDate: Date;
  purchaseCost: number;
  currentValue: number;
  depreciationRate: number;
  salvageValue: number;

  // Location and Assignment
  building: string;
  room: string;
  department: string;
  assignedTo?: string;
  custodian: string;

  // Status and Condition
  status: 'active' | 'maintenance' | 'retired' | 'disposed' | 'missing' | 'reserved';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair';

  // Warranty and Maintenance
  warrantyProvider?: string;
  warrantyExpiry?: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  maintenanceSchedule: MaintenanceSchedule;
  maintenanceHistory: MaintenanceRecord[];

  // Technical Specifications
  specifications: Record<string, any>;

  // Documentation
  photos: string[];

  // Tracking
  transferHistory: TransferRecord[];
  auditTrail: AuditRecord[];

  // Lifecycle
  expectedLifespan: number; // in years
  disposalDate?: Date;
  disposalMethod?: string;

  // Additional Fields
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;

  // Added missing properties
  location: string;
  utilizationScore: number;
  predictedEOL?: Date;
}

export interface MaintenanceSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'as-needed';
  intervalDays: number;
  lastPerformed?: Date;
  nextDue: Date;
  isOverdue: boolean;
  maintenanceType: 'preventive' | 'corrective' | 'predictive';
  estimatedCost: number;
  requiredSkills: string[];
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  description: string;
  performedBy: string;
  performedDate: Date;
  completedDate?: Date;
  cost: number;
  laborHours: number;
  partsUsed: MaintenancePart[];
  nextMaintenanceDate?: Date;
  notes?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  workOrderNumber: string;
  approvedBy?: string;
  photos: string[];
  documents: string[];
}

export interface MaintenancePart {
  partNumber: string;
  description: string;
  quantity: number;
  unitCost: number;
  supplier: string;
}

export interface TransferRecord {
  id: string;
  fromLocation: string;
  toLocation: string;
  fromDepartment: string;
  toDepartment: string;
  fromCustodian: string;
  toCustodian: string;
  transferDate: Date;
  reason: string;
  approvedBy: string;
  notes?: string;
  transferType: 'permanent' | 'temporary' | 'loan';
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
}

export interface AuditRecord {
  id: string;
  action: 'created' | 'updated' | 'transferred' | 'maintenance' | 'disposed' | 'found' | 'missing';
  userId: string;
  userName: string;
  timestamp: Date;
  changes?: Record<string, { old: any; new: any }>;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}