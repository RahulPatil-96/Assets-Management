import React from 'react';
import ErrorBoundary from '../ErrorBoundary';
import AssetDetailsModal, { AssetDetailsModalProps } from './AssetDetailsModal';

const AssetDetailsModalWithErrorBoundary: React.FC<AssetDetailsModalProps> = props => (
  <ErrorBoundary>
    <AssetDetailsModal {...props} />
  </ErrorBoundary>
);

export default AssetDetailsModalWithErrorBoundary;
