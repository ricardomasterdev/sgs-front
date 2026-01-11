import api from './api'

export interface Aniversariante {
  id: string
  nome: string
  data_nascimento: string
  idade: number
  celular: string | null
  whatsapp: string | null
}

export const aniversariantesService = {
  /**
   * Lista aniversariantes de hoje
   */
  async listarHoje(filialId?: string): Promise<Aniversariante[]> {
    const { data } = await api.get<Aniversariante[]>('/clientes/aniversariantes/hoje', {
      params: filialId ? { filial_id: filialId } : undefined,
    })
    return data
  },

  /**
   * Lista aniversariantes do mes
   */
  async listarPorMes(mes?: number, filialId?: string): Promise<Aniversariante[]> {
    const params: Record<string, unknown> = {}
    if (mes) params.mes = mes
    if (filialId) params.filial_id = filialId
    const { data } = await api.get<Aniversariante[]>('/clientes/aniversariantes/mes', {
      params: Object.keys(params).length > 0 ? params : undefined,
    })
    return data
  },

  /**
   * Lista aniversariantes em um periodo
   */
  async listarPorPeriodo(dataInicio: string, dataFim: string, filialId?: string): Promise<Aniversariante[]> {
    const params: Record<string, unknown> = {
      data_inicio: dataInicio,
      data_fim: dataFim,
    }
    if (filialId) params.filial_id = filialId
    const { data } = await api.get<Aniversariante[]>('/clientes/aniversariantes/periodo', { params })
    return data
  },
}
