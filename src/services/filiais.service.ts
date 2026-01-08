import api from './api'
import type { PaginatedResponse, Filial } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  ativo?: boolean
}

export const filiaisService = {
  list: async (params?: ListParams) => {
    const { data } = await api.get<PaginatedResponse<Filial>>('/filiais', { params })
    return data
  },

  get: async (id: string) => {
    const { data } = await api.get<Filial>(`/filiais/${id}`)
    return data
  },

  create: async (payload: Partial<Filial>) => {
    const { data } = await api.post<Filial>('/filiais', payload)
    return data
  },

  update: async (id: string, payload: Partial<Filial>) => {
    const { data } = await api.put<Filial>(`/filiais/${id}`, payload)
    return data
  },

  delete: async (id: string) => {
    await api.delete(`/filiais/${id}`)
  },

  ativar: async (id: string) => {
    await api.post(`/filiais/${id}/ativar`)
  },

  desativar: async (id: string) => {
    await api.post(`/filiais/${id}/desativar`)
  },
}
