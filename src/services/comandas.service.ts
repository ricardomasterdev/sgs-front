import api from './api'
import type { Comanda, ComandaItem, ComandaPagamento, PaginatedResponse, StatusComanda } from '../types'

interface ListParams {
  page?: number
  per_page?: number
  status_filter?: StatusComanda
  cliente_id?: string
  data_inicio?: string
  data_fim?: string
}

interface CreateComanda {
  cliente_id?: string
  nome_cliente?: string
  data_abertura?: string
  status?: StatusComanda
  observacoes?: string
  itens?: {
    tipo: 'servico' | 'produto'
    servico_id?: string
    produto_id?: string
    colaborador_id?: string
    descricao: string
    quantidade: number
    valor_unitario: number
    desconto?: number
    comissao_percentual?: number
    observacoes?: string
  }[]
}

interface CreateItem {
  tipo: 'servico' | 'produto'
  servico_id?: string
  produto_id?: string
  colaborador_id?: string
  descricao: string
  quantidade: number
  valor_unitario: number
  desconto?: number
  comissao_percentual?: number
  observacoes?: string
}

interface CreatePagamento {
  tipo_recebimento_id: string
  valor: number
  observacoes?: string
}

export const comandasService = {
  list: async (params: ListParams = {}): Promise<PaginatedResponse<Comanda>> => {
    const response = await api.get<PaginatedResponse<Comanda>>('/comandas', { params })
    return response.data
  },

  get: async (id: string): Promise<Comanda> => {
    const response = await api.get<Comanda>(`/comandas/${id}`)
    return response.data
  },

  create: async (data: CreateComanda): Promise<Comanda> => {
    const response = await api.post<Comanda>('/comandas', data)
    return response.data
  },

  update: async (id: string, data: Partial<Comanda>): Promise<Comanda> => {
    const response = await api.put<Comanda>(`/comandas/${id}`, data)
    return response.data
  },

  addItem: async (comandaId: string, data: CreateItem): Promise<ComandaItem> => {
    const response = await api.post<ComandaItem>(`/comandas/${comandaId}/itens`, data)
    return response.data
  },

  removeItem: async (comandaId: string, itemId: string): Promise<void> => {
    await api.delete(`/comandas/${comandaId}/itens/${itemId}`)
  },

  addPagamento: async (comandaId: string, data: CreatePagamento): Promise<ComandaPagamento> => {
    const response = await api.post<ComandaPagamento>(`/comandas/${comandaId}/pagamentos`, data)
    return response.data
  },

  cancelar: async (id: string): Promise<Comanda> => {
    const response = await api.post<Comanda>(`/comandas/${id}/cancelar`)
    return response.data
  },

  removePagamento: async (comandaId: string, pagamentoId: string): Promise<void> => {
    await api.delete(`/comandas/${comandaId}/pagamentos/${pagamentoId}`)
  },
}
