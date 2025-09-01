import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/Auth/LoginForm';
import { ForgotPassword } from './components/Auth/forgot-password';
import { UpdatePassword } from './components/Auth/update-password';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import { Toaster } from 'react-hot-toast';
import { Lab } from './types/lab';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const AssetList = lazy(() => import('./components/Assets/AssetList'));
const IssueList = lazy(() => import('./components/Issues/IssueList'));
const TransferList = lazy(() => import('./components/Transfers/TransferList'));
const LabManagementPage = lazy(() => import('./components/Labs/LabManagementPage'));

const MainApp: React.FC = () => {
  const [_labs, _setLabs] = useState<Lab[]>([]); // State for labs
  const [searchTerm, setSearchTerm] = useState('');
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginForm />;
  }

  const renderContent = () => {
    const LoadingFallback = () => (
      <div className='p-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6'></div>
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='h-20 bg-gray-200 dark:bg-gray-700 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );

    switch (activeTab) {
      case 'dashboard':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard onNavigate={setActiveTab} />
          </Suspense>
        );
      case 'assets':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AssetList searchTerm={searchTerm} />
          </Suspense>
        );
      case 'issues':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <IssueList searchTerm={searchTerm} />
          </Suspense>
        );
      case 'transfers':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <TransferList searchTerm={searchTerm} />
          </Suspense>
        );
      case 'approvals':
        if (profile.role === 'HOD') {
          return (
            <Suspense fallback={<LoadingFallback />}>
              <AssetList searchTerm={searchTerm} />
            </Suspense>
          );
        }
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        );
      case 'alerts':
        if (profile.role === 'HOD') {
          return (
            <Suspense fallback={<LoadingFallback />}>
              <IssueList searchTerm={searchTerm} />
            </Suspense>
          );
        }
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        );
      case 'reports':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        );
      case 'lab-management':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <LabManagementPage />
          </Suspense>
        );
      case 'settings':
        return (
          <div className='p-6'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>Settings</h1>
            <div className='space-y-6'>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6'>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                  User Profile
                </h2>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Name
                    </label>
                    <p className='mt-1 text-sm text-gray-900 dark:text-white'>{profile.name}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Role
                    </label>
                    <p className='mt-1 text-sm text-gray-900 dark:text-white'>{profile.role}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Lab
                    </label>
                    <p className='mt-1 text-sm text-gray-900 dark:text-white'>
                      {(profile as any).lab_name || profile.lab_id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        );
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900 w-full max-w-full overflow-x-hidden'>
      <Navbar onSearch={handleSearch} setActiveTab={setActiveTab} />
      <div className='flex'>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className='flex-1 overflow-y-auto overflow-x-hidden max-w-screen-xl mx-auto'>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const queryClient = new QueryClient();

const App: React.FC = () => (
  <Router>
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route path='/update-password' element={<UpdatePassword />} />
              <Route path='/signin' element={<LoginForm />} />
              <Route path='/' element={<MainApp />} />
            </Routes>
            <Toaster position='top-right' />
          </QueryClientProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </Router>
);

export default App;
