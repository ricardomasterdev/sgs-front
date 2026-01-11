import { useState, useEffect, useMemo } from 'react'
import {
  Receipt,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCw,
  Home,
  Play
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { comandasService } from '../../services/comandas.service'
import { formatters } from '../../utils/masks'
import type { Comanda, StatusComanda } from '../../types'
import ComandaColaboradorModal from '../../components/comandas/ComandaColaboradorModal'

// Cores por status
const statusColors: Record<StatusComanda, string> = {
  aberta: 'bg-blue-100 text-blue-700',
  em_atendimento: 'bg-yellow-100 text-yellow-700',
  aguardando_pagamento: 'bg-orange-100 text-orange-700',
  paga: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}

const statusLabels: Record<StatusComanda, string> = {
  aberta: 'Aberta',
  em_atendimento: 'Em Atendimento',
  aguardando_pagamento: 'Aguardando Pagamento',
  paga: 'Paga',
  cancelada: 'Cancelada',
}

export default function MinhasComandasPage() {
  const { usuario } = useAuthStore()
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [comandasSalao, setComandasSalao] = useState<Comanda[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<{id: string, nome: string} | null>(null)

  // Obter data de hoje no fuso horario do Brasil
  const getHojeBrasil = () => {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const parts = formatter.formatToParts(now)
    const dia = parts.find(p => p.type === 'day')?.value || '01'
    const mes = parts.find(p => p.type === 'month')?.value || '01'
    const ano = parts.find(p => p.type === 'year')?.value || '2024'
    return `${ano}-${mes}-${dia}`
  }

  // Carregar comandas do colaborador
  const loadComandas = async () => {
    if (!usuario?.colaborador_id) {
      console.warn('Colaborador ID nao encontrado no usuario:', usuario)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const hojeBrasil = getHojeBrasil()
      console.log('Buscando comandas para data:', hojeBrasil)
      console.log('Colaborador ID do usuario:', usuario.colaborador_id)

      // Chamada 1: Carregar comandas do colaborador de hoje (filtrado no backend)
      const responseMinhas = await comandasService.list({
        per_page: 100,
        colaborador_id: usuario.colaborador_id,
        data_inicio: hojeBrasil,
        data_fim: hojeBrasil,
      })
      console.log('Minhas comandas de hoje:', responseMinhas.items.length)
      setComandas(responseMinhas.items)

      // Chamada 2: Carregar comandas abertas do salao (todas, sem filtro de colaborador)
      const responseSalao = await comandasService.list({
        per_page: 50,
        data_inicio: hojeBrasil,
        data_fim: hojeBrasil,
      })
      const abertasSalao = responseSalao.items.filter(
        c => (c.status === 'aberta' || c.status === 'em_atendimento')
      )
      console.log('Comandas abertas do salao:', abertasSalao.length)
      setComandasSalao(abertasSalao)
    } catch (error) {
      console.error('Erro ao carregar comandas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComandas()
  }, [usuario?.colaborador_id])

  // Calcular estatisticas do dashboard (dados ja sao de hoje do colaborador)
  const stats = useMemo(() => {
    const colabId = String(usuario?.colaborador_id || '')

    // Excluir comandas canceladas dos calculos
    const comandasValidas = comandas.filter(c => c.status !== 'cancelada')

    // Filtrar apenas itens do colaborador logado (servicos)
    const meusServicos = comandasValidas.flatMap(c =>
      (c.itens || []).filter(i => i.tipo === 'servico' && String(i.colaborador_id) === colabId)
    )

    // Contar clientes unicos das comandas que o colaborador atendeu
    const clientesAtendidos = new Set(
      comandasValidas
        .filter(c => (c.itens || []).some(i => String(i.colaborador_id) === colabId))
        .map(c => c.cliente_id)
        .filter(Boolean)
    )

    const totalBruto = meusServicos.reduce((acc, item) => acc + (Number(item.valor_total) || 0), 0)
    const totalComissao = meusServicos.reduce((acc, item) => acc + (Number(item.comissao_valor) || 0), 0)

    return {
      servicosHoje: meusServicos.length,
      totalClientes: clientesAtendidos.size,
      totalBruto,
      totalComissao,
    }
  }, [comandas, usuario?.colaborador_id])

  // Ultimos servicos do colaborador (dados ja sao de hoje)
  const ultimosServicos = useMemo(() => {
    const colabId = String(usuario?.colaborador_id || '')

    // Excluir comandas canceladas
    const comandasValidas = comandas.filter(c => c.status !== 'cancelada')

    const servicos = comandasValidas
      .flatMap(c => (c.itens || []).map(item => ({
        ...item,
        comanda_numero: c.numero,
        cliente_nome: c.cliente?.nome || c.nome_cliente || 'Cliente nao informado',
        data: c.data_abertura || c.created_at
      })))
      .filter(item => item.tipo === 'servico' && String(item.colaborador_id) === colabId)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5)
    return servicos
  }, [comandas, usuario?.colaborador_id])

  // Separar minhas comandas em abertas e fechadas (max 10 cada)
  const { minhasComandasAbertas, minhasComandasFechadas } = useMemo(() => {
    const abertas = comandas
      .filter(c => c.status === 'aberta' || c.status === 'em_atendimento')
      .slice(0, 10)
    const fechadas = comandas
      .filter(c => c.status !== 'aberta' && c.status !== 'em_atendimento')
      .slice(0, 10)
    return { minhasComandasAbertas: abertas, minhasComandasFechadas: fechadas }
  }, [comandas])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleComandaCriada = () => {
    setModalOpen(false)
    setClienteSelecionado(null)
    loadComandas()
  }

  const handleContinuarComanda = (comanda: Comanda) => {
    if (comanda.cliente_id) {
      setClienteSelecionado({
        id: comanda.cliente_id,
        nome: comanda.cliente?.nome || comanda.nome_cliente || 'Cliente'
      })
    } else if (comanda.nome_cliente) {
      setClienteSelecionado(null) // Sem ID, mas tem nome
    }
    setModalOpen(true)
  }

  const handleNovaComanda = () => {
    setClienteSelecionado(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minhas Comandas</h1>
          <p className="text-slate-500 mt-1">
            Ola, {usuario?.colaborador_nome || usuario?.nome}! Gerencie suas comandas aqui.
          </p>
        </div>
        <button
          onClick={handleNovaComanda}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Comanda</span>
        </button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Servicos do Dia */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.servicosHoje}</p>
              <p className="text-sm text-slate-500">Servicos Hoje</p>
            </div>
          </div>
        </div>

        {/* Total Clientes */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalClientes}</p>
              <p className="text-sm text-slate-500">Clientes</p>
            </div>
          </div>
        </div>

        {/* Total Bruto */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalBruto)}</p>
              <p className="text-sm text-slate-500">Total Bruto</p>
            </div>
          </div>
        </div>

        {/* Total Comissao */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalComissao)}</p>
              <p className="text-sm text-slate-500">Minha Comissao</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ultimos Servicos */}
      {ultimosServicos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-500" />
              Ultimos Servicos
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {ultimosServicos.map((servico, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{servico.descricao}</p>
                  <p className="text-sm text-slate-500">
                    {servico.cliente_nome} - Comanda #{servico.comanda_numero}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{formatCurrency(servico.valor_total)}</p>
                  <p className="text-sm text-emerald-600">+{formatCurrency(servico.comissao_valor)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comandas Abertas do Salao */}
      {comandasSalao.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-500" />
              Comandas Abertas do Salao Hoje ({comandasSalao.length})
            </h3>
            <p className="text-xs text-slate-500 mt-1">Clique para adicionar seus servicos</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {comandasSalao.map((comanda) => (
              <div
                key={comanda.id}
                className="p-3 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">#{comanda.numero}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[comanda.status]}`}>
                        {statusLabels[comanda.status]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {comanda.cliente?.nome || comanda.nome_cliente || 'Cliente nao informado'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(comanda.total)}</p>
                      <p className="text-xs text-slate-400">
                        {formatters.timeBR(comanda.data_abertura || comanda.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleContinuarComanda(comanda)}
                      className="p-2 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-600 transition-colors"
                      title="Adicionar meus servicos"
                    >
                      <Play size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minhas Comandas Abertas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-500" />
            Minhas Comandas Abertas ({minhasComandasAbertas.length})
          </h3>
          <button
            onClick={loadComandas}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>

        {!usuario?.colaborador_id ? (
          <div className="p-8 text-center text-amber-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-amber-300" />
            <p className="font-medium">Colaborador nao vinculado</p>
            <p className="text-sm mt-1">Seu usuario nao esta vinculado a um colaborador. Contate o administrador.</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Carregando comandas...</p>
          </div>
        ) : minhasComandasAbertas.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <p className="text-sm">Nenhuma comanda aberta</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {minhasComandasAbertas.map((comanda) => (
              <div key={comanda.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">#{comanda.numero}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[comanda.status]}`}>
                        {statusLabels[comanda.status]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {comanda.cliente?.nome || comanda.nome_cliente || 'Cliente nao informado'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {comanda.itens?.length || 0} itens
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(comanda.total)}</p>
                      <p className="text-xs text-slate-400">
                        {formatters.dateTimeShortBR(comanda.data_abertura || comanda.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleContinuarComanda(comanda)}
                      className="p-2 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-600 transition-colors"
                      title="Adicionar mais servicos"
                    >
                      <Play size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Minhas Comandas Fechadas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-green-500" />
            Minhas Comandas Fechadas ({minhasComandasFechadas.length})
          </h3>
          <p className="text-xs text-slate-500 mt-1">Ultimas 10 comandas finalizadas</p>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : minhasComandasFechadas.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <p className="text-sm">Nenhuma comanda fechada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {minhasComandasFechadas.map((comanda) => (
              <div key={comanda.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">#{comanda.numero}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[comanda.status]}`}>
                        {statusLabels[comanda.status]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {comanda.cliente?.nome || comanda.nome_cliente || 'Cliente nao informado'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {comanda.itens?.length || 0} itens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(comanda.total)}</p>
                    <p className="text-xs text-slate-400">
                      {formatters.dateTimeShortBR(comanda.data_abertura || comanda.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Nova Comanda */}
      {modalOpen && (
        <ComandaColaboradorModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setClienteSelecionado(null)
          }}
          onSuccess={handleComandaCriada}
          clienteInicial={clienteSelecionado}
        />
      )}

      {/* Rodape de Navegacao */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg lg:hidden">
        <div className="flex justify-around py-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center gap-1 px-4 py-2 text-teal-600"
          >
            <Home size={20} />
            <span className="text-xs font-medium">Inicio</span>
          </button>
          <button
            onClick={handleNovaComanda}
            className="flex flex-col items-center gap-1 px-4 py-2 bg-teal-500 text-white rounded-xl -mt-4 shadow-lg"
          >
            <Plus size={24} />
            <span className="text-xs font-medium">Nova</span>
          </button>
          <button
            onClick={loadComandas}
            className="flex flex-col items-center gap-1 px-4 py-2 text-slate-500"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            <span className="text-xs font-medium">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Espacamento para o rodape mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
