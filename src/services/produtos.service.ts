import api from './api'
import type { Produto, PaginatedResponse } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  categoria?: string
  ativo?: boolean
}

export const produtosService = {
  list: async (params: ListParams = {}): Promise<PaginatedResponse<Produto>> => {
    const response = await api.get<PaginatedResponse<Produto>>('/produtos', { params })
    return response.data
  },

  get: async (id: string): Promise<Produto> => {
    const response = await api.get<Produto>(`/produtos/${id}`)
    return response.data
  },

  create: async (data: Partial<Produto>): Promise<Produto> => {
    const response = await api.post<Produto>('/produtos', data)
    return response.data
  },

  update: async (id: string, data: Partial<Produto>): Promise<Produto> => {
    const response = await api.put<Produto>(`/produtos/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/produtos/${id}`)
  },

  getCategorias: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/produtos/categorias')
    return response.data
  },

  search: async (q: string): Promise<{ id: string; nome: string; codigo?: string; preco_venda: number }[]> => {
    const response = await api.get('/produtos/search/autocomplete', { params: { q } })
    return response.data
  },
}
