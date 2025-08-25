import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Plus, CheckCircle, User, Eye, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, AssetIssue } from '../../lib/supabase';
import { NotificationService } from '../../lib/notificationService';
import IssueForm from './IssueForm';
import IssueDetailsModal from './IssueDetailsModal';
import IssueAnalyticsDashboard from '../Analytics/IssueAnalyticsDashboard';
import ExportButton from '../Export/ExportButton';

const IssueList: React.FC = () => {
  const { profile } = useAuth();
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLab, setFilterLab] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewingIssue, setViewingIssue] = useState<AssetIssue | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [resolvingIssue, setResolvingIssue] = useState<AssetIssue | null>(null);
  const [remark, setRemark] = useState<string>('');

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

  const handleResolve = async (issueId: string, remarkText: string = '') => {
    try {
      const { error } = await supabase
        .from('asset_issues')
        .update({
          status: 'resolved',
          resolved_by: profile?.id,
          resolved_at: new Date().toISOString(),
          remark: remarkText
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
      setResolvingIssue(null);
      setRemark('');
    } catch (error) {
      console.error('Error resolving issue:', error);
    }
  };

  const handleResolveClick = (issue: AssetIssue) => {
    setResolvingIssue(issue);
  };

  const handleResolveWithRemark = () => {
    if (resolvingIssue) {
      handleResolve(resolvingIssue.id, remark);
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

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesLab = filterLab === 'all' || issue.asset?.allocated_lab === filterLab;
    const matchesType = filterType === 'all' || issue.asset?.name_of_supply?.toLowerCase().includes(filterType.toLowerCase());
    
    const issueDate = new Date(issue.reported_at);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const matchesDate = (!fromDate || issueDate >= from) && (!toDate || issueDate <= to);

    return matchesStatus && matchesLab && matchesType && matchesDate;
  });

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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Report Issue</span>
          </button>
          <ExportButton
            data={filteredIssues}
            type="issues"
            disabled={filteredIssues.length === 0}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'list'
              ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Issue List
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'analytics'
              ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Analytics
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          
          {/* Lab Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={filterLab}
              onChange={(e) => setFilterLab(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">All Labs</option>
              {Array.from(new Set(issues.map(issue => issue.asset?.allocated_lab).filter(Boolean))).map(lab => (
                <option key={lab} value={lab}>{lab}</option>
              ))}
            </select>
          </div>
          
          {/* Asset Type Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">All Types</option>
              {Array.from(new Set(issues.map(issue => issue.asset?.name_of_supply).filter(Boolean))).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Date Filters */}
          <div className="flex items-center space-x-2">
            <label htmlFor="fromDate" className="text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">From:</label>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="toDate" className="text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">To:</label>
            <input
              type="date"
              id="toDate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'list' ? (
        <>
          {/* Issues List */}
          <div className="space-y-4">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <AlertTriangle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No issues found</p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
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
                        {issue.status === 'resolved' && issue.remark && (
                          <p className="text-gray-500 dark:text-gray-400 mt-2">
                            <span className="font-medium">Remark:</span> {issue.remark}
                          </p>
                        )}

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
                            onClick={() => handleResolveClick(issue)}
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
        </>
      ) : (
        <IssueAnalyticsDashboard issues={filteredIssues} />
      )}

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

      {/* Issue Resolve Modal */}
      {resolvingIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Resolve Issue</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please provide a remark for resolving this issue:
            </p>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter remark (required)..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-4 h-24 resize-none"
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setResolvingIssue(null);
                  setRemark('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveWithRemark}
                disabled={!remark.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueList;
