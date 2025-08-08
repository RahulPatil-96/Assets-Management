import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Eye,
  QrCode,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Building,
  User,
  MoreVertical,
  X,
  Save} from 'lucide-react';
import { useAssets } from '../hooks/useAssets';
import { useToast } from '../hooks/useToast';
import type { Asset } from '../types';
import type { BackendAsset } from '../types/backend';

export const AssetRegistry: React.FC = () => {
  const {
    assets,
    isLoading,
    error: assetsError, // Renamed to avoid conflict with local error state
    selectedAssets,
    setSelectedAssets,
    addAsset,
    updateAsset, // Added updateAsset
    deleteAsset, // Added deleteAsset
    searchAssets,
    loadAssets // Added loadAssets to refresh data
  } = useAssets();

  const { success, error, info } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // New state for edit modal
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null); // Changed to Asset type
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all', // Changed from current_status to status to match Asset type
    department: 'all',
    condition: 'all' // Changed from condition_status to condition to match Asset type
  });

  // Initial form data state for adding/editing assets
  const initialFormData: Partial<Asset> = useMemo(() => ({
    status: 'active',
    condition: 'good',
    purchaseCost: 0,
    purchaseDate: new Date(), // Changed to Date object
    serialNumber: '', // Changed from serial_number
    assetTag: '', // Changed from asset_tag
    assignedTo: '', // Changed from assigned_to
    name: '',
    description: '',
    lab: '',
    issue: '',
    category: 'IT Equipment',
    make: '',
    model: '',
    specifications: {},
    photos: [],
    documents: [],
    tags: [],
    notes: '',
    building: '',
    department: '',
    room: '',
    floor: '',
    custodian: '',
    warrantyExpiry: undefined,
    warrantyProvider: '', // Changed from warranty_provider
    vendor: '',
    purchaseOrder: '', // Changed from purchase_order
    barcode: '',
    qrCode: '', // Changed from qr_code
    // Default maintenance schedule for new assets
    maintenanceSchedule: {
      frequency: 'annual',
      intervalDays: 365,
      nextDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isOverdue: false,
      maintenanceType: 'preventive',
      estimatedCost: 100,
      requiredSkills: []
    },
    maintenanceHistory: [],
    transferHistory: [],
    createdBy: 'Current User',
    updatedBy: 'Current User',
    predictedEOL: undefined,
    nextMaintenance: undefined, // Added nextMaintenance
    lastMaintenance: undefined // Added lastMaintenance
  }), []);

  const [formData, setFormData] = useState<Partial<Asset>>(initialFormData);

  // Type guard for category (using Asset['category'] for consistency)
  const validCategories: Asset['category'][] = [
    'IT Equipment', 'Laboratory Equipment', 'Furniture', 'Vehicles', 'Library Resources',
    'Sports Equipment', 'Medical Equipment', 'Audio Visual', 'Security Equipment', 'Maintenance Equipment'
  ];

  // Predefined departments for when there are no existing assets
  const validDepartments = [
    'General', 'Finance', 'HR', 'Legal', 'Procurement', 'Facilities', 'IT', 'Maintenance', 'Security', 'Administration'
  ];

  const getValidCategory = useCallback((category: string): Asset['category'] | undefined => {
    return validCategories.find(c => c === category);
  }, [validCategories]);

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    if (!searchQuery && filters.category === 'all' && filters.status === 'all' && 
        filters.department === 'all' && filters.condition === 'all') {
      return assets;
    }
    
    return assets.filter(asset => {
      const matchesSearch = !searchQuery || 
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.assetTag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.room?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filters.category === 'all' || asset.category === filters.category;
      const matchesStatus = filters.status === 'all' || asset.status === filters.status;
      const matchesDepartment = filters.department === 'all' || asset.department === filters.department;
      const matchesCondition = filters.condition === 'all' || asset.condition === filters.condition;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesDepartment && matchesCondition;
    });
  }, [assets, searchQuery, filters]);

  // Get unique values for filters, with fallback to predefined values when there are no assets
  const categories = useMemo(() => Array.from(new Set(assets.map(asset => asset.category))).filter(Boolean), [assets]);
  const departments = useMemo(() => Array.from(new Set(assets.map(asset => asset.department))).filter(Boolean), [assets]);
  const statuses: Asset['status'][] = ['active', 'maintenance', 'retired', 'disposed', 'missing', 'reserved', 'approved'];
  const conditions: Asset['condition'][] = ['excellent', 'good', 'fair', 'poor', 'needs_repair'];

  // Handle form data changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else if (type === 'date') {
      setFormData(prev => ({ ...prev, [name]: value ? new Date(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      error('Validation Error', 'Please fill in all required fields (Name and Category).');
      return;
    }

    const validCategory = getValidCategory(formData.category);

    if (!validCategory) {
      error('Validation Error', 'Invalid category selected.');
      return;
    }

    try {
      // Ensure all required fields for the Asset type are present, even if empty strings/defaults
      const assetToCreate: Omit<Asset, 'id' | 'assetTag' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        category: validCategory,
        make: formData.make || 'Unknown',
        serialNumber: formData.serialNumber || `SN-${Date.now()}`,
        purchaseDate: formData.purchaseDate || new Date(),
        purchaseCost: formData.purchaseCost || 0,
        room: formData.room || 'N/A',
        status: formData.status || 'active',
        condition: formData.condition || 'good',
        warrantyExpiry: formData.warrantyExpiry,
        maintenanceSchedule: formData.maintenanceSchedule || initialFormData.maintenanceSchedule!,
        maintenanceHistory: formData.maintenanceHistory || [],
        specifications: formData.specifications || {},
        photos: formData.photos || [],
        transferHistory: formData.transferHistory || [],
        tags: formData.tags || [],
        createdBy: formData.createdBy || 'Current User',
        updatedBy: formData.updatedBy || 'Current User',
        predictedEOL: formData.predictedEOL,
        assignedTo: formData.assignedTo || '',
        description: formData.description || '',
        lab: formData.lab || '',
        issue: formData.issue || '',
        building: formData.building || '',
        department: formData.department || '',
        floor: formData.floor || '',
        custodian: formData.custodian || '',
        warrantyProvider: formData.warrantyProvider || '',
        vendor: formData.vendor || '',
        purchaseOrder: formData.purchaseOrder || '',
        barcode: formData.barcode || '',
        qrCode: formData.qrCode || '',
        nextMaintenance: formData.nextMaintenance,
        lastMaintenance: formData.lastMaintenance
      };

    const newAsset = await addAsset(assetToCreate as Omit<FrontendAsset, 'id'>);
    success('Asset Added', `${newAsset.name} has been added to the registry.`);
    setShowAddModal(false);
    setFormData(initialFormData); // Reset form
    } catch (err: any) {
      console.error('Failed to add asset:', err);
      error('Error', err.message || 'Failed to add asset. Please try again.');
    }
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAsset?.id || !formData.name || !formData.category) {
      error('Validation Error', 'Asset ID, Name, and Category are required for update.');
      return;
    }

    const validCategory = getValidCategory(formData.category);
    if (!validCategory) {
      error('Validation Error', 'Invalid category selected.');
      return;
    }

    try {
      // Only send fields that might have changed
      const updates: Partial<Asset> = {
        name: formData.name,
        category: validCategory,
        make: formData.make,
        serialNumber: formData.serialNumber,
        purchaseDate: formData.purchaseDate,
        purchaseCost: formData.purchaseCost,
        room: formData.room,
        status: formData.status,
        condition: formData.condition,
        warrantyExpiry: formData.warrantyExpiry,
        maintenanceSchedule: formData.maintenanceSchedule,
        specifications: formData.specifications,
        tags: formData.tags,
        assignedTo: formData.assignedTo,
        description: formData.description,
        lab: formData.lab,
        issue: formData.issue,
        building: formData.building,
        department: formData.department,
        floor: formData.floor,
        custodian: formData.custodian,
        warrantyProvider: formData.warrantyProvider,
        vendor: formData.vendor,
        purchaseOrder: formData.purchaseOrder,
        barcode: formData.barcode,
        qrCode: formData.qrCode,
        predictedEOL: formData.predictedEOL,
        nextMaintenance: formData.nextMaintenance,
        lastMaintenance: formData.lastMaintenance
      };

    await updateAsset(selectedAsset.id, updates as Partial<FrontendAsset>);
    success('Asset Updated', `${formData.name} has been updated.`);
    setShowEditModal(false);
    setSelectedAsset(null);
    setFormData(initialFormData); // Reset form
    } catch (err: any) {
      console.error('Failed to update asset:', err);
      error('Error', err.message || 'Failed to update asset. Please try again.');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      try {
        await deleteAsset(id);
        success('Asset Deleted', 'Asset has been successfully removed.');
      } catch (err: any) {
        console.error('Failed to delete asset:', err);
        error('Error', err.message || 'Failed to delete asset. Please try again.');
      }
    }
  };

  const handleApproveAsset = (id: string) => {
    // This function needs to be implemented to actually change the asset status to 'approved'
    // For now, it uses the existing error message from the original code.
    error('Error', 'Approve feature is not supported due to status type restrictions.');
    // A proper implementation would involve calling updateAsset with status: 'approved'
    try {
      await updateAsset(id, { status: 'approved' });
      success('Asset Approved', 'Asset status changed to approved.');
    } catch (err: any) {
      error('Error', err.message || 'Failed to approve asset.');
    }
  };

  const openEditModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData(asset); // Populate form with asset data
    setShowEditModal(true);
  };

  const openViewModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowViewModal(true);
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length && filteredAssets.length > 0) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map(asset => asset.id));
    }
  };

  const handleSelectAsset = (id: string) => {
    setSelectedAssets(prev => 
      prev.includes(id) 
        ? prev.filter(assetId => assetId !== id)
        : [...prev, id]
    );
  };

  const getStatusIcon = (status: Asset['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-orange-500" />;
      case 'retired':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'disposed':
        return <X className="w-4 h-4 text-red-500" />;
      case 'missing':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'reserved':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'approved': // Added approved status icon
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'retired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'disposed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'missing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': // Added approved status color
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConditionColor = (condition: Asset['condition']) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'needs_repair':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Display error message if assets failed to load
  if (assetsError) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 text-center text-red-600">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Error Loading Assets</h2>
        <p className="mt-2">{assetsError}</p>
        <button
          onClick={loadAssets}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retry Loading Assets
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Registry</h1>
          <p className="mt-2 text-sm text-gray-700">
            Comprehensive management of all institutional assets with tracking and lifecycle management
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => { setShowAddModal(true); setFormData(initialFormData); }} // Reset form on open
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </button>
          <button
            onClick={() => info('Export Started', 'Asset registry data is being exported...')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assets by name, tag, serial number, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {selectedAssets.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {selectedAssets.length} selected
                  </span>
                  <button
                    onClick={() => info('Bulk Actions', 'Bulk operations will be available soon')}
                    className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    Bulk Actions
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <select
              name="category"
              value={filters.category}
              onChange={(e) => {
                const validCategory = getValidCategory(e.target.value);
                setFilters(prev => ({ ...prev, category: validCategory || 'all' }));
              }}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {(categories.length > 0 ? categories : validCategories).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              name="status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              name="department"
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {(departments.length > 0 ? departments : validDepartments).map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
            <select
              name="condition"
              value={filters.condition}
              onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Conditions</option>
              {conditions.map(condition => (
                <option key={condition} value={condition}>{condition.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-900">
                {filteredAssets.length} assets found
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Total value: {formatCurrency(filteredAssets.reduce((sum, asset) => sum + asset.purchaseCost, 0))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredAssets.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No assets found matching your criteria.
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <div key={asset.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset.id)}
                      onChange={() => handleSelectAsset(asset.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
                        {getStatusIcon(asset.status)}
                        <span className="text-sm text-gray-500">#{asset.assetTag}</span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{asset.make}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4" />
                          <span>{asset.room || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatCurrency(asset.purchaseCost)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(asset.status)}`}>
                          {asset.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getConditionColor(asset.condition)}`}>
                          {asset.condition.replace('_', ' ')} condition
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {asset.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Serial Number:</span>
                          <p className="font-medium text-gray-900">{asset.serialNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Purchase Date:</span>
                          <p className="font-medium text-gray-900">{asset.purchaseDate?.toLocaleDateString() || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Next Maintenance:</span>
                          <p className={`font-medium ${asset.nextMaintenance && asset.nextMaintenance < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                            {asset.nextMaintenance?.toLocaleDateString() || 'Not scheduled'}
                          </p>
                        </div>
                        <div>
                          <button
                            onClick={() => handleApproveAsset(asset.id)}
                            className="mt-2 w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-3 py-1 bg-green-600 text-white text-xs font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                          >
                            Approve
                          </button>
                        </div>
                      </div>

                      {asset.warrantyExpiry && (
                        <div className="mt-3 flex items-center space-x-2 text-sm">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-600">
                            Warranty expires: {asset.warrantyExpiry.toLocaleDateString()}
                            {asset.warrantyExpiry < new Date() && (
                              <span className="text-red-600 font-medium ml-2">EXPIRED</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => openViewModal(asset)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => info('QR Code', `QR code for ${asset.name} will be generated`)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                      title="QR Code"
                    >
                      <QrCode className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => openEditModal(asset)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAsset(asset.id)} // Added delete button
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors" 
                      title="Delete"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                    <button 
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                      title="More"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleAddAsset}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Add New Asset</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Basic Information</h4>
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Asset Name *</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category *</label>
                        <select
                          id="category"
                          name="category"
                          required
                          value={formData.category || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Category</option>
                          {(categories.length > 0 ? categories : validCategories).map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="make" className="block text-sm font-medium text-gray-700">Make</label>
                        <input
                          type="text"
                          id="make"
                          name="make"
                          value={formData.make || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Serial Number</label>
                        <input
                          type="text"
                          id="serialNumber"
                          name="serialNumber"
                          value={formData.serialNumber || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Location and Assignment */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Location & Assignment</h4>
                      <div>
                        <label htmlFor="room" className="block text-sm font-medium text-gray-700">Room</label>
                        <input
                          type="text"
                          id="room"
                          name="room"
                          value={formData.room || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            id="status"
                            name="status"
                            value={formData.status || 'active'}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {statuses.map(status => (
                              <option key={status} value={status}>{status.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condition</label>
                          <select
                            id="condition"
                            name="condition"
                            value={formData.condition || 'good'}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {conditions.map(condition => (
                              <option key={condition} value={condition}>{condition.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                          id="department"
                          name="department"
                          value={formData.department || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Department</option>
                          {(departments.length > 0 ? departments : validDepartments).map(department => (
                            <option key={department} value={department}>{department}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assigned To</label>
                        <input
                          type="text"
                          id="assignedTo"
                          name="assignedTo"
                          value={formData.assignedTo || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Financial Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="purchaseCost" className="block text-sm font-medium text-gray-700">Purchase Cost</label>
                        <input
                          type="number"
                          id="purchaseCost"
                          name="purchaseCost"
                          min="0"
                          step="0.01"
                          value={formData.purchaseCost || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Purchase Date</label>
                        <input
                          type="date"
                          id="purchaseDate"
                          name="purchaseDate"
                          value={formData.purchaseDate ? formData.purchaseDate.toISOString().split('T')[0] : ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">Vendor</label>
                        <input
                          type="text"
                          id="vendor"
                          name="vendor"
                          value={formData.vendor || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Warranty Information */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Warranty Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="warrantyExpiry" className="block text-sm font-medium text-gray-700">Warranty Expiry Date</label>
                        <input
                          type="date"
                          id="warrantyExpiry"
                          name="warrantyExpiry"
                          value={formData.warrantyExpiry ? formData.warrantyExpiry.toISOString().split('T')[0] : ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="warrantyProvider" className="block text-sm font-medium text-gray-700">Warranty Provider</label>
                        <input
                          type="text"
                          id="warrantyProvider"
                          name="warrantyProvider"
                          value={formData.warrantyProvider || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-6">
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags ? formData.tags.join(', ') : ''}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter tags separated by commas"
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-medium text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Add Asset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && selectedAsset && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleUpdateAsset}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Edit Asset: {selectedAsset.name}</h3>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Basic Information</h4>
                      <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Asset Name *</label>
                        <input
                          type="text"
                          id="edit-name"
                          name="name"
                          required
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">Category *</label>
                        <select
                          id="edit-category"
                          name="category"
                          required
                          value={formData.category || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Category</option>
                          {(categories.length > 0 ? categories : validCategories).map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="edit-make" className="block text-sm font-medium text-gray-700">Make</label>
                        <input
                          type="text"
                          id="edit-make"
                          name="make"
                          value={formData.make || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-serialNumber" className="block text-sm font-medium text-gray-700">Serial Number</label>
                        <input
                          type="text"
                          id="edit-serialNumber"
                          name="serialNumber"
                          value={formData.serialNumber || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Location and Assignment */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Location & Assignment</h4>
                      <div>
                        <label htmlFor="edit-room" className="block text-sm font-medium text-gray-700">Room</label>
                        <input
                          type="text"
                          id="edit-room"
                          name="room"
                          value={formData.room || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            id="edit-status"
                            name="status"
                            value={formData.status || 'active'}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {statuses.map(status => (
                              <option key={status} value={status}>{status.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="edit-condition" className="block text-sm font-medium text-gray-700">Condition</label>
                          <select
                            id="edit-condition"
                            name="condition"
                            value={formData.condition || 'good'}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {conditions.map(condition => (
                              <option key={condition} value={condition}>{condition.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="edit-department" className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                          id="edit-department"
                          name="department"
                          value={formData.department || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Department</option>
                          {(departments.length > 0 ? departments : validDepartments).map(department => (
                            <option key={department} value={department}>{department}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="edit-assignedTo" className="block text-sm font-medium text-gray-700">Assigned To</label>
                        <input
                          type="text"
                          id="edit-assignedTo"
                          name="assignedTo"
                          value={formData.assignedTo || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Financial Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="edit-purchaseCost" className="block text-sm font-medium text-gray-700">Purchase Cost</label>
                        <input
                          type="number"
                          id="edit-purchaseCost"
                          name="purchaseCost"
                          min="0"
                          step="0.01"
                          value={formData.purchaseCost || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-purchaseDate" className="block text-sm font-medium text-gray-700">Purchase Date</label>
                        <input
                          type="date"
                          id="edit-purchaseDate"
                          name="purchaseDate"
                          value={formData.purchaseDate ? formData.purchaseDate.toISOString().split('T')[0] : ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-vendor" className="block text-sm font-medium text-gray-700">Vendor</label>
                        <input
                          type="text"
                          id="edit-vendor"
                          name="vendor"
                          value={formData.vendor || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Warranty Information */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Warranty Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="edit-warrantyExpiry" className="block text-sm font-medium text-gray-700">Warranty Expiry Date</label>
                        <input
                          type="date"
                          id="edit-warrantyExpiry"
                          name="warrantyExpiry"
                          value={formData.warrantyExpiry ? formData.warrantyExpiry.toISOString().split('T')[0] : ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-warrantyProvider" className="block text-sm font-medium text-gray-700">Warranty Provider</label>
                        <input
                          type="text"
                          id="edit-warrantyProvider"
                          name="warrantyProvider"
                          value={formData.warrantyProvider || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-6">
                    <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                    <input
                      type="text"
                      id="edit-tags"
                      name="tags"
                      value={formData.tags ? formData.tags.join(', ') : ''}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter tags separated by commas"
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-medium text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Asset Modal */}
      {showViewModal && selectedAsset && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowViewModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedAsset.name}</h3>
                      <p className="text-sm text-gray-600">Asset Tag: {selectedAsset.assetTag || 'N/A'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Basic Information */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Basic Information</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{selectedAsset.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Make/Model:</span>
                        <span className="font-medium">{selectedAsset.make || 'N/A'} {selectedAsset.model || ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Serial Number:</span>
                        <span className="font-medium">{selectedAsset.serialNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAsset.status)}`}>
                          {selectedAsset.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Condition:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(selectedAsset.condition)}`}>
                          {selectedAsset.condition.replace('_', ' ')}
                        </span>
                      </div>
                      {selectedAsset.description && (
                        <div className="flex flex-col">
                          <span className="text-gray-600">Description:</span>
                          <span className="font-medium text-gray-900">{selectedAsset.description}</span>
                        </div>
                      )}
                      {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                        <div className="flex flex-col">
                          <span className="text-gray-600">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedAsset.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Location & Assignment */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Location & Assignment</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room:</span>
                        <span className="font-medium">{selectedAsset.room || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Building:</span>
                        <span className="font-medium">{selectedAsset.building || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Floor:</span>
                        <span className="font-medium">{selectedAsset.floor || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium">{selectedAsset.department || 'N/A'}</span>
                      </div>
                      {selectedAsset.assignedTo && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned To:</span>
                          <span className="font-medium">{selectedAsset.assignedTo}</span>
                        </div>
                      )}
                      {selectedAsset.custodian && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Custodian:</span>
                          <span className="font-medium">{selectedAsset.custodian}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Financial Information</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchase Cost:</span>
                        <span className="font-medium">{formatCurrency(selectedAsset.purchaseCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchase Date:</span>
                        <span className="font-medium">{selectedAsset.purchaseDate?.toLocaleDateString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vendor:</span>
                        <span className="font-medium">{selectedAsset.vendor || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchase Order:</span>
                        <span className="font-medium">{selectedAsset.purchaseOrder || 'N/A'}</span>
                      </div>
                      {selectedAsset.warrantyExpiry && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Warranty Expires:</span>
                          <span className={`font-medium ${selectedAsset.warrantyExpiry < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                            {selectedAsset.warrantyExpiry.toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedAsset.warrantyProvider && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Warranty Provider:</span>
                          <span className="font-medium">{selectedAsset.warrantyProvider}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                {selectedAsset.specifications && Object.keys(selectedAsset.specifications).length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-900 mb-4">Technical Specifications</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(selectedAsset.specifications).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-gray-600 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <p className="font-medium text-gray-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Maintenance Information */}
                {selectedAsset.maintenanceSchedule && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-900 mb-4">Maintenance Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Schedule</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Frequency:</span>
                            <span className="font-medium capitalize">{selectedAsset.maintenanceSchedule.frequency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Next Due:</span>
                            <span className={`font-medium ${selectedAsset.nextMaintenance && selectedAsset.nextMaintenance < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                              {selectedAsset.nextMaintenance?.toLocaleDateString() || 'Not scheduled'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium capitalize">{selectedAsset.maintenanceSchedule.maintenanceType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estimated Cost:</span>
                            <span className="font-medium">{formatCurrency(selectedAsset.maintenanceSchedule.estimatedCost)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">History</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Performed:</span>
                            <span className="font-medium">
                              {selectedAsset.lastMaintenance?.toLocaleDateString() || 'Never'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Records:</span>
                            <span className="font-medium">{selectedAsset.maintenanceHistory.length}</span>
                          </div>
                          {selectedAsset.issue && (
                            <div className="flex flex-col">
                              <span className="text-gray-600">Last Reported Issue:</span>
                              <span className="font-medium text-gray-900">{selectedAsset.issue}</span>
                            </div>
                          )}
                          {selectedAsset.lab && (
                            <div className="flex flex-col">
                              <span className="text-gray-600">Lab/Location of Issue:</span>
                              <span className="font-medium text-gray-900">{selectedAsset.lab}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
