import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  system: 'D&D' | 'CoC' | 'CP';
  setSystem: (system: 'D&D' | 'CoC' | 'CP') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      system: 'D&D' as 'D&D' | 'CoC' | 'CP',
      setSystem: (system) => set({ system })
    }),
    { name: 'dnd-app-store' }
  )
);
