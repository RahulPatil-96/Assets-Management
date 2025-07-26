import React, { useState } from 'react';
import { Search, Bell, Menu, User, LogOut, Settings, HelpCircle, ChevronDown } from 'lucide-react';
import { User as UserType } from '../types';
import { useToast } from '../hooks/useToast';

interface HeaderProps {
  user: UserType;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onToggleSidebar, onLogout }) => {
  const { success, info } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      success('Search', `Searching for: "${searchQuery}"`);
      // Implement search functionality
    }
  };

  const handleNotificationClick = () => {
    success('Notification', 'Notification marked as read');
    // Handle notification click
  };

  const handleProfileSettings = () => {
    info('Profile', 'Opening profile settings...');
    setShowUserMenu(false);
  };

  const handlePreferences = () => {
    info('Preferences', 'Opening user preferences...');
    setShowUserMenu(false);
  };

  const handleHelpSupport = () => {
    info('Help', 'Opening help center...');
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    success('Logout', 'You have been logged out successfully');
    setShowUserMenu(false);
    onLogout();
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm relative z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            <form onSubmit={handleSearch} className="relative">
              <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-105' : ''}`}>
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Search documents, assets, or tracking IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-16 py-3 w-96 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white hover:bg-white"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </form>
          </div>

          <div className="flex items-center space-x-4">

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="View notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs text-white font-bold">3</span>
                </span>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></div>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transform transition-all duration-200 origin-top-right animate-fadeInUp">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">3 new</span>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <button
                      onClick={() => handleNotificationClick()}
                      className="w-full p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors cursor-pointer text-left focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full mt-2 animate-pulse"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Asset Maintenance Overdue</p>
                          <p className="text-xs text-gray-600 mt-1">HVAC System Unit A requires immediate attention</p>
                          <p className="text-xs text-gray-400 mt-2">2 hours ago</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNotificationClick()}
                      className="w-full p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors cursor-pointer text-left focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Document Processing Complete</p>
                          <p className="text-xs text-gray-600 mt-1">Equipment Purchase Agreement.pdf is ready for review</p>
                          <p className="text-xs text-gray-400 mt-2">4 hours ago</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNotificationClick()}
                      className="w-full p-4 hover:bg-gray-50 transition-colors cursor-pointer text-left focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">New Asset Registered</p>
                          <p className="text-xs text-gray-600 mt-1">Dell Latitude 7420 has been added to inventory</p>
                          <p className="text-xs text-gray-400 mt-2">6 hours ago</p>
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        info('Notifications', 'Opening all notifications...');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role} • {user.department}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <User className="w-5 h-5 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transform transition-all duration-200 origin-top-right animate-fadeInUp">
                  <div className="p-3">
                    <button
                      onClick={handleProfileSettings}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 focus:outline-none focus:bg-gray-100"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={handlePreferences}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 focus:outline-none focus:bg-gray-100"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Preferences</span>
                    </button>
                    <button
                      onClick={handleHelpSupport}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 focus:outline-none focus:bg-gray-100"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Help & Support</span>
                    </button>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 focus:outline-none focus:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};