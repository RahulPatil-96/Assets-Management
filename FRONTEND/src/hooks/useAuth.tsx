import { useState, useEffect, createContext, useContext } from 'react';
import { BackendUser } from '../types/backend';
import AuthService, { LoginData, SignupData } from '../services/authService';
import { AuthResponse } from '../types/backend';

interface AuthContextType {
  user: BackendUser | null;
  login: (name: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const userData = localStorage.getItem('current_user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (e) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_user');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (name: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const loginData: LoginData = { name, password };
      const response = await AuthService.login(loginData);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('current_user', JSON.stringify(response.user));
      setUser(response.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    setUser(null);
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await AuthService.signup(data);
      // For signup, we don't get a token immediately, so we'll just redirect to signin
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  return {
    user,
    login,
    signup,
    logout,
    isLoading,
    isAuthenticated: !!user,
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
