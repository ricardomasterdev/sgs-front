import api from './api'
import type { DashboardData } from '../types'

export interface AdminEstatisticas {
  total_saloes: number
  total_usuarios: number
  total_clientes: number
}

export const dashboardService = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/dashboard')
    return response.data
  },

  getAdminEstatisticas: async (): Promise<AdminEstatisticas> => {
    const response = await api.get<AdminEstatisticas>('/admin/estatisticas')
    return response.data
  },
}
