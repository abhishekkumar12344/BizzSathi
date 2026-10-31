import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bizsathi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const activeBusinessId = localStorage.getItem('bizsathi_active_business_id');
  if (activeBusinessId) {
    config.headers['x-business-id'] = activeBusinessId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred while communicating with the server';

    if (error.response?.status === 401) {
      // Don't auto-clear if already on login/register to avoid infinite loop
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('bizsathi_token');
        localStorage.removeItem('bizsathi_user');
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
