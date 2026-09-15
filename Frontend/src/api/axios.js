import axios from 'axios';

const defaultApiUrl = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://samadhansetu-backend.onrender.com';
const configuredApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || defaultApiUrl;
const API_BASE_URL = `${configuredApiUrl.replace(/\/$/, '').replace(/\/api$/, '')}/api`;

export const buildApiUrl = (path = '') => {
  const normalizedPath = String(path || '').trim();
  if (!normalizedPath) return API_BASE_URL;
  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;

  const rootBase = API_BASE_URL.replace(/\/api$/, '');
  const cleanPath = normalizedPath.startsWith('/api') ? normalizedPath : `/${normalizedPath.replace(/^\//, '')}`;
  return `${rootBase}${cleanPath}`;
};

// Create a pre-configured Axios instance
// This points to our backend API base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Request Interceptor:
// Before any request leaves the browser, this function runs automatically.
// It checks if a JWT token is saved in localStorage.
// If found, it attaches the "Authorization: Bearer <token>" header.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      const currentRole = localStorage.getItem('role');
      const isAdminRoute = window.location.pathname.startsWith('/admin');

      if (currentRole === 'admin' || isAdminRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
        localStorage.removeItem('isEmailVerified');
        window.location.href = '/login/admin';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
