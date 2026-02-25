import { api } from './api';
import { LoginRequest, LoginResponse, SignupRequest } from '@/types';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: SignupRequest): Promise<void> => {
    await api.post('/auth/register', data);
  },

  sendCaptcha: async (email: string, type: 'register' | 'reset_password' = 'register'): Promise<void> => {
    await api.post('/captcha/email/send', { email, type });
  },

  resetPassword: async (data: { email: string; newPassword: string; captcha: string }): Promise<void> => {
    await api.post('/auth/reset-password', data);
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};
