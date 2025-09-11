import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  User,
  Search,
  Settings,
  Package,
  Moon,
  Sun,
  Menu,
} from 'lucide-react';
import NotificationBell from '../Notifications/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LabService } from '../../lib/labService';

const Navbar: React.FC<{
  onSearch: (term: string) => void;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  activeTab: string;
}> = ({ onSearch, setActiveTab, toggleSidebar, activeTab }) => {
  const { profile, signOut, updateUserLab } = useAuth();
  const profileWithLabName = profile as typeof profile & { lab_name?: string };
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isChangeLabOpen, setIsChangeLabOpen] = useState(false);
  const [labs, setLabs] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [isUpdatingLab, setIsUpdatingLab] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  useEffect(() => {
    if (
      (profile?.role === 'Lab Assistant' || profile?.role === 'Lab Incharge') &&
      isChangeLabOpen
    ) {
      LabService.getLabs()
        .then(fetchedLabs => setLabs(fetchedLabs))
        .catch(() => setLabs([]));
    }
  }, [isChangeLabOpen, profile?.role]);

  const handleLabSelect = async (labId: string) => {
    setSelectedLabId(labId);
    setIsUpdatingLab(true);
    setUpdateError(null);
    const success = await updateUserLab(labId);
    setIsUpdatingLab(false);
    if (success) {
      setIsChangeLabOpen(false);
      setIsProfileDropdownOpen(false);
    } else {
      setUpdateError('Failed to update lab. Please try again.');
    }
  };

  return (
    <nav className="bg-white/10 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4 shadow-sm">
      <div className="flex items-center justify-between w-full">
        {/* Left Section: Logo & Sidebar Toggle */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Sidebar toggle only on mobile */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-2 rounded-md">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="block">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                AssetFlow
              </h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300">
                Track. Manage. Maintain.
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search bar (hidden on small screens) */}
        {activeTab !== 'dashboard' && activeTab !== 'settings' && (
          <div className="hidden md:flex flex-1 justify-center px-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-300 pointer-events-none" />
              <input
                type="search"
                placeholder="Search assets or locations..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full py-2 pl-10 pr-4 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </div>
          </div>
        )}

        {/* Right Section: Notification, Theme, Profile */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <NotificationBell />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
          </button>

          {/* Profile Section */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center space-x-2 md:space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-expanded={isProfileDropdownOpen}
            >
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {profile?.name}
                </p>
                <div className="flex flex-col items-start space-y-0.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                      profile?.role || ''
                    )} truncate`}
                  >
                    {profile?.role}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {profileWithLabName.lab_name ||
                      profileWithLabName.lab_id ||
                      ''}
                  </span>
                </div>
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {profile?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profile?.role}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setActiveTab('settings');
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                {/* Change Lab option */}
                {(profile?.role === 'Lab Assistant' ||
                  profile?.role === 'Lab Incharge') && (
                  <div>
                    {/* <button
                      onClick={() => setIsChangeLabOpen(!isChangeLabOpen)}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <span>Change Lab</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isChangeLabOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button> */}
                    {isChangeLabOpen && (
                      <div className="max-h-48 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
                        {labs.length === 0 && (
                          <p className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                            No labs available
                          </p>
                        )}
                        {labs.map(lab => (
                          <button
                            key={lab.id}
                            onClick={() => handleLabSelect(lab.id)}
                            disabled={isUpdatingLab}
                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              selectedLabId === lab.id
                                ? 'font-semibold text-blue-600'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {lab.name}
                          </button>
                        ))}
                        {updateError && (
                          <p className="px-4 py-2 text-xs text-red-600 dark:text-red-400">
                            {updateError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={async () => {
                    setIsProfileDropdownOpen(false);
                    await signOut();
                    navigate('/signin');
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
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
