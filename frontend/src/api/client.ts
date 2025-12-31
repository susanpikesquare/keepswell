import axios from 'axios';

// Use environment variable, or production API URL if on Render, or /api for local dev
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Production fallback
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://keepswell-api.onrender.com/api';
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('keepswell.com')) {
    return 'https://keepswell-api.onrender.com/api';
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      console.error('Unauthorized request');
    }
    return Promise.reject(error);
  }
);
