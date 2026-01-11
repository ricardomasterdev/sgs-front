import api from './api'
import type { Cargo, PaginatedResponse } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  ativo?: boolean
  filial_id?: string
}

export const cargosService = {
  list: async (params: ListParams = {}): Promise<PaginatedResponse<Cargo>> => {
    const response = await api.get<PaginatedResponse<Cargo>>('/cargos', { params })
    return response.data
  },

  get: async (id: string): Promise<Cargo> => {
    const response = await api.get<Cargo>(`/cargos/${id}`)
    return response.data
  },

  create: async (data: Partial<Cargo>): Promise<Cargo> => {
    const response = await api.post<Cargo>('/cargos', data)
    return response.data
  },

  update: async (id: string, data: Partial<Cargo>): Promise<Cargo> => {
    const response = await api.put<Cargo>(`/cargos/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/cargos/${id}`)
  },
}
