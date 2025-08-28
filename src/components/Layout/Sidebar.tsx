import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(!collapsed);

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'assets', label: 'Assets', icon: Package },
    ];

    const roleSpecificItems = {
      HOD: [
        { id: 'alerts', label: 'System Alerts', icon: AlertTriangle },
        { id: 'transfers', label: 'Asset Transfers', icon: ArrowRightLeft },
      ],
      'Lab Assistant': [
        { id: 'issues', label: 'Issue Management', icon: AlertTriangle },
        { id: 'transfers', label: 'Asset Transfers', icon: ArrowRightLeft },
      ],
      'Lab Incharge': [
        { id: 'issues', label: 'Report Issues', icon: AlertTriangle },
        { id: 'transfers', label: 'Asset Transfers', icon: ArrowRightLeft },
      ],
    };

    return [
      ...baseItems,
      ...(roleSpecificItems[profile?.role as keyof typeof roleSpecificItems] || []),
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  };

  return (
    <div
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } h-screen bg-white/10 dark:bg-gray-800 backdrop-blur-lg border border-white/20 dark:border-white/20 shadow-lg transition-all duration-300 flex flex-col`}
    >
      <div className='p-4 flex items-center justify-between'>
        {!collapsed && <h2 className='text-xl font-bold text-gray'>Menu</h2>}
        <button
          onClick={toggleCollapse}
          className='text-gray-500 hover:text-gray-900 transition-colors'
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className='flex-1 space-y-2 px-2'>
        {getMenuItems().map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className='w-5 h-5' />
              {!collapsed && <span className='text-sm'>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
