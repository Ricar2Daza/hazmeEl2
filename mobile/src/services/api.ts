import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants';
import { ApiResponse } from '../types';

const TOKEN_KEY = 'hazme_access_token';
const REFRESH_TOKEN_KEY = 'hazme_refresh_token';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          isRefreshing = false;
          return Promise.reject(error);
        }
        const resp = await axios.post<ApiResponse>(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const newAccessToken = resp.data.accessToken;
        if (newAccessToken) {
          await SecureStore.setItemAsync(TOKEN_KEY, newAccessToken);
          if (resp.data.refreshToken) {
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, resp.data.refreshToken);
          }
          onTokenRefreshed(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          isRefreshing = false;
          return axios(originalRequest);
        }
        isRefreshing = false;
        return Promise.reject(error);
      } catch (refreshError) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const tokenStorage = {
  async setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },
  async getAccessToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async clearTokens() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

export const authApi = {
  register: (data: { fullName: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  verify: (token: string) => api.get(`/auth/verify/${token}`),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

export const jobsApi = {
  create: (data: any) => api.post('/jobs', data),
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  mine: () => api.get('/jobs/mine'),
  getById: (id: string) => api.get(`/jobs/${id}`),
  list: (params?: any) => api.get('/jobs', { params }),
  apply: (jobId: string, data?: { message?: string | null }) =>
    api.post(`/jobs/${jobId}/apply`, data),
  applications: (jobId: string) => api.get(`/jobs/${jobId}/applications`),
};

export const applicationsApi = {
  mine: () => api.get('/applications/mine'),
  accept: (id: string) => api.patch(`/applications/${id}/accept`),
  reject: (id: string) => api.patch(`/applications/${id}/reject`),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
};

export const notificationsApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  unreadCount: () => api.get('/notifications/unread-count'),
};

export default api;
