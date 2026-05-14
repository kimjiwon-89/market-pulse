import axios from 'axios';

const KEYS = { token: 'mp_token', username: 'mp_username', role: 'mp_role' };

export const getToken = () => localStorage.getItem(KEYS.token);
export const getUsername = () => localStorage.getItem(KEYS.username);
export const getRole = () => localStorage.getItem(KEYS.role);

export const setAuth = (token: string, username: string, role: string) => {
  localStorage.setItem(KEYS.token, token);
  localStorage.setItem(KEYS.username, username);
  localStorage.setItem(KEYS.role, role);
};

export const clearAuth = () => {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
};

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
