import api from './api'
import type { Usuario, PaginatedResponse, StatusUsuario } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
  status_filter?: StatusUsuario
}

interface CreateUsuario {
  nome: string
  email: string
  senha: string
  cpf?: string
  telefone?: string
  perfil_id?: string
  salao_id?: string
  super_usuario?: boolean
}

export const usuariosService = {
  list: async (params: ListParams = {}): Promise<PaginatedResponse<Usuario>> => {
    const response = await api.get<PaginatedResponse<Usuario>>('/usuarios', { params })
    return response.data
  },

  get: async (id: string): Promise<Usuario> => {
    const response = await api.get<Usuario>(`/usuarios/${id}`)
    return response.data
  },

  create: async (data: CreateUsuario): Promise<Usuario> => {
    const response = await api.post<Usuario>('/usuarios', data)
    return response.data
  },

  update: async (id: string, data: Partial<CreateUsuario>): Promise<Usuario> => {
    const response = await api.put<Usuario>(`/usuarios/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/usuarios/${id}`)
  },

  listPerfis: async (): Promise<{ id: string; codigo: string; nome: string }[]> => {
    const response = await api.get('/usuarios/perfis/list')
    return response.data
  },
}
