import api from './api'
import type { Servico, PaginatedResponse } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  categoria?: string
  ativo?: boolean
  filial_id?: string
}

export const servicosService = {
  list: async (params: ListParams = {}): Promise<PaginatedResponse<Servico>> => {
    const response = await api.get<PaginatedResponse<Servico>>('/servicos', { params })
    return response.data
  },

  get: async (id: string): Promise<Servico> => {
    const response = await api.get<Servico>(`/servicos/${id}`)
    return response.data
  },

  create: async (data: Partial<Servico>): Promise<Servico> => {
    const response = await api.post<Servico>('/servicos', data)
    return response.data
  },

  update: async (id: string, data: Partial<Servico>): Promise<Servico> => {
    const response = await api.put<Servico>(`/servicos/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/servicos/${id}`)
  },

  getCategorias: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/servicos/categorias')
    return response.data
  },
}
