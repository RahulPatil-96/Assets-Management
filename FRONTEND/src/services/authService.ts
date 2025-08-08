import { api } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/auth/login', credentials, false);
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/auth/register', credentials, false);
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await api.post('/api/auth/forgot-password', { email }, false);
    } catch (error) {
      console.error('Forgot password request failed:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await api.post('/api/auth/reset-password', { token, newPassword }, false);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    // Optionally redirect to login page
    window.location.href = '/signin';
  }

  getCurrentUser(): User | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.userId || payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export default new AuthService();
