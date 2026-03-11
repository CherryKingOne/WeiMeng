import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getLocaleFromPath, withLocale } from '@/constants';
import { clearAuthToken, getStorageItem, syncAuthTokenCookie } from '@/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token = getStorageItem<string | null>('token', null);

    // Backward compatibility:
    // old login flow stored raw token string (non-JSON), but getStorageItem expects JSON.
    if (!token && typeof window !== 'undefined') {
      const rawToken = localStorage.getItem('token');
      if (rawToken) {
        try {
          const parsed = JSON.parse(rawToken);
          token = typeof parsed === 'string' ? parsed : null;
        } catch {
          token = rawToken;
          localStorage.setItem('token', JSON.stringify(rawToken));
        }
      }
    }

    if (token && config.headers) {
      syncAuthTokenCookie(token);
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
        clearAuthToken();
        const locale = getLocaleFromPath(window.location.pathname);
        window.location.href = withLocale('/auth/login', locale);
      }
    }
    return Promise.reject(error);
  }
);
