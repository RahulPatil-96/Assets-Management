import { BackendUser, BackendAsset, AuthResponse as BackendAuthResponse } from './backend';
import { MaintenanceRecord } from './maintenance';
import { TransferRecord } from './transfer';

export type User = BackendUser;

export type Asset = BackendAsset;

export type AuthResponse = BackendAuthResponse;

export type { MaintenanceRecord, TransferRecord };
