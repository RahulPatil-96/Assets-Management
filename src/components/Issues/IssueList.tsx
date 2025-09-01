import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Plus,
  CheckCircle,
  Eye,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, AssetIssue } from '../../lib/supabase';
import IssueForm from './IssueForm';
import IssueDetailsModalWithErrorBoundary from './IssueDetailsModalWithErrorBoundary';
import IssueAnalyticsDashboard from '../Analytics/IssueAnalyticsDashboard';
import ExportButton from '../Export/ExportButton';
import { ListItemSkeleton } from '../Layout/LoadingSkeleton';
import FilterDropdown from '../FilterDropdown';
import DateRangePicker from '../DateRangePicker';
import Button from '../Button';

const IssueListComponent: React.FC<{ searchTerm: string }> = ({ searchTerm: propSearchTerm }) => {
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
  const [costRequired, setCostRequired] = useState<string>('');
  const [labMap, setLabMap] = useState<Map<string, string>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  type AssetIssueWithLabName = AssetIssue & { lab_name?: string };
  const fetchIssues = async (): Promise<{
    issues: AssetIssueWithLabName[];
    totalCount: number;
  }> => {
    // Calculate pagination range
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    // Fetch issues with pagination and labs in parallel
    const [
      { data: issuesData, error: issuesError, count: totalCount },
      { data: labsData, error: labsError },
    ] = await Promise.all([
      supabase
        .from('asset_issues')
        .select(
          `*, asset:assets(name_of_supply, allocated_lab, asset_id), reporter:user_profiles!reported_by(name, role), resolver:user_profiles!resolved_by(name, role)`,
          { count: 'exact' }
        )
        .order('reported_at', { ascending: false })
        .range(from, to),
      supabase.from('labs').select('id, name'),
    ]);

    if (issuesError) throw issuesError;
    if (labsError) throw labsError;
    // Map lab id to name
    const newLabMap = new Map<string, string>();
    (labsData || []).forEach((lab: { id: string; name: string }) => {
      newLabMap.set(lab.id, lab.name);
    });
    setLabMap(newLabMap);
    // Attach lab name to each issue
    const issues = (issuesData || []).map((issue: AssetIssue) => ({
      ...issue,
      lab_name: issue.asset
        ? newLabMap.get(issue.asset.allocated_lab) || issue.asset.allocated_lab
        : undefined,
    }));

    return { issues, totalCount: totalCount || 0 };
  };

  const {
    data: issuesData = { issues: [], totalCount: 0 },
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['issues', currentPage, itemsPerPage],
    queryFn: fetchIssues,
  });

  const issues = issuesData.issues;
  const totalCount = issuesData.totalCount;

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
        payload => {
          // Only refetch if the change is relevant to the current view
          // Check if the changed issue matches current filters
          const changedIssue = payload.new as AssetIssue;
          const matchesCurrentFilters = () => {
            const matchesSearch =
              propSearchTerm === '' ||
              changedIssue.asset?.name_of_supply
                ?.toLowerCase()
                .includes(propSearchTerm.toLowerCase()) ||
              (changedIssue.asset?.asset_id &&
                changedIssue.asset.asset_id
                  .toString()
                  .toLowerCase()
                  .includes(propSearchTerm.toLowerCase()));

            const matchesStatus = filterStatus === 'all' || changedIssue.status === filterStatus;
            const matchesLab =
              filterLab === 'all' || changedIssue.asset?.allocated_lab === filterLab;
            const matchesType =
              filterType === 'all' ||
              changedIssue.asset?.name_of_supply?.toLowerCase().includes(filterType.toLowerCase());

            const issueDate = new Date(changedIssue.reported_at);
            const from = new Date(fromDate);
            const to = new Date(toDate);
            const matchesDate = (!fromDate || issueDate >= from) && (!toDate || issueDate <= to);

            return matchesSearch && matchesStatus && matchesLab && matchesType && matchesDate;
          };

          // Only refetch if the changed issue matches current filters or if it's a delete operation
          if (payload.eventType === 'DELETE' || matchesCurrentFilters()) {
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [refetch, propSearchTerm, filterStatus, filterLab, filterType, fromDate, toDate]);

  const handleResolve = async (
    issueId: string,
    remarkText: string = '',
    costRequiredValue: string = ''
  ) => {
    try {
      const updateData: {
        status: string;
        resolved_by: string | undefined;
        resolved_at: string;
        remark?: string;
        cost_required?: number;
      } = {
        status: 'resolved',
        resolved_by: profile?.id,
        resolved_at: new Date().toISOString(),
      };

      if (remarkText.trim()) {
        updateData.remark = remarkText;
      }

      if (costRequiredValue.trim()) {
        updateData.cost_required = parseFloat(costRequiredValue);
      }

      const { error } = await supabase.from('asset_issues').update(updateData).eq('id', issueId);

      if (error) throw error;

      // Only reset costRequired and handle errors
      setCostRequired('');
    } catch (_error) {
      // console.error('Error resolving issue:', _error);
    }
  };

  const handleResolveClick = (issue: AssetIssue) => {
    setResolvingIssue(issue);
  };

  const handleResolveWithRemark = () => {
    if (resolvingIssue) {
      handleResolve(resolvingIssue.id, remark, costRequired);
    }
  };

  const getStatusColor = (status: string) =>
    status === 'resolved' ? 'text-green-600' : 'text-red-600';

  const getStatusIcon = (status: string) => (status === 'resolved' ? CheckCircle : AlertTriangle);

  const handleViewDetails = (issue: AssetIssue) => {
    setViewingIssue(issue);
  };

  const canResolve = (issue: AssetIssue) =>
    profile?.role === 'Lab Assistant' &&
    issue.status === 'open' &&
    profile.lab_id === issue.asset?.allocated_lab;

  const filteredIssues = React.useMemo(
    () =>
      issues
        .filter(issue => {
          const matchesSearch =
            propSearchTerm === '' ||
            issue.asset?.name_of_supply?.toLowerCase().includes(propSearchTerm.toLowerCase()) ||
            (issue.asset?.asset_id &&
              issue.asset.asset_id.toString().toLowerCase().includes(propSearchTerm.toLowerCase()));
          const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
          const matchesLab = filterLab === 'all' || issue.asset?.allocated_lab === filterLab;
          const matchesType =
            filterType === 'all' ||
            issue.asset?.name_of_supply?.toLowerCase().includes(filterType.toLowerCase());

          const issueDate = new Date(issue.reported_at);
          const from = new Date(fromDate);
          const to = new Date(toDate);
          const matchesDate = (!fromDate || issueDate >= from) && (!toDate || issueDate <= to);

          return matchesSearch && matchesStatus && matchesLab && matchesType && matchesDate;
        })
        .sort((a, b) => {
          // Sort by status: open issues first, then resolved issues
          if (a.status === 'open' && b.status === 'resolved') return -1;
          if (a.status === 'resolved' && b.status === 'open') return 1;

          // If same status, sort by reported date (newest first)
          return new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime();
        }),
    [issues, propSearchTerm, filterStatus, filterLab, filterType, fromDate, toDate]
  );

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6'></div>
          <ListItemSkeleton count={3} className='h-24' />
        </div>
      </div>
    );
  }

  return (
    <div className='p-4 sm:p-6 overflow-x-hidden'>
      <div className='flex flex-col sm:flex-row justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0'>
          {profile?.role === 'Lab Incharge' ? 'Report Issues' : 'Issue Management'}
        </h1>
        <div className='flex items-center space-x-4'>
          <button
            onClick={() => setShowForm(true)}
            className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 flex items-center space-x-2 transition-colors'
          >
            <Plus className='w-4 h-4' />
            <span>Report Issue</span>
          </button>
          <ExportButton
            data={filteredIssues}
            type='issues'
            disabled={filteredIssues.length === 0}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='flex border-b border-gray-200 dark:border-gray-700 mb-6'>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'list'
              ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <AlertTriangle className='w-4 h-4 inline mr-2' />
          <span className='hidden sm:inline'>Issue List</span>
          <span className='sm:hidden'>List</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'analytics'
              ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 className='w-4 h-4 inline mr-2' />
          <span className='hidden sm:inline'>Analytics</span>
          <span className='sm:hidden'>Stats</span>
        </button>
      </div>

      {/* Filters */}
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4'>
        <div className='flex flex-wrap gap-4'>
          <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium'>
            <Filter className='w-4 h-4' />
            <span>Filters:</span>
          </div>
          <FilterDropdown
            label='Status:'
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'open', label: 'Open' },
              { value: 'resolved', label: 'Resolved' },
            ]}
            className='w-auto min-w-[100px]'
          />

          <FilterDropdown
            label='Lab:'
            value={filterLab}
            onChange={setFilterLab}
            options={[
              { value: 'all', label: 'All Labs' },
              ...Array.from(
                new Set(issues.map(issue => issue.asset?.allocated_lab).filter(Boolean))
              ).map(labId => ({
                value: labId as string,
                label: labMap.get(labId as string) || (labId as string),
              })),
            ]}
            className='w-auto min-w-[100px]'
          />

          <FilterDropdown
            label='Type:'
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'all', label: 'All Types' },
              ...Array.from(
                new Set(issues.map(issue => issue.asset?.name_of_supply).filter(Boolean))
              ).map(type => ({
                value: type as string,
                label: type as string,
              })),
            ]}
            className='w-auto min-w-[100px]'
          />

          <DateRangePicker
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            toDate={toDate}
            onToDateChange={setToDate}
            className='w-auto min-w-[200px]'
          />
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'list' ? (
        <>
          {/* Issues List */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
            {filteredIssues.length === 0 ? (
              <div className='text-center py-12'>
                <AlertTriangle className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
                <p className='text-gray-500 dark:text-gray-300'>No issues found</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Sr No
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Asset ID
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Asset
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Issue Description
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Lab
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Status
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Reported By
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Reported At
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((issue, index) => {
                      const StatusIcon = getStatusIcon(issue.status);
                      return (
                        <tr
                          key={issue.id}
                          className='border-b border-gray-200 dark:border-gray-600'
                        >
                          <td className='px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs '>
                            {index + 1 + (currentPage - 1) * itemsPerPage}
                          </td>
                          <td className='px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs '>
                            {issue.asset?.asset_id || 'Pending...'}
                          </td>
                          <td className='px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs '>
                            {issue.asset?.name_of_supply || 'N/A'}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs break-words'>
                            <div className='line-clamp-2'>{issue.issue_description}</div>
                          </td>
                          <td className='px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs '>
                            {issue.lab_name || issue.asset?.allocated_lab || 'N/A'}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm'>
                            <div className='flex items-center space-x-2'>
                              <StatusIcon className={`w-4 h-4 ${getStatusColor(issue.status)}`} />
                              <span className={getStatusColor(issue.status)}>
                                {issue.status === 'resolved' ? 'Resolved' : 'Open'}
                              </span>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100'>
                            {issue.reporter?.name || ''}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                            {new Date(issue.reported_at).toLocaleDateString()}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400'>
                            <div className='flex space-x-2'>
                              <Button
                                onClick={() => handleViewDetails(issue)}
                                variant='view'
                                size='sm'
                                className='p-1'
                                icon={<Eye className='w-5 h-5' />}
                              >
                                <span className='sr-only'>View Details</span>
                              </Button>
                              {canResolve(issue) && (
                                <Button
                                  onClick={() => handleResolveClick(issue)}
                                  variant='success'
                                  size='sm'
                                >
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalCount > itemsPerPage && (
            <div className='flex items-center justify-between mt-6 px-6 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700'>
              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-
                  {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} issues
                </span>
                <select
                  value={itemsPerPage}
                  onChange={e => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className='px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-200'
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className='p-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <ChevronLeft className='w-4 h-4' />
                </button>
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(Math.ceil(totalCount / itemsPerPage), prev + 1))
                  }
                  disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                  className='p-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <ChevronRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <IssueAnalyticsDashboard issues={filteredIssues} labs={Object.fromEntries(labMap)} />
      )}

      {/* Issue Form Modal */}
      {showForm && (
        <IssueForm
          onClose={() => setShowForm(false)}
          onSave={() => {
            refetch();
            setCurrentPage(1);
          }}
        />
      )}

      {viewingIssue && (
        <IssueDetailsModalWithErrorBoundary
          issue={viewingIssue}
          onClose={() => setViewingIssue(null)}
        />
      )}

      {/* Issue Resolve Modal */}
      {resolvingIssue && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
              Resolve Issue
            </h2>

            <div className='space-y-4 mb-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Remark (optional)
                </label>
                <textarea
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  placeholder='Enter remark (optional)...'
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 h-24 resize-none'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Cost Required (optional)
                </label>
                <input
                  type='number'
                  value={costRequired}
                  onChange={e => setCostRequired(e.target.value)}
                  placeholder='Enter cost amount (optional)...'
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3'
                  min='0'
                  step='0.01'
                />
              </div>
            </div>

            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => {
                  setResolvingIssue(null);
                  setRemark('');
                  setCostRequired('');
                }}
                className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg'
              >
                Cancel
              </button>
              <button
                onClick={handleResolveWithRemark}
                className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
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

const IssueList = React.memo(IssueListComponent);
export default IssueList;
