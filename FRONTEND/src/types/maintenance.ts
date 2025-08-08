// Maintenance record types for asset maintenance tracking

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: 'preventive' | 'corrective' | 'emergency';
  description: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceSchedule {
  isOverdue: boolean;
  nextDueDate?: string;
  frequency?: string;
  lastMaintenanceDate?: string;
}

export interface MaintenanceSummary {
  totalScheduled: number;
  totalInProgress: number;
  totalCompleted: number;
  totalOverdue: number;
  upcomingMaintenance: MaintenanceRecord[];
}
