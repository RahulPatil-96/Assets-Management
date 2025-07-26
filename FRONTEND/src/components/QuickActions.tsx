import React from 'react';
import { 
  Upload, 
  Plus, 
  Search, 
  FileText, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const quickActions = [
  {
    id: 'upload',
    title: 'Upload Documents',
    description: 'Drag & drop or browse files',
    icon: <Upload className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    shortcut: '⌘U'
  },
  {
    id: 'new-asset',
    title: 'Add New Asset',
    description: 'Register equipment or property',
    icon: <Plus className="w-6 h-6" />,
    color: 'from-green-500 to-green-600',
    shortcut: '⌘N'
  },
  {
    id: 'search',
    title: 'Quick Search',
    description: 'Find anything instantly',
    icon: <Search className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
    shortcut: '⌘K'
  },
  {
    id: 'intake-form',
    title: 'Create Intake Form',
    description: 'Digital document processing',
    icon: <FileText className="w-6 h-6" />,
    color: 'from-orange-500 to-orange-600',
    shortcut: '⌘I'
  }
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const { success, info } = useToast();

  const handleAction = (actionId: string, actionTitle: string) => {
    info('Quick Action', `Opening ${actionTitle}...`);
    onAction(actionId);
    
    // Simulate action completion
    setTimeout(() => {
      success('Action Complete', `${actionTitle} is ready to use`);
    }, 1000);
  };

  const handleKeyboardShortcut = (e: React.KeyboardEvent, actionId: string, actionTitle: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAction(actionId, actionTitle);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <Zap className="w-5 h-5 text-yellow-500" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id, action.title)}
            onKeyDown={(e) => handleKeyboardShortcut(e, action.id, action.title)}
            className="group p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md hover:scale-105 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`${action.title} - ${action.description}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
                {action.icon}
              </div>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
                  {action.shortcut}
                </kbd>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <h4 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {action.title}
            </h4>
            <p className="text-sm text-gray-600">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};