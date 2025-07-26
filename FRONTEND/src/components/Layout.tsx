import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  LayoutDashboard, 
  Menu, 
  X, 
  Bell, 
  User, 
  LogOut,
  Search,
  Settings,
  Wrench,
  FileText,
  BarChart3,
  Users,
  QrCode,
  DollarSign,
  Shield,
  BookOpen
} from 'lucide-react';
import { useAuthContext } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export const Layout: React.FC = () => {
  const { user, logout, hasPermission } = useAuthContext();
  const { success } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: LayoutDashboard, 
      permission: 'dashboard:view',
      description: 'Overview and key metrics'
    },
    { 
      name: 'Asset Registry', 
      href: '/assets', 
      icon: Package, 
      permission: 'assets:read',
      description: 'Manage all institutional assets'
    },
    { 
      name: 'Maintenance', 
      href: '/maintenance', 
      icon: Wrench, 
      permission: 'maintenance:read',
      description: 'Schedule and track maintenance'
    },
    { 
      name: 'Asset Requests', 
      href: '/requests', 
      icon: FileText, 
      permission: 'requests:read',
      description: 'Asset requests and approvals'
    },
    { 
      name: 'Reports & Analytics', 
      href: '/reports', 
      icon: BarChart3, 
      permission: 'reports:view',
      description: 'Generate detailed reports'
    },
    { 
      name: 'QR Code Tracking', 
      href: '/qr-tracking', 
      icon: QrCode, 
      permission: 'assets:read',
      description: 'QR code management'
    },
    { 
      name: 'Financial Analysis', 
      href: '/financial', 
      icon: DollarSign, 
      permission: 'finance:read',
      description: 'Cost analysis and budgeting'
    },
    { 
      name: 'Compliance', 
      href: '/compliance', 
      icon: Shield, 
      permission: 'compliance:read',
      description: 'Regulatory compliance tracking'
    },
    { 
      name: 'User Management', 
      href: '/users', 
      icon: Users, 
      permission: 'users:manage',
      description: 'Manage system users'
    },
    { 
      name: 'System Settings', 
      href: '/settings', 
      icon: Settings, 
      permission: 'system:admin',
      description: 'System configuration'
    }
  ].filter(item => hasPermission(item.permission) || hasPermission('*'));

  const handleLogout = () => {
    logout();
    success('Logged Out', 'You have been successfully logged out');
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      department_head: 'bg-blue-100 text-blue-800',
      maintenance_staff: 'bg-green-100 text-green-800',
      finance: 'bg-purple-100 text-purple-800',
      it_team: 'bg-orange-100 text-orange-800',
      staff: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || colors.staff;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-80 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">EduAsset</span>
                <p className="text-xs text-blue-100">Management System</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-2 text-blue-100 hover:bg-blue-700 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          {/* User info in mobile sidebar */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role || 'staff')}`}>
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-white border-r border-gray-200 shadow-lg">
          <div className="flex h-16 items-center px-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">EduAsset</span>
                <p className="text-xs text-blue-100">Management System</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-105'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          {/* User info in desktop sidebar */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.department}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role || 'staff')}`}>
                {user?.role?.replace('_', ' ')}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Dashboard Button - Prominent placement */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className={`inline-flex items-center px-6 py-3 text-base font-semibold rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                location.pathname === '/'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }`}
              aria-label="Dashboard"
            >
              <LayoutDashboard className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center max-w-md">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 pl-3 text-gray-400" />
              <input
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-gray-50 rounded-lg"
                placeholder="Search assets, locations, or asset tags..."
                type="search"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button
                type="button"
                className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="View notifications"
              >
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">3</span>
                </span>
              </button>

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              <div className="relative">
                <button
                  type="button"
                  className="-m-1.5 flex items-center p-1.5 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                      {user?.name}
                    </span>
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-xl bg-white py-2 shadow-lg ring-1 ring-gray-900/5">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Handle settings
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm leading-6 text-gray-900 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center px-3 py-2 text-sm leading-6 text-gray-900 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};