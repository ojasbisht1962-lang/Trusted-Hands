import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    
    // Skip API calls for guest users on certain endpoints
    if (userData?.isGuest && token?.startsWith('guest_token_')) {
      // For guest users, only allow GET requests to public endpoints
      if (config.method !== 'get') {
        console.log('Blocking non-GET request for guest user');
        return Promise.reject(new Error('Guest users cannot perform this action'));
      }
    }
    
    if (token && !token.startsWith('guest_token_')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    
    // Don't redirect guest users on 401
    if (error.response?.status === 401 && !userData?.isGuest) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
