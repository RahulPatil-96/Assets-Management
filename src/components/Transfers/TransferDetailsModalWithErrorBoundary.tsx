import React from 'react';
import ErrorBoundary from '../ErrorBoundary';
import TransferDetailsModal, { TransferDetailsModalProps } from './TransferDetailsModal';

const TransferDetailsModalWithErrorBoundary: React.FC<TransferDetailsModalProps> = props => (
  <ErrorBoundary>
    <TransferDetailsModal {...props} />
  </ErrorBoundary>
);

export default TransferDetailsModalWithErrorBoundary;
