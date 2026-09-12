import axios from 'axios';

// Create a pre-configured Axios instance
// This points to our backend API base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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

export default api;
