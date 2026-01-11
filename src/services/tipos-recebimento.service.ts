import api from './api'
import type { TipoRecebimento, PaginatedResponse } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  ativo?: boolean
  filial_id?: string
}

export const tiposRecebimentoService = {
  list: async (params: ListParams = {}): Promise<PaginatedResponse<TipoRecebimento>> => {
    const response = await api.get<PaginatedResponse<TipoRecebimento>>('/tipos-recebimento', { params })
    return response.data
  },

  get: async (id: string): Promise<TipoRecebimento> => {
    const response = await api.get<TipoRecebimento>(`/tipos-recebimento/${id}`)
    return response.data
  },

  create: async (data: Partial<TipoRecebimento>): Promise<TipoRecebimento> => {
    const response = await api.post<TipoRecebimento>('/tipos-recebimento', data)
    return response.data
  },

  update: async (id: string, data: Partial<TipoRecebimento>): Promise<TipoRecebimento> => {
    const response = await api.put<TipoRecebimento>(`/tipos-recebimento/${id}`, data)
    return response.data
  },

  delete: async (id: string, permanent: boolean = false): Promise<void> => {
    await api.delete(`/tipos-recebimento/${id}`, { params: { permanent } })
  },
}
