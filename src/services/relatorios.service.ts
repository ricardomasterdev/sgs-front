import api from './api'

export interface ComissaoItem {
  id: string
  comanda_id: string
  comanda_numero: string
  comanda_data: string
  cliente_nome: string
  colaborador_id: string
  colaborador_nome: string
  descricao: string
  tipo: 'servico' | 'produto'
  valor_total: number
  comissao_percentual: number
  comissao_valor: number
}

export interface RelatorioComissaoResponse {
  itens: ComissaoItem[]
  total_valor: number
  total_comissao: number
  total_itens: number
}

export interface RelatorioComissaoParams {
  colaborador_id?: string
  data_inicio: string
  data_fim: string
}

export const relatoriosService = {
  /**
   * Busca relatorio de comissoes por periodo e colaborador
   */
  async comissoes(params: RelatorioComissaoParams): Promise<RelatorioComissaoResponse> {
    const { data } = await api.get<RelatorioComissaoResponse>('/relatorios/comissoes', {
      params: {
        colaborador_id: params.colaborador_id || undefined,
        data_inicio: params.data_inicio,
        data_fim: params.data_fim,
      },
    })
    return data
  },
}
