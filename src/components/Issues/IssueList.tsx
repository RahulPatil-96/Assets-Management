import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Plus, CheckCircle, User, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, AssetIssue } from '../../lib/supabase';
import { NotificationService } from '../../lib/notificationService';
import IssueForm from './IssueForm';
import IssueDetailsModal from './IssueDetailsModal';

const IssueList: React.FC = () => {
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [viewingIssue, setViewingIssue] = useState<AssetIssue | null>(null);

  const fetchIssues = async (): Promise<AssetIssue[]> => {
    const { data, error } = await supabase
      .from('asset_issues')
      .select(`
        *,
        asset:assets(name_of_supply, allocated_lab),
        reporter:user_profiles!reported_by(name, role),
        resolver:user_profiles!resolved_by(name, role)
      `)
      .order('reported_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const { data: issues = [], isLoading, refetch } = useQuery({
    queryKey: ['issues'],
    queryFn: fetchIssues
  });

  useEffect(() => {
    // Subscribe to real-time changes in the asset_issues table
    const subscription = supabase
      .channel('issues-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asset_issues',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [refetch]);

  const handleResolve = async (issueId: string) => {
    try {
      const { error } = await supabase
        .from('asset_issues')
        .update({
          status: 'resolved',
          resolved_by: profile?.id,
        })
        .eq('id', issueId);

      if (error) throw error;

      // Create notification for all users about the resolved issue
      if (profile?.id) {
        await NotificationService.createNotificationForAllUsers(
          profile.id,
          'resolved',
          'issue',
          issueId,
          'Issue Resolved'
        );
      }

      refetch();
    } catch (error) {
      console.error('Error resolving issue:', error);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'resolved' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    return status === 'resolved' ? CheckCircle : AlertTriangle;
  };

  const handleViewDetails = (issue: AssetIssue) => {
    setViewingIssue(issue);
  };

  const canResolve = (issue: AssetIssue) => {
    return profile?.role === 'Lab Assistant' && issue.status === 'open';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {profile?.role === 'Faculty' ? 'Report Issues' : 'Issue Management'}
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Report Issue</span>
        </button>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {issues.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <AlertTriangle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No issues reported</p>
          </div>
        ) : (
          issues.map((issue) => {
            const StatusIcon = getStatusIcon(issue.status);
            return (
              <div
                key={issue.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <StatusIcon className={`w-5 h-5 ${getStatusColor(issue.status)}`} />
                      <span className={`font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status === 'resolved' ? 'Resolved' : 'Open'}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(issue.reported_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Asset: {issue.asset?.name_of_supply}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{issue.issue_description}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Reported by: {issue.reporter?.name}</span>
                      </div>
                      <span>Lab: {issue.asset?.allocated_lab}</span>
                      {issue.resolver && (
                        <span>Resolved by: {issue.resolver.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(issue)}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {canResolve(issue) && (
                      <button
                        onClick={() => handleResolve(issue.id)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Issue Form Modal */}
      {showForm && (
        <IssueForm
          onClose={() => setShowForm(false)}
          onSave={refetch}
        />
      )}

      {viewingIssue && (
        <IssueDetailsModal
          issue={viewingIssue}
          onClose={() => setViewingIssue(null)}
        />
      )}
    </div>
  );
};

export default IssueList;