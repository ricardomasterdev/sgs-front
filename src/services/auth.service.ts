import api from './api'
import type { LoginRequest, LoginResponse, TokenResponse } from '../types'

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data)
    return response.data
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return response.data
  },

  switchSalao: async (salaoId: string): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>(
      `/auth/switch-salao?salao_id=${salaoId}`
    )
    return response.data
  },

  switchFilial: async (filialId?: string): Promise<TokenResponse> => {
    const url = filialId
      ? `/auth/switch-filial?filial_id=${filialId}`
      : '/auth/switch-filial'
    const response = await api.post<TokenResponse>(url)
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}
