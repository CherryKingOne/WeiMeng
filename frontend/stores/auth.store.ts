import { create } from 'zustand';
import { User } from '@/types';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) {
      setStorageItem('token', token);
    } else {
      removeStorageItem('token');
    }
    set({ token, isAuthenticated: !!token });
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    removeStorageItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  hydrate: () => {
    const token = getStorageItem<string | null>('token', null);
    set({ token, isAuthenticated: !!token, isLoading: false });
  },
}));
