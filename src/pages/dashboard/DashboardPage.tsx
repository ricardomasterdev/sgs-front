import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import {
  Users,
  UserCog,
  Scissors,
  Package,
  Receipt,
  TrendingUp,
  Calendar,
  Gift,
  Store,
  ArrowRight,
  Cake,
  Phone,
  Play,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { dashboardService } from '../../services/dashboard.service'
import { comandasService } from '../../services/comandas.service'
import { formatters } from '../../utils/masks'
import { cn } from '../../utils/cn'
import NovaComandaNormalModal from '../../components/comandas/NovaComandaNormalModal'
import NovaComandaRapidaModal from '../../components/comandas/NovaComandaRapidaModal'
import { WhatsAppSendMessageModal, WhatsAppIcon } from '../../components/whatsapp'
import type { Comanda, AniversarianteHoje } from '../../types'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'pink' | 'purple' | 'blue' | 'green' | 'amber' | 'orange'
  subtitle?: string
  to?: string
}

const colorClasses = {
  pink: 'bg-gradient-to-br from-pink-500 to-pink-600',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  green: 'bg-gradient-to-br from-green-500 to-green-600',
  amber: 'bg-gradient-to-br from-amber-500 to-amber-600',
  orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
}

function StatCard({ title, value, icon, color, subtitle, to }: StatCardProps) {
  const content = (
    <div className="flex items-center gap-4">
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-white', colorClasses[color])}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {to && <ArrowRight size={18} className="text-slate-300 group-hover:text-primary-500 transition-colors" />}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="card-hover group cursor-pointer hover:shadow-lg transition-shadow">
        {content}
      </Link>
    )
  }

  return <div className="card-hover">{content}</div>
}

// Dashboard para Salao especifico
function SalaoDashboard() {
  const navigate = useNavigate()
  const salao = useAuthStore((state) => state.salao)
  const [isContinuarOpen, setIsContinuarOpen] = useState(false)
  const [comandaParaContinuar, setComandaParaContinuar] = useState<Comanda | null>(null)
  const [isNovaComandaOpen, setIsNovaComandaOpen] = useState(false)
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false)
  const [whatsAppCliente, setWhatsAppCliente] = useState<AniversarianteHoje | null>(null)

  const handleWhatsAppAniversariante = (cliente: AniversarianteHoje) => {
    setWhatsAppCliente(cliente)
    setIsWhatsAppOpen(true)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', salao?.id],
    queryFn: dashboardService.getDashboard,
    refetchInterval: 60000,
  })

  const handleContinuarComanda = async (comandaId: string) => {
    try {
      const comanda = await comandasService.get(comandaId)
      setComandaParaContinuar(comanda)
      setIsContinuarOpen(true)
    } catch {
      // Se falhar, navega para a pagina de detalhes
      navigate(`/comandas/${comandaId}`)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card h-24 animate-shimmer" />
        ))}
      </div>
    )
  }

  const stats = data?.estatisticas

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-slate-500">Visao geral do seu salao</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Clientes"
          value={stats?.total_clientes || 0}
          icon={<Users size={24} />}
          color="pink"
          to="/clientes"
        />
        <StatCard
          title="Colaboradores"
          value={stats?.total_colaboradores || 0}
          icon={<UserCog size={24} />}
          color="purple"
          to="/colaboradores"
        />
        <StatCard
          title="Servicos"
          value={stats?.total_servicos || 0}
          icon={<Scissors size={24} />}
          color="blue"
          to="/servicos"
        />
        <StatCard
          title="Produtos"
          value={stats?.total_produtos || 0}
          icon={<Package size={24} />}
          color="green"
          to="/produtos"
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Comandas Abertas"
          value={stats?.comandas_abertas || 0}
          icon={<Receipt size={24} />}
          color="amber"
          to="/comandas"
        />
        <StatCard
          title="Faturamento Hoje"
          value={formatters.currency(stats?.faturamento_hoje || 0)}
          icon={<TrendingUp size={24} />}
          color="green"
          subtitle={`${stats?.atendimentos_hoje || 0} atendimentos`}
          to="/relatorios"
        />
        <StatCard
          title="Faturamento Mes"
          value={formatters.currency(stats?.faturamento_mes || 0)}
          icon={<Calendar size={24} />}
          color="blue"
          subtitle={`${stats?.atendimentos_mes || 0} atendimentos`}
          to="/relatorios"
        />
        <StatCard
          title="Aniversariantes"
          value={data?.aniversariantes_hoje?.length || 0}
          icon={<Gift size={24} />}
          color="orange"
          subtitle="Hoje"
          to="/aniversariantes"
        />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comandas Recentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Comandas Recentes</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsNovaComandaOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                <Zap size={14} />
                Nova
              </button>
              <Link to="/comandas" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Ver todas
              </Link>
            </div>
          </div>
          {data?.comandas_recentes?.length ? (
            <div className="space-y-3">
              {data.comandas_recentes.map((comanda) => (
                <div
                  key={comanda.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/comandas/${comanda.id}`)}
                >
                  <div>
                    <p className="font-bold text-primary-600">{comanda.cliente_nome || 'Cliente nao informado'}</p>
                    <p className="text-xs text-slate-400">#{comanda.numero}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatters.currency(comanda.total)}
                      </p>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        comanda.status === 'paga' && 'bg-green-100 text-green-700',
                        comanda.status === 'aberta' && 'bg-blue-100 text-blue-700',
                        comanda.status === 'em_atendimento' && 'bg-amber-100 text-amber-700',
                        comanda.status === 'aguardando_pagamento' && 'bg-purple-100 text-purple-700',
                        comanda.status === 'cancelada' && 'bg-red-100 text-red-700',
                      )}>
                        {comanda.status === 'aguardando_pagamento' ? 'Aguardando' : comanda.status}
                      </span>
                    </div>
                    {comanda.status !== 'paga' && comanda.status !== 'cancelada' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleContinuarComanda(comanda.id); }}
                        className="p-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 transition-colors"
                        title="Continuar / Fechar"
                      >
                        <Play size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">Nenhuma comanda recente</p>
          )}
        </div>

        {/* Aniversariantes */}
        <div className="card group">
          <Link to="/aniversariantes">
            <div className="flex items-center justify-between mb-4 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Cake className="w-5 h-5 text-pink-600" />
                </div>
                <h3 className="section-title">Aniversariantes Hoje</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-sm font-medium">
                  {data?.aniversariantes_hoje?.length || 0}
                </span>
                <ArrowRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>
          {data?.aniversariantes_hoje?.length ? (
            <div className="space-y-3">
              {data.aniversariantes_hoje.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                      <Gift size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{cliente.nome}</p>
                      <p className="text-sm text-slate-500">{cliente.idade} anos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(cliente.whatsapp || cliente.celular) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleWhatsAppAniversariante(cliente); }}
                        className="p-2 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                      </button>
                    )}
                    {cliente.celular && (
                      <a
                        href={`tel:${cliente.celular}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Ligar"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">Nenhum aniversariante hoje</p>
          )}
          <Link to="/aniversariantes">
            <button className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Ver todos os aniversariantes
            </button>
          </Link>
        </div>
      </div>

      <NovaComandaNormalModal
        isOpen={isContinuarOpen}
        onClose={() => { setIsContinuarOpen(false); setComandaParaContinuar(null); }}
        comanda={comandaParaContinuar}
      />

      <NovaComandaRapidaModal
        isOpen={isNovaComandaOpen}
        onClose={() => setIsNovaComandaOpen(false)}
      />

      {whatsAppCliente && (
        <WhatsAppSendMessageModal
          isOpen={isWhatsAppOpen}
          onClose={() => { setIsWhatsAppOpen(false); setWhatsAppCliente(null); }}
          cliente={{
            id: whatsAppCliente.id,
            nome: whatsAppCliente.nome,
            whatsapp: whatsAppCliente.whatsapp,
            celular: whatsAppCliente.celular,
          }}
        />
      )}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { salao, usuario } = useAuthStore()

  // Super usuario sem salao selecionado = redireciona para /admin/dashboard
  const isSuperAdminMode = usuario?.super_usuario && !salao

  useEffect(() => {
    if (isSuperAdminMode) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [isSuperAdminMode, navigate])

  // Se e super admin sem salao, mostra loading enquanto redireciona
  if (isSuperAdminMode) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  // Se nao tem salao e nao e super usuario, pede para selecionar
  if (!salao && !usuario?.super_usuario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <Store size={40} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Selecione um Salao</h2>
        <p className="text-slate-500">Use o menu superior para selecionar um salao</p>
      </div>
    )
  }

  // Renderiza dashboard do salao
  return <SalaoDashboard />
}
