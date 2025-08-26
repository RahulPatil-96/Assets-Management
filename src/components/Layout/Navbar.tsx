import React, { useState } from 'react';
import { LogOut, User, Search, Settings, Package, Moon, Sun } from 'lucide-react';
import NotificationBell from '../Notifications/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar: React.FC<{ onSearch: (term: string) => void }> = ({ onSearch }) => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'HOD':
        return 'bg-purple-100 text-purple-700 ring-1 ring-purple-300';
      case 'Lab Assistant':
        return 'bg-blue-100 text-blue-700 ring-1 ring-blue-300';
      case 'Lab Incharge':
        return 'bg-green-100 text-green-700 ring-1 ring-green-300';
      default:
        return 'bg-gray-100 text-gray-700 ring-1 ring-gray-300';
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800/10 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">

        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="bg-blue-100 p-2 rounded-md">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
              AssetFlow
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 -mt-1">Track. Manage. Maintain.</p>
          </div>
        </div>

        {/* Search Bar, Notification, Profile Section */}
        <div className="flex items-center space-x-4 w-full md:w-auto">

          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none dark:text-gray-300" />
            <input
              type="search"
              placeholder="Search assets or locations..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full py-2 pl-10 pr-4 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
            />
          </div>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Profile Section */}
          <div className="relative w-full md:w-[300px]"> {/* Increase width here */}
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 min-h-[44px]"
              aria-expanded={isProfileDropdownOpen}
              aria-label="User profile menu"
            >
              <div className="text-left w-full"> {/* Align text to the left */}
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{profile?.name}</p>
                <div className="flex flex-col items-start space-y-1 w-full">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(profile?.role || '')} truncate`}
                  >
                    {profile?.role}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile?.lab_id || ''}</span>
                </div>
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shadow-sm dark:bg-gray-600">
                <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </div>

            </button>

            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.role}</p>
                </div>
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    // Navigate to settings (would need routing implementation)
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    signOut();
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;