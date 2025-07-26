import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  Book, 
  Video, 
  MessageCircle, 
  ExternalLink,
  ChevronRight,
  Star,
  Clock
} from 'lucide-react';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const helpCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Book className="w-5 h-5" />,
    articles: [
      { title: 'Quick Start Guide', time: '5 min read', popular: true },
      { title: 'Setting Up Your First Project', time: '8 min read' },
      { title: 'Understanding the Dashboard', time: '3 min read' }
    ]
  },
  {
    id: 'documents',
    title: 'Document Management',
    icon: <Book className="w-5 h-5" />,
    articles: [
      { title: 'Uploading and Processing Documents', time: '6 min read', popular: true },
      { title: 'Using OCR and AI Features', time: '10 min read' },
      { title: 'Document Search and Filters', time: '4 min read' }
    ]
  },
  {
    id: 'assets',
    title: 'Asset Management',
    icon: <Book className="w-5 h-5" />,
    articles: [
      { title: 'Adding and Tracking Assets', time: '7 min read' },
      { title: 'Maintenance Scheduling', time: '5 min read', popular: true },
      { title: 'QR Code Generation', time: '3 min read' }
    ]
  }
];

const videoTutorials = [
  { title: 'AssetFlow Overview', duration: '3:45', views: '2.1k' },
  { title: 'Document Upload Process', duration: '5:20', views: '1.8k' },
  { title: 'Asset Management Basics', duration: '4:15', views: '1.5k' }
];

export const HelpCenter: React.FC<HelpCenterProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Help Center</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <nav className="space-y-2">
              {helpCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {category.icon}
                  <span className="font-medium">{category.title}</span>
                </button>
              ))}
            </nav>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Video Tutorials</h3>
              <div className="space-y-2">
                {videoTutorials.map((video, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Video className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                      <p className="text-xs text-gray-500">{video.duration} • {video.views} views</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {helpCategories.find(c => c.id === activeCategory)?.title}
              </h3>
              <p className="text-gray-600">Find answers and learn how to use AssetFlow effectively</p>
            </div>

            <div className="space-y-4">
              {helpCategories
                .find(c => c.id === activeCategory)
                ?.articles.map((article, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h4>
                          {article.popular && (
                            <span className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              <Star className="w-3 h-3" />
                              <span>Popular</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{article.time}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need More Help?</h3>
              <p className="text-blue-700 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Contact Support</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  <span>Community Forum</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};