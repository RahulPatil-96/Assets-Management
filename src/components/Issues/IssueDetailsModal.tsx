import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AssetIssue } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

export interface IssueDetailsModalProps {
  issue: AssetIssue | null;
  onClose: () => void;
}

const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({ issue, onClose }) => {
  const [resolverName, setResolverName] = useState<string>('');
  const [loadingResolver, setLoadingResolver] = useState(false);

  useEffect(() => {
    const fetchResolverName = async () => {
      if (!issue?.resolved_by) {
        setResolverName('');
        return;
      }

      // If resolver is already populated from the relationship, use it
      if (issue.resolver?.name) {
        setResolverName(issue.resolver.name);
        return;
      }

      setLoadingResolver(true);
      try {
        const { data: resolverData, error } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', issue.resolved_by)
          .maybeSingle();

        if (error) {
          console.error('Error fetching resolver name:', error);
          setResolverName('');
        } else if (resolverData) {
          setResolverName(resolverData.name || '');
        } else {
          setResolverName('');
        }
      } catch (error) {
        console.error('Error fetching resolver name:', error);
        setResolverName('');
      } finally {
        setLoadingResolver(false);
      }
    };

    fetchResolverName();
  }, [issue?.resolved_by, issue?.resolver?.name]);

  if (!issue) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Issue Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Issue Information</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    issue.status === 'resolved' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {issue.status === 'resolved' ? 'Resolved' : 'Open'}
                  </span>
                </p>
                <p className="text-sm"><span className="font-medium">Reported At:</span> {new Date(issue.reported_at).toLocaleString()}</p>
                {issue.resolved_at && (
                  <p className="text-sm"><span className="font-medium">Resolved At:</span> {new Date(issue.resolved_at).toLocaleString()}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Asset Information</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Asset Name:</span> {issue.asset?.name_of_supply || 'N/A'}</p>
                <p className="text-sm"><span className="font-medium">Lab:</span> {issue.asset?.allocated_lab || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Issue Description</h3>
            <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {issue.issue_description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Reporter Details</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Name:</span> {issue.reporter?.name || ''}</p>
                <p className="text-sm"><span className="font-medium">Role:</span> {issue.reporter?.role || 'N/A'}</p>
              </div>
            </div>

            {issue.status === 'resolved' && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolver Details</h3>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-medium">Name:</span> 
                    {loadingResolver ? 'Loading...' : resolverName}
                  </p>
                  {issue.resolver && (
                    <p className="text-sm"><span className="font-medium">Role:</span> {issue.resolver.role}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {issue.status === 'resolved' && (
            <>
              {issue.remark && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolution Remark</h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {issue.remark}
                  </p>
                </div>
              )}
              
              {issue.cost_required && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost Required</h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    ₹{issue.cost_required.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </>
          )}

          {issue.updated_at && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</h3>
              <p className="text-sm">{new Date(issue.updated_at).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailsModal;
