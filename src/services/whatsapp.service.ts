import api from './api'
import type { SessaoWhatsapp, PaginatedResponse } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  ativo?: boolean
}

export const whatsappService = {
  list: async (params: ListParams = {}): Promise<PaginatedResponse<SessaoWhatsapp>> => {
    const response = await api.get<PaginatedResponse<SessaoWhatsapp>>('/whatsapp', { params })
    return response.data
  },

  get: async (id: string): Promise<SessaoWhatsapp> => {
    const response = await api.get<SessaoWhatsapp>(`/whatsapp/${id}`)
    return response.data
  },

  create: async (data: { nome: string; salao_id?: string | null }): Promise<SessaoWhatsapp> => {
    const response = await api.post<SessaoWhatsapp>('/whatsapp', data)
    return response.data
  },

  update: async (id: string, data: { nome?: string; ativo?: boolean; salao_id?: string | null }): Promise<SessaoWhatsapp> => {
    const response = await api.put<SessaoWhatsapp>(`/whatsapp/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/whatsapp/${id}`)
    return response.data
  },

  connect: async (id: string): Promise<SessaoWhatsapp> => {
    const response = await api.post<SessaoWhatsapp>(`/whatsapp/${id}/connect`)
    return response.data
  },

  disconnect: async (id: string): Promise<SessaoWhatsapp> => {
    const response = await api.post<SessaoWhatsapp>(`/whatsapp/${id}/disconnect`)
    return response.data
  },

  getStatus: async (id: string): Promise<{ status: string; numero?: string; qr_code?: string; error?: string }> => {
    const response = await api.get(`/whatsapp/${id}/status`)
    return response.data
  },

  getQrCode: async (id: string): Promise<{ qr_code?: string; status: string }> => {
    const response = await api.get(`/whatsapp/${id}/qrcode`)
    return response.data
  },

  sendMessage: async (sessaoId: string, data: { telefone: string; mensagem: string; cliente_id?: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/whatsapp/${sessaoId}/send`, data)
    return response.data
  },

  listarMensagensPorCliente: async (clienteId: string, params?: { page?: number; page_size?: number }): Promise<{
    items: Array<{
      id: string
      telefone: string
      conteudo: string
      tipo: string
      from_me: boolean
      timestamp: string
      status: string
    }>
    total: number
    page: number
    page_size: number
    total_pages: number
  }> => {
    const response = await api.get(`/whatsapp/mensagens/cliente/${clienteId}`, { params })
    return response.data
  },

  listarMensagensPorSessao: async (sessaoId: string, params?: { page?: number; page_size?: number; search?: string }): Promise<{
    items: Array<{
      id: string
      telefone: string
      remote_jid: string
      conteudo: string
      tipo: string
      from_me: boolean
      timestamp: string
      status: string
      cliente_id: string | null
      cliente_nome: string | null
    }>
    total: number
    page: number
    page_size: number
    total_pages: number
  }> => {
    const response = await api.get(`/whatsapp/${sessaoId}/mensagens`, { params })
    return response.data
  },
}
