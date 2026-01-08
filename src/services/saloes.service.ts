import api from './api'
import type { Salao, PaginatedResponse } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  ativo?: boolean
}

export const saloesService = {
  // Métodos genéricos (alias para admin)
  list: async (params: ListParams = {}): Promise<PaginatedResponse<Salao>> => {
    const response = await api.get<PaginatedResponse<Salao>>('/admin/saloes', { params })
    return response.data
  },

  get: async (id: string): Promise<Salao> => {
    const response = await api.get<Salao>(`/admin/saloes/${id}`)
    return response.data
  },

  create: async (data: Partial<Salao>): Promise<Salao> => {
    const response = await api.post<Salao>('/admin/saloes', data)
    return response.data
  },

  update: async (id: string, data: Partial<Salao>): Promise<Salao> => {
    const response = await api.put<Salao>(`/admin/saloes/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/admin/saloes/${id}`)
  },

  // Admin - Salões principais
  listAdmin: async (params: ListParams = {}): Promise<PaginatedResponse<Salao>> => {
    const response = await api.get<PaginatedResponse<Salao>>('/admin/saloes', { params })
    return response.data
  },

  getAdmin: async (id: string): Promise<Salao> => {
    const response = await api.get<Salao>(`/admin/saloes/${id}`)
    return response.data
  },

  createAdmin: async (data: Partial<Salao>): Promise<Salao> => {
    const response = await api.post<Salao>('/admin/saloes', data)
    return response.data
  },

  updateAdmin: async (id: string, data: Partial<Salao>): Promise<Salao> => {
    const response = await api.put<Salao>(`/admin/saloes/${id}`, data)
    return response.data
  },

  deleteAdmin: async (id: string): Promise<void> => {
    await api.delete(`/admin/saloes/${id}`)
  },

  ativar: async (id: string): Promise<void> => {
    await api.post(`/admin/saloes/${id}/ativar`)
  },

  desativar: async (id: string): Promise<void> => {
    await api.post(`/admin/saloes/${id}/desativar`)
  },

  // Filiais
  listFiliais: async (params: ListParams = {}): Promise<PaginatedResponse<Salao>> => {
    const response = await api.get<PaginatedResponse<Salao>>('/saloes/filiais', { params })
    return response.data
  },

  getFilial: async (id: string): Promise<Salao> => {
    const response = await api.get<Salao>(`/saloes/filiais/${id}`)
    return response.data
  },

  createFilial: async (data: Partial<Salao>): Promise<Salao> => {
    const response = await api.post<Salao>('/saloes/filiais', data)
    return response.data
  },

  updateFilial: async (id: string, data: Partial<Salao>): Promise<Salao> => {
    const response = await api.put<Salao>(`/saloes/filiais/${id}`, data)
    return response.data
  },

  deleteFilial: async (id: string): Promise<void> => {
    await api.delete(`/saloes/filiais/${id}`)
  },

  // Salão atual
  getAtual: async (): Promise<Salao> => {
    const response = await api.get<Salao>('/saloes/atual')
    return response.data
  },
}
