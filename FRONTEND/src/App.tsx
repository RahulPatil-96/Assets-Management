import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/ToastContainer';
import { Dashboard } from './pages/Dashboard';
import { AssetRegistry } from './pages/AssetRegistry';
import { Header } from './components/Header';
import { LoginForm } from './components/LoginForm';
import { Sidebar } from './components/Sidebar';
import { HelpCenter } from './components/HelpCenter';
import { Signin } from './pages/signin';
import { Signup } from './pages/signup';
import { ForgotPassword } from './pages/forgot-password';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
    <div className="text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">Loading EduAsset</h2>
      <p className="text-lg text-gray-600 mb-6">Educational Asset Management System</p>
      <div className="flex items-center justify-center space-x-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
};

const AppContent: React.FC = () => {
  const { user, logout } = useAuthContext();
  const { toasts, removeToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Map paths to tab ids
    const pathToTabId: { [key: string]: string } = {
      '/': 'dashboard',
      '/assets': 'assets',
      '/settings': 'settings',
    };

    const currentTab = pathToTabId[location.pathname];
    if (currentTab && currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [location.pathname, activeTab]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={!sidebarOpen}
        />
      )}

      <div className="flex flex-col flex-1 min-h-screen">
        {user && (
          <Header
            user={user}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onLogout={logout}
          />
        )}

        <main className="flex-1 min-h-screen p-4">
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assets" element={<AssetRegistry />} />
              <Route
                path="/settings"
                element={
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      System Settings
                    </h2>
                    <p className="text-gray-600 mt-2">Coming soon...</p>
                  </div>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="/" element={<Navigate to="/signin" replace />} />
          </Routes>
        </main>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>

      <HelpCenter isOpen={helpCenterOpen} onClose={() => setHelpCenterOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;