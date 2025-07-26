import React from 'react';
import { LayoutDashboard, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'assets', label: 'Assets', icon: Package, path: '/assets' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed }) => {
  const navigate = useNavigate();

  return (
    <div className={`bg-slate-900 text-white transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-80'} min-h-screen border-r border-slate-800 relative z-30`}>
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="w-7 h-7 text-white" />
          </div>
          {!isCollapsed && (
            <div className="transition-all duration-300">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AssetFlow
              </h1>
              <p className="text-xs text-slate-400 font-medium">Document & Asset Management</p>
            </div>
          )}
        </div>
      </div>

      <nav className="mt-4 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center space-x-4 px-4 py-3 text-left rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'hover:bg-slate-800 text-slate-300 hover:text-white hover:scale-105'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`} />
                {!isCollapsed && (
                  <span className={`text-sm font-medium transition-all duration-200 ${
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                )}
                {isActive && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
