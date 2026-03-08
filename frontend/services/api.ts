import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getLocaleFromPath, withLocale } from '@/constants';
import { getStorageItem } from '@/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://0.0.0.0:5607/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStorageItem<string | null>('token', null);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        const locale = getLocaleFromPath(window.location.pathname);
        window.location.href = withLocale('/auth/login', locale);
      }
    }
    return Promise.reject(error);
  }
);
