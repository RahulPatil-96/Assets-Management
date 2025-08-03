// src/services/authService.ts
import { api } from './api';

export interface LoginData {
  name: string;
  password: string;
}

export interface SignupData {
  name: string;
  role: string;
  password: string;
}

export interface User {
  user_id: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    return api.post('/api/auth/signin', data);
  }

  async signup(data: SignupData): Promise<User> {
    return api.post('/api/auth/signup', data);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();
