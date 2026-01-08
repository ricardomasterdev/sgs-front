import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Store,
  Users,
  MessageCircle,
  ArrowRight,
  Shield,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { saloesService } from '../../services/saloes.service'
import { Spinner } from '../../components/ui'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { usuario, saloes } = useAuthStore()

  // Query para estatisticas de saloes
  const { data: saloesData, isLoading } = useQuery({
    queryKey: ['admin-saloes-stats'],
    queryFn: () => saloesService.list({ per_page: 100 }),
    staleTime: 60000,
  })

  const totalSaloes = saloesData?.total || saloes?.length || 0
  const saloesAtivos = saloesData?.items?.filter(s => s.ativo !== false).length || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Shield size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Painel Administrativo</h1>
          <p className="text-slate-500">Bem-vindo, {usuario?.nome}</p>
        </div>
      </div>

      {/* Cards de Estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Store size={28} className="text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-700">{totalSaloes}</p>
              <p className="text-sm text-amber-600">Saloes Cadastrados</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Activity size={28} className="text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-700">{saloesAtivos}</p>
              <p className="text-sm text-green-600">Saloes Ativos</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <TrendingUp size={28} className="text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-700">100%</p>
              <p className="text-sm text-blue-600">Sistema Operacional</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acoes Rapidas */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Acoes Rapidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/saloes')}
            className="p-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                <Store size={20} className="text-white" />
              </div>
              <span className="font-medium text-slate-700">Gerenciar Saloes</span>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/admin/usuarios')}
            className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <span className="font-medium text-slate-700">Gerenciar Usuarios</span>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/admin/whatsapp')}
            className="p-4 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                <MessageCircle size={20} className="text-white" />
              </div>
              <span className="font-medium text-slate-700">WhatsApp Global</span>
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-green-500 transition-colors" />
          </button>
        </div>
      </div>

      {/* Lista de Saloes Recentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Saloes Cadastrados</h2>
          <button
            onClick={() => navigate('/admin/saloes')}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Ver todos
          </button>
        </div>

        {saloesData?.items && saloesData.items.length > 0 ? (
          <div className="space-y-3">
            {saloesData.items.slice(0, 5).map((salao) => (
              <div
                key={salao.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-pink-500 flex items-center justify-center text-white font-bold">
                    {salao.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{salao.nome}</p>
                    <p className="text-sm text-slate-500">{salao.codigo || 'Sem codigo'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  salao.ativo !== false
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {salao.ativo !== false ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-8">Nenhum salao cadastrado</p>
        )}
      </div>
    </div>
  )
}
