import React from 'react';
import ErrorBoundary from '../ErrorBoundary';
import IssueDetailsModal, { IssueDetailsModalProps } from './IssueDetailsModal';

const IssueDetailsModalWithErrorBoundary: React.FC<IssueDetailsModalProps> = props => (
  <ErrorBoundary>
    <IssueDetailsModal {...props} />
  </ErrorBoundary>
);

export default IssueDetailsModalWithErrorBoundary;
