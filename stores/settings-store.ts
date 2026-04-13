import { create } from 'zustand';

interface SettingsState {
  apiKey: string;
  locale: 'zh' | 'en';
  setApiKey: (key: string) => void;
  setLocale: (locale: 'zh' | 'en') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: '',
  locale: 'zh',
  setApiKey: (key) => set({ apiKey: key }),
  setLocale: (locale) => set({ locale }),
}));
