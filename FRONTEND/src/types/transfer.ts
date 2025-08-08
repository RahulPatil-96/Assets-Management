// Transfer record types for asset transfer tracking

export interface TransferRecord {
  id: string;
  assetId: string;
  fromLocation: string;
  toLocation: string;
  fromDepartment: string;
  toDepartment: string;
  fromCustodian?: string;
  toCustodian?: string;
  transferDate: string;
  reason: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferRequest {
  assetId: string;
  toLocation: string;
  toDepartment: string;
  toCustodian?: string;
  reason: string;
  requestedBy: string;
  requestedDate: string;
}

export interface TransferHistory {
  transfers: TransferRecord[];
  currentLocation: string;
  currentDepartment: string;
  currentCustodian?: string;
}
