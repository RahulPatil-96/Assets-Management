import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types';
import AuthService, { LoginData, AuthResponse } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (name: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('current_user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Convert date strings back to Date objects
        if (parsedUser.lastLogin) {
          parsedUser.lastLogin = new Date(parsedUser.lastLogin);
        }
        setUser(parsedUser);
      } catch (e) {
        console.error('Error parsing user data from localStorage', e);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (name: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const loginData: LoginData = { name, password };
      const response: AuthResponse = await AuthService.login(loginData);
      
      // Map backend user to frontend User type
      const frontendUser: User = {
        id: response.user.user_id,
        name: response.user.name,
        email: `${response.user.name}@university.edu`, // Placeholder email
        role: mapBackendRoleToFrontendRole(response.user.role),
        department: getDepartmentFromRole(response.user.role),
        permissions: getPermissionsFromRole(response.user.role),
        lastLogin: new Date(),
        isActive: true
      };

      AuthService.setToken(response.token);
      localStorage.setItem('current_user', JSON.stringify(frontendUser));
      setUser(frontendUser);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    AuthService.removeToken();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    setUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // For now, we'll give all permissions to all users
    // In a real application, this would be based on the user's role
    return true;
  };

  // Helper function to map backend roles to frontend roles
  const mapBackendRoleToFrontendRole = (backendRole: string): User['role'] => {
    switch (backendRole) {
      case 'lab_assistant':
        return 'staff';
      case 'assistant professor':
        return 'department_head';
      case 'hod':
        return 'department_head';
      default:
        return 'staff';
    }
  };

  // Helper function to get department from role
  const getDepartmentFromRole = (role: string): string => {
    switch (role) {
      case 'lab_assistant':
        return 'Laboratory';
      case 'assistant professor':
        return 'Academic';
      case 'hod':
        return 'Administration';
      default:
        return 'General';
    }
  };

  // Helper function to get permissions from role
  const getPermissionsFromRole = (role: string): string[] => {
    // For now, we'll give all permissions to all users
    // In a real application, this would be based on the user's role
    return ['*'];
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
