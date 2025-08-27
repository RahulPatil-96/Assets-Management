import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Filter, Plus, Edit, Trash2, CheckCircle, Eye, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Asset } from '../../lib/supabase';
import { NotificationService } from '../../lib/notificationService';
import AssetForm from './AssetForm';
import AssetDetailsModal from './AssetDetailsModal';
import AssetAnalyticsDashboard from '../Analytics/AssetAnalyticsDashboard';
import ExportButton from '../Export/ExportButton';

const AssetList: React.FC<{ searchTerm: string }> = ({ searchTerm }) => {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const { profile } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLab, setFilterLab] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

const fetchAssets = async (): Promise<Asset[]> => {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        creator:created_by(name, role),
        approver:approved_by(name, role),
        approver_lab_incharge:approved_by_lab_incharge(name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const { data: assets = [], isLoading, refetch } = useQuery({
    queryKey: ['assets'],
    queryFn: fetchAssets
  });

  useEffect(() => {
    // Subscribe to real-time changes in the assets table
    const subscription = supabase
      .channel('assets-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets',
        },
        () => {
          // Refetch data on any change to keep the UI in sync
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [refetch]);

  const handleApprove = async (assetId: string, asset: Asset) => {
    try {
      const isHOD = profile?.role === 'HOD';
      const isLabIncharge = profile?.role === 'Lab Incharge';
      
      let updateData: any = {};
      
      if (isHOD) {
        updateData = {
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
        };
        
        // If lab incharge has already approved, mark as fully approved
        if (asset.approved_by_lab_incharge) {
          updateData.approved = true;
        }
      } else if (isLabIncharge) {
        updateData = {
          approved_by_lab_incharge: profile?.id,
          approved_at_lab_incharge: new Date().toISOString(),
        };
        
        // If HOD has already approved, mark as fully approved
        if (asset.approved_by) {
          updateData.approved = true;
        }
      }

      const { error } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', assetId);

      if (error) throw error;

      // Create notification for all users about the approval
      if (profile?.id) {
        const approvalType = isHOD ? 'HOD' : 'Lab Incharge';
        await NotificationService.createNotificationForAllUsers(
          profile.id,
          'approve',
          'asset',
          assetId,
          `Asset ${approvalType} Approved`
        );
      }

      refetch();
    } catch (error) {
      console.error('Error approving asset:', error);
    }
  };


  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      // Create notification for all users about the deletion
      if (profile?.id) {
        await NotificationService.createNotificationForAllUsers(
          profile.id,
          'delete',
          'asset',
          assetId,
          'Asset Deleted'
        );
      }

      refetch();
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const handleViewDetails = (asset: Asset) => {
    setViewingAsset(asset);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name_of_supply.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.allocated_lab.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'approved' && asset.approved) ||
                         (filterStatus === 'pending' && !asset.approved);
    
    const matchesLab = filterLab === 'all' || asset.allocated_lab === filterLab;
    
    const matchesType = filterType === 'all' || asset.asset_type === filterType;
    
    const assetDate = new Date(asset.date);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const matchesDate = (!fromDate || assetDate >= from) && (!toDate || assetDate <= to);

    return matchesSearch && matchesStatus && matchesLab && matchesType && matchesDate;
  });

  const canEdit = (asset: Asset) => {
    return profile?.role === 'Lab Assistant' && asset.created_by === profile?.id;
  };

  const canApprove = (asset: Asset) => {
    const isHOD = profile?.role === 'HOD';
    const isLabIncharge = profile?.role === 'Lab Incharge';
    
    if (isHOD) {
      return !asset.approved_by && !asset.approved;
    } else if (isLabIncharge) {
      return !asset.approved_by_lab_incharge && !asset.approved;
    }
    
    return false;
  };

  const canDelete = (asset: Asset) => {
    return profile?.role === 'Lab Assistant' && asset.created_by === profile?.id && !asset.approved;
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 sm:w-1/4 mb-4 sm:mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">Asset Management</h1>
        <div className="flex items-center space-x-4">
          {profile?.role === 'Lab Assistant' && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Asset</span>
            </button>
          )}
          <ExportButton
            data={filteredAssets}
            type="assets"
            disabled={filteredAssets.length === 0}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'list'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          <span className="hidden sm:inline">Asset List</span>
          <span className="sm:hidden">List</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'analytics'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          <span className="hidden sm:inline">Analytics</span>
          <span className="sm:hidden">Stats</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filterLab}
              onChange={(e) => setFilterLab(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">All Labs</option>
              {Array.from(new Set(assets.map(asset => asset.allocated_lab))).map(lab => (
                <option key={lab} value={lab}>{lab}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="all">All Types</option>
              <option value="cpu">CPU</option>
              <option value="printer">Printer</option>
              <option value="network">Network Equipment</option>
              <option value="peripheral">Peripheral</option>
              <option value="microcontroller">Microcontroller</option>
              <option value="monitor">Monitor</option>
              <option value="mouse">Mouse</option>
              <option value="keyboard">Keyboard</option>
              <option value="scanner">Scanner</option>
              <option value="projector">Projector</option>
              <option value="laptop">Laptop</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="fromDate" className="text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">From:</label>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="toDate" className="text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">To:</label>
            <input
              type="date"
              id="toDate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'list' ? (
        <>
          {/* Assets List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-300">No assets found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Asset ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map(asset => (
                      <tr key={asset.id} className="border-b border-gray-200 dark:border-gray-600">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {asset.asset_id || 'Pending...'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{asset.name_of_supply}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>Lab: {asset.allocated_lab}</div>
                        <div>Type: {asset.asset_type}</div>
                        <div>
                          Status: {asset.approved ? 'Fully Approved' : 'Pending Approval'}
                        </div>
                        {asset.approved_by && (
                          <div>HOD Approved: {asset.approver?.name || ''}</div>
                        )}
                        {asset.approved_by_lab_incharge && (
                          <div>Lab Incharge Approved: {asset.approver_lab_incharge?.name || ''}</div>
                        )}
                        {asset.created_by && !asset.creator?.name && (
                          <div>Created by: </div>
                        )}
                        {asset.created_by && asset.creator?.name && (
                          <div>Created by: {asset.creator.name}</div>
                        )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(asset)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {canEdit(asset) && (
                              <button
                                onClick={() => {setEditingAsset(asset); setShowForm(true);}}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                title="Edit Asset"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                            )}
                            {canApprove(asset) && (
                              <button
                                onClick={() => handleApprove(asset.id, asset)}
                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                title="Approve Asset"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                            {canDelete(asset) && (
                              <button
                                onClick={() => handleDelete(asset.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                title="Delete Asset"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <AssetAnalyticsDashboard assets={filteredAssets} />
      )}

      {/* Asset Form Modal */}
      {showForm && (
        <AssetForm
          asset={editingAsset}
          onClose={() => {
            setShowForm(false);
            setEditingAsset(null);
          }}
          onSave={fetchAssets}
        />
      )}

      {viewingAsset && (
        <AssetDetailsModal
          asset={viewingAsset}
          onClose={() => setViewingAsset(null)}
        />
      )}
    </div>
  );
};

export default AssetList;
