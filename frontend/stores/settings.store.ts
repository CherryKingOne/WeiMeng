import { create } from 'zustand';
import { DEFAULT_LOCALE, type Locale } from '@/constants';

interface SettingsState {
  isOpen: boolean;
  activeTab: string;
  theme: 'light' | 'dark' | 'auto';
  language: Locale;
  openSettings: (tab?: string) => void;
  closeSettings: () => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (lang: Locale) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isOpen: false,
  activeTab: 'general',
  theme: 'light',
  language: DEFAULT_LOCALE,
  openSettings: (tab = 'general') => set({ isOpen: true, activeTab: tab }),
  closeSettings: () => set({ isOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => set({ theme }),
  setLanguage: (lang) => set({ language: lang }),
}));
