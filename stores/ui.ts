import { create } from 'zustand';

type UIState = {
  colorScheme: 'light' | 'dark' | 'system';
  setColorScheme: (v: 'light' | 'dark' | 'system') => void;
};

export const useUIStore = create<UIState>((set) => ({
  colorScheme: 'light',
  setColorScheme: (colorScheme) => set({ colorScheme }),
}));
