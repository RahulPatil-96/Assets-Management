import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Plus,
  CheckCircle,
  Eye,
  BarChart3,
  Filter,
  Tag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
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
  const [filterConsumable, setFilterConsumable] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewingIssue, setViewingIssue] = useState<AssetIssue | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [resolvingIssue, setResolvingIssue] = useState<AssetIssue | null>(null);
  const [raisingTicket, setRaisingTicket] = useState<AssetIssue | null>(null);
  const [remark, setRemark] = useState<string>('');
  const [costRequired, setCostRequired] = useState<string>('');
  const [ticketRemark, setTicketRemark] = useState<string>('');
  const [labMap, setLabMap] = useState<Map<string, string>>(new Map());


  type AssetIssueWithLabName = AssetIssue & { lab_name?: string };

  const fetchIssues = async (): Promise<{ issues: AssetIssueWithLabName[]; totalCount: number }> => {
    const [
      { data: issuesData, error: issuesError },
      { data: labsData, error: labsError },
    ] = await Promise.all([
      supabase
        .from('asset_issues')
        .select(
          `*, asset:assets(name_of_supply, allocated_lab, asset_id), reporter:user_profiles!reported_by(name, role), resolver:user_profiles!resolved_by(name, role)`
        )
        .order('reported_at', { ascending: false }),
      supabase.from('labs').select('id, name'),
    ]);

    if (issuesError) throw issuesError;
    if (labsError) throw labsError;

    const newLabMap = new Map<string, string>();
    (labsData || []).forEach((lab: { id: string; name: string }) => {
      newLabMap.set(lab.id, lab.name);
    });
    setLabMap(newLabMap);

    const issues = (issuesData || []).map((issue: AssetIssue) => ({
      ...issue,
      lab_name: issue.asset
        ? newLabMap.get(issue.asset.allocated_lab) || issue.asset.allocated_lab
        : undefined,
    }));

    return { issues, totalCount: issuesData?.length || 0 };
  };

  const {
    data: issuesData = { issues: [], totalCount: 0 },
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['issues'],
    queryFn: fetchIssues,
  });

  const issues = issuesData.issues;

  useEffect(() => {
    const subscription = supabase
      .channel('issues-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'asset_issues' },
        payload => {
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

          if (payload.eventType === 'DELETE' || matchesCurrentFilters()) {
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [refetch, propSearchTerm, filterStatus, filterLab, filterType, filterConsumable, fromDate, toDate]);

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

      if (remarkText.trim()) updateData.remark = remarkText;
      if (costRequiredValue.trim()) updateData.cost_required = parseFloat(costRequiredValue);

      const { error } = await supabase.from('asset_issues').update(updateData).eq('id', issueId);

      if (error) {
        toast.error(`Error resolving issue: ${error.message}`);
        return;
      }

      toast.success('Issue resolved successfully!');
      setCostRequired('');
      setResolvingIssue(null);
      refetch();
    } catch (err) {
      console.error('Unexpected error while resolving issue:', err);
      toast.error('Unexpected error. Please try again.');
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

  const handleRaiseTicket = async (issueId: string, ticketRemarkText: string = '') => {
    try {
      const updateData: {
        status: string;
        remark?: string;
        updated_at: string;
      } = {
        status: 'ticket_raised',
        updated_at: new Date().toISOString(),
      };

      if (ticketRemarkText.trim()) updateData.remark = ticketRemarkText;

      const { error } = await supabase.from('asset_issues').update(updateData).eq('id', issueId);

      if (error) {
        toast.error(`Error raising ticket: ${error.message}`);
        return;
      }

      toast.success('Ticket raised successfully!');
      setTicketRemark('');
      setRaisingTicket(null);
      refetch();
    } catch (err) {
      console.error('Unexpected error while raising ticket:', err);
      toast.error('Unexpected error. Please try again.');
    }
  };

  const handleRaiseTicketClick = (issue: AssetIssue) => {
    setRaisingTicket(issue);
  };

  const handleRaiseTicketWithRemark = () => {
    if (raisingTicket) {
      handleRaiseTicket(raisingTicket.id, ticketRemark);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600';
      case 'ticket_raised':
        return 'text-blue-600';
      default:
        return 'text-red-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return CheckCircle;
      case 'ticket_raised':
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  const handleViewDetails = (issue: AssetIssue) => {
    setViewingIssue(issue);
  };

  const canResolve = (issue: AssetIssue) =>
    profile?.role === 'Lab Assistant' &&
    (issue.status === 'open' || issue.status === 'ticket_raised') &&
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

          const matchesConsumable =
            filterConsumable === 'all' ||
            (filterConsumable === 'consumable' && issue.asset?.is_consumable) ||
            (filterConsumable === 'non-consumable' && !issue.asset?.is_consumable);

          const issueDate = new Date(issue.reported_at);
          const from = new Date(fromDate);
          const to = new Date(toDate);
          const matchesDate = (!fromDate || issueDate >= from) && (!toDate || issueDate <= to);

          return matchesSearch && matchesStatus && matchesLab && matchesType && matchesConsumable && matchesDate;
        })
        .sort((a, b) => {
          if (a.status === 'open' && b.status === 'resolved') return -1;
          if (a.status === 'resolved' && b.status === 'open') return 1;
          return new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime();
        }),
    [issues, propSearchTerm, filterStatus, filterLab, filterType, filterConsumable, fromDate, toDate]
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
    <div className='p-4 sm:p-6'>
      {/* Header */}
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

      {/* Tabs */}
      <div className='flex border-b border-gray-200 dark:border-gray-700 mb-6'>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'list'
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
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'analytics'
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
        <div className='flex gap-4 overflow-x-auto'>
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
              { value: 'ticket_raised', label: 'Ticket Raised' },
            ]}
            className='w-full sm:w-auto min-w-[100px]'
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
            className='w-full sm:w-auto min-w-[100px]'
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
            className='w-full sm:w-auto min-w-[100px]'
          />
          <FilterDropdown
            label='Consumable:'
            value={filterConsumable}
            onChange={setFilterConsumable}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'consumable', label: 'Consumable' },
              { value: 'non-consumable', label: 'Non-Consumable' },
            ]}
            className='w-full sm:w-auto min-w-[150px]'
          />
          <DateRangePicker
            fromDate={fromDate}
            onFromDateChange={setFromDate}
            toDate={toDate}
            onToDateChange={setToDate}
            className='w-full sm:w-auto min-w-[200px]'
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' ? (
        <>
          {/* Table */}
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-h-[calc(100vh-200px)] overflow-y-auto'>
            {filteredIssues.length === 0 ? (
              <div className='text-center py-12'>
                <AlertTriangle className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
                <p className='text-gray-500 dark:text-gray-300'>No issues found</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[800px]'>
                  <thead className='bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600'>
                    <tr>
                      <th className='px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Sr No
                      </th>
                      <th className='px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Asset ID
                      </th>
                      <th className='px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Asset
                      </th>
                      <th className='px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Issue Description
                      </th>
                      <th className='px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Lab
                      </th>
                      <th className='px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Status
                      </th>
                      <th className='px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Reported By
                      </th>
                      <th className='px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                        Reported At
                      </th>
                      <th className='px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
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
                          <td className='px-2 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                            {index + 1}
                          </td>
                          <td className='px-2 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                            {issue.asset?.asset_id || 'Pending...'}
                          </td>
                          <td className='px-2 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                            {issue.asset?.name_of_supply || 'N/A'}
                          </td>
                          <td className='px-2 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100'>
                            <div className='line-clamp-2'>{issue.issue_description}</div>
                          </td>
                          <td className='px-2 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100 truncate'>
                            {issue.lab_name || 'N/A'}
                          </td>
                          <td className='px-2 sm:px-6 py-4 text-sm font-medium flex items-center gap-2'>
                            <StatusIcon className={`w-4 h-4 ${getStatusColor(issue.status)}`} />
                            <span className={getStatusColor(issue.status)}>
                              {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                            </span>
                          </td>
                          <td className='px-2 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100 truncate'>
                            {issue.reporter?.name || 'N/A'}
                          </td>
                          <td className='px-2 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100'>
                            {new Date(issue.reported_at).toLocaleString()}
                          </td>
                          <td className='px-2 sm:px-6 py-4 text-sm font-medium space-x-2'>
                            <Button onClick={() => handleViewDetails(issue)} variant='view' size='sm'>
                              <Eye></Eye>
                            </Button>

                            {canResolve(issue) && (
                              <Button onClick={() => handleResolveClick(issue)} variant='approve' size='sm'><CheckCircle></CheckCircle></Button>
                            )}

                            {profile?.role === 'Lab Assistant' && issue.status === 'open' && profile.lab_id === issue.asset?.allocated_lab && (
                              <Button onClick={() => handleRaiseTicketClick(issue)} variant='edit' size='sm'>
                                <Tag></Tag>
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <IssueAnalyticsDashboard issues={filteredIssues} labs={Object.fromEntries(labMap)} />
      )}

      {/* Modals */}
      {showForm && <IssueForm onClose={() => setShowForm(false)} onSave={() => {
        refetch(); // Refetch issues after successful submission
        setShowForm(false);
      }} />}
      {viewingIssue && (
        <IssueDetailsModalWithErrorBoundary issue={viewingIssue} onClose={() => setViewingIssue(null)} />
      )}
      {resolvingIssue && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-4 sm:p-6'>
            <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
              Resolve Issue
            </h3>
            <textarea
              className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-4 dark:bg-gray-700 dark:text-gray-100'
              placeholder='Add a remark (optional)'
              value={remark}
              onChange={e => setRemark(e.target.value)}
            />
            <input
              type='number'
              className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-4 dark:bg-gray-700 dark:text-gray-100'
              placeholder='Cost required (optional)'
              value={costRequired}
              onChange={e => setCostRequired(e.target.value)}
            />
            <div className='flex justify-end space-x-2'>
              <button
                onClick={() => setResolvingIssue(null)}
                className='px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
              >
                Cancel
              </button>
              <button
                onClick={handleResolveWithRemark}
                className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
      {raisingTicket && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-4 sm:p-6'>
            <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>
              Raise Ticket
            </h3>
            <textarea
              className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded mb-4 dark:bg-gray-700 dark:text-gray-100'
              placeholder='Add a remark (optional)'
              value={ticketRemark}
              onChange={e => setTicketRemark(e.target.value)}
            />
            <div className='flex justify-end space-x-2'>
              <button
                onClick={() => setRaisingTicket(null)}
                className='px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
              >
                Cancel
              </button>
              <button
                onClick={handleRaiseTicketWithRemark}
                className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
              >
                Raise Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueListComponent;
