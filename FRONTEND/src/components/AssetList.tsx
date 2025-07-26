import React, { useState } from 'react';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  Wrench, 
  AlertTriangle,
  CheckCircle,
  Clock,
  QrCode,
  Edit,
  MoreVertical,
  Filter,
  Activity
} from 'lucide-react';
import { Asset } from '../types';
import { useAssets } from '../hooks/useAssets';

export const AssetList: React.FC = () => {
  const { assets, isLoading } = useAssets();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const getStatusIcon = (status: Asset['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-orange-500" />;
      case 'retired':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'disposed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
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

  const isMaintenanceOverdue = (asset: Asset) => {
    return asset.nextMaintenance && asset.nextMaintenance < new Date();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Asset Management</h2>
        <p className="text-gray-600">Track and manage all organizational assets with predictive maintenance</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              
              {showFilters && (
                <div className="flex items-center space-x-3">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">All Categories</option>
                    <option value="it-equipment">IT Equipment</option>
                    <option value="facility-equipment">Facility Equipment</option>
                    <option value="vehicles">Vehicles</option>
                    <option value="furniture">Furniture</option>
                  </select>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">All Departments</option>
                    <option value="marketing">Marketing</option>
                    <option value="facilities">Facilities</option>
                    <option value="it">IT</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {assets.length} assets • Total Value: {formatCurrency(assets.reduce((sum, asset) => sum + asset.currentValue, 0))}
              </span>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Add Asset
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {assets.map((asset) => (
            <div key={asset.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
                      {getStatusIcon(asset.status)}
                      <span className="text-sm text-gray-500">#{asset.assetTag}</span>
                      {isMaintenanceOverdue(asset) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 animate-pulse">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Maintenance Overdue
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{asset.make} {asset.model}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{asset.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{asset.assignedTo || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatCurrency(asset.currentValue)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getConditionColor(asset.condition)}`}>
                        {asset.condition} condition
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {asset.category}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {asset.department}
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
                        <span className="text-gray-600">Next Maintenance:</span>
                        <p className={`font-medium ${isMaintenanceOverdue(asset) ? 'text-red-600' : 'text-gray-900'}`}>
                          {asset.nextMaintenance?.toLocaleDateString() || 'Not scheduled'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Utilization:</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                              style={{ width: `${asset.utilizationScore}%` }}
                            ></div>
                          </div>
                          <span className="font-medium text-gray-900">{asset.utilizationScore}%</span>
                        </div>
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
                    onClick={() => setSelectedAsset(asset)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Activity className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="QR Code">
                    <QrCode className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Schedule Maintenance">
                    <Wrench className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="More">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedAsset.name}</h3>
                    <p className="text-sm text-gray-600">Asset Tag: {selectedAsset.assetTag}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Asset Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Make/Model:</span>
                      <span className="font-medium">{selectedAsset.make} {selectedAsset.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Serial Number:</span>
                      <span className="font-medium">{selectedAsset.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{selectedAsset.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAsset.status)}`}>
                        {selectedAsset.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Condition:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(selectedAsset.condition)}`}>
                        {selectedAsset.condition}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Financial Information</h4>
                  <div className="space-y-2 text-sm">
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Predicted EOL:</span>
                      <span className="font-medium">{selectedAsset.predictedEOL?.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Assignment & Location</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{selectedAsset.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned To:</span>
                      <span className="font-medium">{selectedAsset.assignedTo || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedAsset.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilization:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${selectedAsset.utilizationScore}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{selectedAsset.utilizationScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Technical Specifications</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {Object.entries(selectedAsset.specifications).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <p className="font-medium text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Maintenance Schedule</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frequency:</span>
                        <span className="font-medium capitalize">{selectedAsset.maintenanceSchedule.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Performed:</span>
                        <span className="font-medium">
                          {selectedAsset.lastMaintenance?.toLocaleDateString() || 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Due:</span>
                        <span className={`font-medium ${isMaintenanceOverdue(selectedAsset) ? 'text-red-600' : 'text-gray-900'}`}>
                          {selectedAsset.nextMaintenance?.toLocaleDateString() || 'Not scheduled'}
                        </span>
                      </div>
                      {isMaintenanceOverdue(selectedAsset) && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Maintenance Overdue</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Warranty Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Warranty Expires:</span>
                        <span className={`font-medium ${selectedAsset.warrantyExpiry && selectedAsset.warrantyExpiry < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                          {selectedAsset.warrantyExpiry?.toLocaleDateString() || 'No warranty'}
                        </span>
                      </div>
                      {selectedAsset.warrantyExpiry && selectedAsset.warrantyExpiry < new Date() && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Warranty Expired</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Maintenance History</h4>
                <div className="space-y-3">
                  {selectedAsset.maintenanceHistory.map((record) => (
                    <div key={record.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        record.type === 'preventive' ? 'bg-green-500' : 
                        record.type === 'corrective' ? 'bg-orange-500' : 'bg-red-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 capitalize">{record.type} Maintenance</span>
                          <span className="text-sm text-gray-600">{formatCurrency(record.cost)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{record.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                          <span>Performed by: {record.performedBy}</span>
                          <span>{record.performedDate.toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded-full ${getStatusColor(record.status as any)}`}>
                            {record.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};