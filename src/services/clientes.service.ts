import api from './api'
import type { Cliente, PaginatedResponse } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  ativo?: boolean
}

// Tipo flexível para criar/atualizar clientes (aceita genero como string)
type ClientePayload = Omit<Partial<Cliente>, 'genero'> & { genero?: string }

export const clientesService = {
  list: async (params: ListParams = {}): Promise<PaginatedResponse<Cliente>> => {
    const response = await api.get<PaginatedResponse<Cliente>>('/clientes', { params })
    return response.data
  },

  get: async (id: string): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${id}`)
    return response.data
  },

  create: async (data: ClientePayload): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes', data)
    return response.data
  },

  update: async (id: string, data: ClientePayload): Promise<Cliente> => {
    const response = await api.put<Cliente>(`/clientes/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clientes/${id}`)
  },

  search: async (q: string): Promise<{ id: string; nome: string; celular?: string }[]> => {
    const response = await api.get('/clientes/search/autocomplete', { params: { q } })
    return response.data
  },
}
