import api from './api'
import type { Colaborador, PaginatedResponse, ServicoVinculado } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  ativo?: boolean
  cargo_id?: string
}

interface CreateColaborador extends Omit<Partial<Colaborador>, 'servicos'> {
  servicos?: ServicoVinculado[]
}

export const colaboradoresService = {
  list: async (params: ListParams = {}): Promise<PaginatedResponse<Colaborador>> => {
    const response = await api.get<PaginatedResponse<Colaborador>>('/colaboradores', { params })
    return response.data
  },

  get: async (id: string): Promise<Colaborador> => {
    const response = await api.get<Colaborador>(`/colaboradores/${id}`)
    return response.data
  },

  create: async (data: CreateColaborador): Promise<Colaborador> => {
    const response = await api.post<Colaborador>('/colaboradores', data)
    return response.data
  },

  update: async (id: string, data: CreateColaborador): Promise<Colaborador> => {
    const response = await api.put<Colaborador>(`/colaboradores/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/colaboradores/${id}`)
  },

  search: async (q?: string, servicoId?: string): Promise<{ id: string; nome: string; cargo?: string }[]> => {
    const response = await api.get('/colaboradores/search/autocomplete', { params: { q, servico_id: servicoId } })
    return response.data
  },
}
