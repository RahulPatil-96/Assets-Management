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
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Enhanced error handling with more detailed error messages
const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      const error: ApiError = new Error(data.message || response.statusText);
      error.status = response.status;
      error.data = data;
      
      // Log detailed error for debugging
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint: response.url,
        data
      });
      
      throw error;
    }
    return data;
  } else {
    const text = await response.text();
    if (!response.ok) {
      const error: ApiError = new Error(text || response.statusText);
      error.status = response.status;
      throw error;
    }
    return text;
  }
};

export const api = {
  get: async (endpoint: string, includeAuth: boolean = true) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getDefaultHeaders(includeAuth),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('GET request failed:', error);
      throw error;
    }
  },

  post: async (endpoint: string, data: any, includeAuth: boolean = true) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getDefaultHeaders(includeAuth),
        body: JSON.stringify(data),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('POST request failed:', error);
      throw error;
    }
  },

  put: async (endpoint: string, data: any, includeAuth: boolean = true) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getDefaultHeaders(includeAuth),
        body: JSON.stringify(data),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('PUT request failed:', error);
      throw error;
    }
  },

  delete: async (endpoint: string, includeAuth: boolean = true) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getDefaultHeaders(includeAuth),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('DELETE request failed:', error);
      throw error;
    }
  },
};

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Utility function to clear authentication
export const clearAuth = (): void => {
  localStorage.removeItem('auth_token');
};
