import React, { useState, useMemo } from 'react';
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
import { Asset } from '../types';

export const AssetRegistry: React.FC = () => {
  const {
    assets,
    isLoading,
    selectedAssets,
    setSelectedAssets,
    addAsset,
    searchAssets,
    updateAsset
  } = useAssets();

  const { success, error, info } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    department: 'all',
    condition: 'all'
  });

  // Type guard for category
  const validCategories: Asset['category'][] = [
    'IT Equipment', 'Laboratory Equipment', 'Furniture', 'Vehicles', 'Library Resources',
    'Sports Equipment', 'Medical Equipment', 'Audio Visual', 'Security Equipment', 'Maintenance Equipment'
  ];

  const getValidCategory = (category: string): Asset['category'] | undefined => {
    return validCategories.find(c => c === category);
  };
  const [formData, setFormData] = useState<Partial<Asset>>({});

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    return searchAssets(searchQuery, {
      category: filters.category !== 'all' ? filters.category : undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      department: filters.department !== 'all' ? filters.department : undefined,
      condition: filters.condition !== 'all' ? filters.condition : undefined
    });
  }, [searchAssets, searchQuery, filters]);

  // Get unique values for filters
  const categories = Array.from(new Set(assets.map(asset => asset.category)));
  const departments = Array.from(new Set(assets.map(asset => asset.department)));
  const statuses = ['active', 'maintenance', 'retired', 'disposed', 'missing', 'reserved'];
  const conditions = ['excellent', 'good', 'fair', 'poor', 'needs_repair'];

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.department || !formData.assetTag) {
      error('Validation Error', 'Please fill in all required fields');
      return;
    }

    const validCategory = getValidCategory(formData.category);

    if (!validCategory) {
      error('Validation Error', 'Invalid category selected');
      return;
    }

    try {
      const newAsset = addAsset({
        name: formData.name!,
        category: validCategory,
        subCategory: formData.subCategory || 'General',
        make: formData.make || 'Unknown',
        model: formData.model || 'Unknown',
        serialNumber: formData.serialNumber || `SN${Date.now()}`,
        purchaseDate: formData.purchaseDate || new Date(),
        purchaseCost: formData.purchaseCost || 0,
        currentValue: formData.currentValue || formData.purchaseCost || 0,
        depreciationRate: formData.depreciationRate || 0.1,
        salvageValue: formData.salvageValue || 0,
        building: formData.building || 'Main Building',
        room: formData.room || '100',
        department: formData.department!,
        custodian: formData.custodian || 'Unassigned',
        status: formData.status as Asset['status'] || 'active',
        condition: formData.condition as Asset['condition'] || 'good',
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
        specifications: formData.specifications || {},
        documents: [],
        photos: [],
        transferHistory: [],
        expectedLifespan: formData.expectedLifespan || 10,
        notes: formData.notes,
        tags: formData.tags || [],
        createdBy: 'Current User',
        updatedBy: 'Current User',
        location: formData.location || `${formData.building || 'Main Building'} - ${formData.room || '100'}`,
        utilizationScore: formData.utilizationScore || 0,
        predictedEOL: formData.predictedEOL
      });

      success('Asset Added', `${newAsset.name} has been added to the registry`);
      setShowAddModal(false);
      setFormData({});
    } catch (err) {
      error('Error', 'Failed to add asset');
    }
  };

  const handleApproveAsset = (id: string) => {
    error('Error', 'Approve feature is not supported due to status type restrictions.');
  };


  const openEditModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData(asset);
  };

  const openViewModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowViewModal(true);
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
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
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-700" />;
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
      case 'approved':
        return 'bg-green-200 text-green-900 border-green-300';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </button>
          <button
            onClick={() => success('Export Started', 'Asset registry data is being exported...')}
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
  value={filters.category}
  onChange={(e) => {
    const validCategory = getValidCategory(e.target.value);
    setFilters({ ...filters, category: validCategory || 'all' });
  }}
  className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
>
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
            <select
              value={filters.condition}
              onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
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
              Total value: {formatCurrency(filteredAssets.reduce((sum, asset) => sum + asset.currentValue, 0))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredAssets.map((asset) => (
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
                        <span className="font-medium">{asset.make} {asset.model}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Building className="w-4 h-4" />
                        <span>{asset.building} - {asset.room}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{asset.department}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatCurrency(asset.currentValue)}</span>
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
                        <p className="font-medium text-gray-900">{asset.serialNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Purchase Date:</span>
                        <p className="font-medium text-gray-900">{asset.purchaseDate.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Custodian:</span>
                        <p className="font-medium text-gray-900">{asset.custodian}</p>
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
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                    title="More"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
                    <label className="block text-sm font-medium text-gray-700">Asset Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Asset Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.assetTag || ''}
                      onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category *</label>
<select
  required
  value={formData.category || ''}
  onChange={(e) => {
    const validCategory = getValidCategory(e.target.value);
    setFormData({ ...formData, category: validCategory });
  }}
  className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
>
                          <option value="">Select Category</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Make</label>
                          <input
                            type="text"
                            value={formData.make || ''}
                            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Model</label>
                          <input
                            type="text"
                            value={formData.model || ''}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                        <input
                          type="text"
                          value={formData.serialNumber || ''}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Location and Assignment */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Location & Assignment</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department *</label>
                        <select
                          required
                          value={formData.department || ''}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Department</option>
                          {departments.map(department => (
                            <option key={department} value={department}>{department}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Building</label>
                          <input
                            type="text"
                            value={formData.building || ''}
                            onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Room</label>
                          <input
                            type="text"
                            value={formData.room || ''}
                            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Custodian</label>
                        <input
                          type="text"
                          value={formData.custodian || ''}
                          onChange={(e) => setFormData({ ...formData, custodian: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            value={formData.status || 'active'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as Asset['status'] })}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {statuses.map(status => (
                              <option key={status} value={status}>{status.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Condition</label>
                          <select
                            value={formData.condition || 'good'}
                            onChange={(e) => setFormData({ ...formData, condition: e.target.value as Asset['condition'] })}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {conditions.map(condition => (
                              <option key={condition} value={condition}>{condition.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Financial Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Purchase Cost</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.purchaseCost || ''}
                          onChange={(e) => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) || 0 })}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Value</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.currentValue || ''}
                          onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                        <input
                          type="date"
                          value={formData.purchaseDate?.toISOString().split('T')[0] || ''}
                          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value ? new Date(e.target.value) : undefined })}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes about this asset..."
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
                      <p className="text-sm text-gray-600">Asset Tag: {selectedAsset.assetTag}</p>
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
                        <span className="font-medium">{selectedAsset.make} {selectedAsset.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Serial Number:</span>
                        <span className="font-medium">{selectedAsset.serialNumber}</span>
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
                    </div>
                  </div>
                  
                  {/* Location & Assignment */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Location & Assignment</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium">{selectedAsset.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Building:</span>
                        <span className="font-medium">{selectedAsset.building}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room:</span>
                        <span className="font-medium">{selectedAsset.room}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Custodian:</span>
                        <span className="font-medium">{selectedAsset.custodian}</span>
                      </div>
                      {selectedAsset.assignedTo && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned To:</span>
                          <span className="font-medium">{selectedAsset.assignedTo}</span>
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
                        <span className="text-gray-600">Current Value:</span>
                        <span className="font-medium">{formatCurrency(selectedAsset.currentValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purchase Date:</span>
                        <span className="font-medium">{selectedAsset.purchaseDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Depreciation:</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(selectedAsset.purchaseCost - selectedAsset.currentValue)}
                        </span>
                      </div>
                      {selectedAsset.warrantyExpiry && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Warranty Expires:</span>
                          <span className={`font-medium ${selectedAsset.warrantyExpiry < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                            {selectedAsset.warrantyExpiry.toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                {Object.keys(selectedAsset.specifications).length > 0 && (
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
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Cost:</span>
                          <span className="font-medium">{formatCurrency(selectedAsset.maintenanceSchedule.estimatedCost)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedAsset.notes && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-900 mb-4">Notes</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-gray-700">{selectedAsset.notes}</p>
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