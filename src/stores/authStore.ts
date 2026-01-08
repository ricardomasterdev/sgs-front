import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UsuarioAuth, SalaoSimples } from '../types'

interface AuthState {
  usuario: UsuarioAuth | null
  salao: SalaoSimples | null
  saloes: SalaoSimples[]
  filial: SalaoSimples | null
  filiais: SalaoSimples[]
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (
    usuario: UsuarioAuth,
    salao: SalaoSimples | null,
    token: string,
    refreshToken: string
  ) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUsuario: (updates: Partial<UsuarioAuth>) => void
  setTokens: (token: string, refreshToken: string) => void
  setSalao: (salao: SalaoSimples | null) => void
  setSaloes: (saloes: SalaoSimples[]) => void
  setFilial: (filial: SalaoSimples | null) => void
  setFiliais: (filiais: SalaoSimples[]) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      usuario: null,
      salao: null,
      saloes: [],
      filial: null,
      filiais: [],
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: (usuario, salao, token, refreshToken) =>
        set({
          usuario,
          salao,
          saloes: usuario.saloes || [],
          filiais: usuario.filiais || [],
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          usuario: null,
          salao: null,
          saloes: [],
          filial: null,
          filiais: [],
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      updateUsuario: (updates) =>
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...updates } : null,
        })),

      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      setSalao: (salao) => set({ salao, filial: null }),

      setSaloes: (saloes) => set({ saloes }),

      setFilial: (filial) => set({ filial }),

      setFiliais: (filiais) => set({ filiais }),
    }),
    {
      name: 'sgs-auth-storage',
      partialize: (state) => ({
        usuario: state.usuario,
        salao: state.salao,
        saloes: state.saloes,
        filial: state.filial,
        filiais: state.filiais,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
