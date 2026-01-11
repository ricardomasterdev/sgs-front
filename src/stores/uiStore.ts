import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarCollapsed: boolean
  sidebarOpen: boolean // Para mobile - controla se sidebar está aberta
}

interface UIActions {
  toggleSidebarCollapsed: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarOpen: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: false,

      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      toggleSidebarOpen: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'sgs-ui-storage',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }), // Não persiste sidebarOpen
    }
  )
)
