import { useState, useEffect, useMemo } from 'react'
import {
  Receipt,
  Search,
  DollarSign,
  TrendingUp,
  Calendar,
  RefreshCw,
  Home,
  ChevronLeft,
  FileText
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { comandasService } from '../../services/comandas.service'
import { formatters } from '../../utils/masks'
import type { Comanda, StatusComanda } from '../../types'

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

export default function RelatoriosComandasPage() {
  const { usuario } = useAuthStore()
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [loading, setLoading] = useState(false)
  const [dataInicio, setDataInicio] = useState<string>('')
  const [dataFim, setDataFim] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusComanda | ''>('')

  // Funcao de busca
  const executarBusca = async (inicio: string, fim: string, status?: StatusComanda | '') => {
    if (!usuario?.colaborador_id) {
      console.warn('Colaborador ID nao encontrado')
      return
    }

    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        per_page: 500,
        colaborador_id: usuario.colaborador_id,
        data_inicio: inicio,
        data_fim: fim,
      }

      if (status) {
        params.status_filter = status
      }

      console.log('Buscando comandas com params:', params)
      const response = await comandasService.list(params)
      console.log('Resposta:', response)
      setComandas(response.items)
    } catch (error) {
      console.error('Erro ao buscar comandas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Buscar com datas atuais do estado
  const buscarComandas = () => {
    if (!dataInicio || !dataFim) {
      alert('Informe a data de inicio e fim')
      return
    }
    executarBusca(dataInicio, dataFim, statusFilter)
  }

  // Definir datas padrao (mes atual) e buscar automaticamente
  useEffect(() => {
    const hoje = new Date()
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const dataInicioStr = primeiroDia.toISOString().split('T')[0]
    const dataFimStr = hoje.toISOString().split('T')[0]
    setDataInicio(dataInicioStr)
    setDataFim(dataFimStr)

    // Buscar automaticamente ao carregar (passa as datas diretamente)
    if (usuario?.colaborador_id) {
      executarBusca(dataInicioStr, dataFimStr)
    }
  }, [usuario?.colaborador_id])

  // Calcular totais (excluindo comandas canceladas)
  const totais = useMemo(() => {
    const colabId = String(usuario?.colaborador_id || '')

    // Excluir comandas canceladas dos calculos
    const comandasValidas = comandas.filter(c => c.status !== 'cancelada')

    const meusItens = comandasValidas.flatMap(c =>
      (c.itens || []).filter(i => String(i.colaborador_id) === colabId)
    )

    const totalBruto = meusItens.reduce((acc, item) => acc + (Number(item.valor_total) || 0), 0)
    const totalComissao = meusItens.reduce((acc, item) => acc + (Number(item.comissao_valor) || 0), 0)
    const totalServicos = meusItens.filter(i => i.tipo === 'servico').length
    const totalComandas = comandasValidas.length

    return {
      totalBruto,
      totalComissao,
      totalServicos,
      totalComandas,
    }
  }, [comandas, usuario?.colaborador_id])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.hash = '#/minhas-comandas'}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Relatorio de Comandas</h1>
            <p className="text-slate-500 mt-1">
              Consulte suas comandas por periodo
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Data Inicio
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Data Fim
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusComanda | '')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Todos</option>
              <option value="aberta">Aberta</option>
              <option value="em_atendimento">Em Atendimento</option>
              <option value="aguardando_pagamento">Aguardando Pagamento</option>
              <option value="paga">Paga</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={buscarComandas}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Totais */}
      {comandas.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totais.totalComandas}</p>
                <p className="text-sm text-slate-500">Comandas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totais.totalServicos}</p>
                <p className="text-sm text-slate-500">Servicos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totais.totalBruto)}</p>
                <p className="text-sm text-slate-500">Total Bruto</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totais.totalComissao)}</p>
                <p className="text-sm text-slate-500">Minha Comissao</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Comandas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-500" />
            Comandas Encontradas ({comandas.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Buscando comandas...</p>
          </div>
        ) : comandas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">Nenhuma comanda encontrada</p>
            <p className="text-sm mt-1">Selecione o periodo e clique em buscar</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {comandas.map((comanda) => {
              // Calcular total e comissao do colaborador nesta comanda
              const colabId = String(usuario?.colaborador_id || '')
              const meusItens = (comanda.itens || []).filter(
                i => String(i.colaborador_id) === colabId
              )
              const meuTotal = meusItens.reduce((acc, i) => acc + (Number(i.valor_total) || 0), 0)
              const minhaComissao = meusItens.reduce((acc, i) => acc + (Number(i.comissao_valor) || 0), 0)

              return (
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
                        {meusItens.length} {meusItens.length === 1 ? 'item meu' : 'itens meus'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(meuTotal)}</p>
                      <p className="text-sm text-emerald-600">+{formatCurrency(minhaComissao)}</p>
                      <p className="text-xs text-slate-400">
                        {formatters.dateTimeShortBR(comanda.data_abertura || comanda.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Rodape de Navegacao */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg lg:hidden">
        <div className="flex justify-around py-2">
          <button
            onClick={() => window.location.hash = '#/minhas-comandas'}
            className="flex flex-col items-center gap-1 px-4 py-2 text-slate-500"
          >
            <Home size={20} />
            <span className="text-xs font-medium">Inicio</span>
          </button>
          <button
            onClick={buscarComandas}
            className="flex flex-col items-center gap-1 px-4 py-2 text-teal-600"
          >
            <Search size={20} />
            <span className="text-xs font-medium">Buscar</span>
          </button>
        </div>
      </div>

      {/* Espacamento para o rodape mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
