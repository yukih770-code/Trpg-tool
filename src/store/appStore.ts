import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  system: 'D&D' | 'CoC';
  setSystem: (system: 'D&D' | 'CoC') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      system: 'D&D',
      setSystem: (system) => set({ system })
    }),
    { name: 'dnd-app-store' }
  )
);
