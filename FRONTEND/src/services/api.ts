const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Get default headers with optional authentication
const getDefaultHeaders = (includeAuth: boolean = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = token;
    }
  }

  return headers;
};

export const api = {
  get: async (endpoint: string, includeAuth: boolean = true) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getDefaultHeaders(includeAuth),
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, data: any, includeAuth: boolean = true) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getDefaultHeaders(includeAuth),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, data: any, includeAuth: boolean = true) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getDefaultHeaders(includeAuth),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string, includeAuth: boolean = true) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getDefaultHeaders(includeAuth),
    });
    return handleResponse(response);
  },
};

const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      const error: ApiError = new Error(response.statusText);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  } else {
    if (!response.ok) {
      const error: ApiError = new Error(response.statusText);
      error.status = response.status;
      throw error;
    }
    return response.text();
  }
};
