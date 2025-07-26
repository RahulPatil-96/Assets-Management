import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<string, User> = {
  'admin@university.edu': {
    id: '1',
    name: 'Dr. Sarah Johnson',
    email: 'admin@university.edu',
    role: 'admin',
    department: 'Administration',
    permissions: ['*'],
    lastLogin: new Date(),
    isActive: true
  },
  'dept.head@university.edu': {
    id: '2',
    name: 'Prof. Michael Chen',
    email: 'dept.head@university.edu',
    role: 'department_head',
    department: 'Computer Science',
    permissions: ['assets:read', 'assets:request', 'reports:view', 'maintenance:request'],
    lastLogin: new Date(),
    isActive: true
  },
  'maintenance@university.edu': {
    id: '3',
    name: 'John Smith',
    email: 'maintenance@university.edu',
    role: 'maintenance_staff',
    department: 'Facilities',
    permissions: ['assets:read', 'maintenance:read', 'maintenance:write', 'maintenance:schedule'],
    lastLogin: new Date(),
    isActive: true
  },
  'finance@university.edu': {
    id: '4',
    name: 'Lisa Brown',
    email: 'finance@university.edu',
    role: 'finance',
    department: 'Finance',
    permissions: ['assets:read', 'reports:view', 'budget:read', 'depreciation:view'],
    lastLogin: new Date(),
    isActive: true
  },
  'it@university.edu': {
    id: '5',
    name: 'David Wilson',
    email: 'it@university.edu',
    role: 'it_team',
    department: 'IT Services',
    permissions: ['assets:read', 'assets:write', 'it_assets:manage', 'reports:view'],
    lastLogin: new Date(),
    isActive: true
  }
};

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('current_user');

    if (token && savedUser) {
      setTimeout(() => {
        setUser(JSON.parse(savedUser));
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers[email];
    if (user && password === 'password') {
      const updatedUser = { ...user, lastLogin: new Date() };
      localStorage.setItem('auth_token', 'mock_token');
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  return {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
    hasPermission
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};