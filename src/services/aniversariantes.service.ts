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
  async listarHoje(): Promise<Aniversariante[]> {
    const { data } = await api.get<Aniversariante[]>('/clientes/aniversariantes/hoje')
    return data
  },

  /**
   * Lista aniversariantes do mes
   */
  async listarPorMes(mes?: number): Promise<Aniversariante[]> {
    const { data } = await api.get<Aniversariante[]>('/clientes/aniversariantes/mes', {
      params: mes ? { mes } : undefined,
    })
    return data
  },

  /**
   * Lista aniversariantes em um periodo
   */
  async listarPorPeriodo(dataInicio: string, dataFim: string): Promise<Aniversariante[]> {
    const { data } = await api.get<Aniversariante[]>('/clientes/aniversariantes/periodo', {
      params: {
        data_inicio: dataInicio,
        data_fim: dataFim,
      },
    })
    return data
  },
}
