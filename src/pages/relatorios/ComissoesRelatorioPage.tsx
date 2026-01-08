import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  Calendar,
  User,
  FileText,
  Filter,
  Receipt,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { relatoriosService, type ComissaoItem } from '../../services/relatorios.service'
import { colaboradoresService } from '../../services/colaboradores.service'
import { DataTable, Badge, Input } from '../../components/ui'
import { formatters, masks } from '../../utils/masks'
import { cn } from '../../utils/cn'
import ComandaDetalheModal from '../../components/comandas/ComandaDetalheModal'

// Atalhos de periodo
const PERIODO_ATALHOS = [
  { label: 'Hoje', dias: 0 },
  { label: '7 dias', dias: 7 },
  { label: '15 dias', dias: 15 },
  { label: '30 dias', dias: 30 },
  { label: 'Este Mes', tipo: 'mes' as const },
]

// Converte data BR para ISO (DD/MM/YYYY -> YYYY-MM-DD)
function parseDataBR(dataBR: string): string {
  if (!dataBR || dataBR.length !== 10) return ''
  const [day, month, year] = dataBR.split('/')
  if (!day || !month || !year) return ''
  return `${year}-${month}-${day}`
}

export default function ComissoesRelatorioPage() {
  const salao = useAuthStore((state) => state.salao)
  const hoje = useMemo(() => new Date(), [])

  // Estado do modal de detalhe da comanda
  const [comandaDetalheId, setComandaDetalheId] = useState<string | null>(null)

  // Estados dos filtros (formato BR para exibição) - default ultimos 7 dias
  const [colaboradorId, setColaboradorId] = useState<string>('')
  const [dataInicioBR, setDataInicioBR] = useState<string>(() => {
    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - 7)
    const day = String(inicio.getDate()).padStart(2, '0')
    const month = String(inicio.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}/${inicio.getFullYear()}`
  })
  const [dataFimBR, setDataFimBR] = useState<string>(() => {
    const day = String(hoje.getDate()).padStart(2, '0')
    const month = String(hoje.getMonth() + 1).padStart(2, '0')
    return `${day}/${month}/${hoje.getFullYear()}`
  })

  // Converte para ISO para a API
  const dataInicioISO = parseDataBR(dataInicioBR)
  const dataFimISO = parseDataBR(dataFimBR)

  // Aplicar atalho de periodo
  const aplicarAtalho = (atalho: typeof PERIODO_ATALHOS[0]) => {
    const now = new Date()
    let inicio: Date

    if (atalho.tipo === 'mes') {
      inicio = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      inicio = new Date(now)
      inicio.setDate(now.getDate() - (atalho.dias || 0))
    }

    const dayInicio = String(inicio.getDate()).padStart(2, '0')
    const monthInicio = String(inicio.getMonth() + 1).padStart(2, '0')
    setDataInicioBR(`${dayInicio}/${monthInicio}/${inicio.getFullYear()}`)

    const dayFim = String(now.getDate()).padStart(2, '0')
    const monthFim = String(now.getMonth() + 1).padStart(2, '0')
    setDataFimBR(`${dayFim}/${monthFim}/${now.getFullYear()}`)
  }

  // Handler para formatação da data
  const handleDataInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataInicioBR(masks.dateBR(e.target.value))
  }

  const handleDataFimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataFimBR(masks.dateBR(e.target.value))
  }

  // Busca colaboradores para o filtro
  const { data: colaboradoresData } = useQuery({
    queryKey: ['colaboradores-comissao', salao?.id],
    queryFn: () => colaboradoresService.list({ per_page: 100, ativo: true }),
    enabled: !!salao?.id,
  })

  const colaboradores = colaboradoresData?.items || []

  // Busca dados do relatorio
  const { data: relatorio, isLoading, isError } = useQuery({
    queryKey: ['relatorio-comissoes', salao?.id, colaboradorId, dataInicioISO, dataFimISO],
    queryFn: () => relatoriosService.comissoes({
      colaborador_id: colaboradorId || undefined,
      data_inicio: dataInicioISO,
      data_fim: dataFimISO,
    }),
    enabled: !!salao?.id && !!dataInicioISO && !!dataFimISO,
  })

  // Colunas da tabela
  const columns = [
    {
      key: 'comanda_data',
      header: 'Data',
      width: '90px',
      render: (item: ComissaoItem) => (
        <span className="text-sm text-slate-600 whitespace-nowrap">
          {masks.dateFromISO(item.comanda_data)}
        </span>
      ),
    },
    {
      key: 'comanda_numero',
      header: 'Comanda',
      width: '90px',
      render: (item: ComissaoItem) => (
        <button
          onClick={() => setComandaDetalheId(item.comanda_id)}
          className="text-sm font-semibold text-primary-600 hover:text-primary-800 hover:underline transition-colors"
        >
          #{item.comanda_numero}
        </button>
      ),
    },
    {
      key: 'cliente_nome',
      header: 'Cliente',
      render: (item: ComissaoItem) => (
        <span className="text-sm text-slate-800">
          {item.cliente_nome || 'Nao informado'}
        </span>
      ),
    },
    {
      key: 'colaborador_nome',
      header: 'Profissional',
      render: (item: ComissaoItem) => (
        <span className="text-sm text-slate-700 font-medium">{item.colaborador_nome}</span>
      ),
    },
    {
      key: 'descricao',
      header: 'Descricao',
      render: (item: ComissaoItem) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">{item.descricao}</span>
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded',
            item.tipo === 'servico' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
          )}>
            {item.tipo === 'servico' ? 'S' : 'P'}
          </span>
        </div>
      ),
    },
    {
      key: 'valor_total',
      header: 'Valor',
      width: '100px',
      align: 'right' as const,
      render: (item: ComissaoItem) => (
        <span className="text-sm text-slate-800">
          {formatters.currency(item.valor_total)}
        </span>
      ),
    },
    {
      key: 'comissao_percentual',
      header: '%',
      width: '60px',
      align: 'center' as const,
      render: (item: ComissaoItem) => (
        <span className="text-sm text-slate-500">
          {item.comissao_percentual}%
        </span>
      ),
    },
    {
      key: 'comissao_valor',
      header: 'Comissao',
      width: '110px',
      align: 'right' as const,
      render: (item: ComissaoItem) => (
        <span className="text-sm font-bold text-green-600">
          {formatters.currency(item.comissao_valor)}
        </span>
      ),
    },
  ]

  const colaboradorSelecionado = colaboradores.find(c => c.id === colaboradorId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Relatorio de Comissoes</h1>
        <p className="text-slate-500">Apuracao de comissoes por profissional e periodo</p>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-primary-500" />
          <h3 className="font-semibold text-slate-700">Filtros</h3>
        </div>

        {/* Atalhos de Periodo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-600 mb-2">Atalhos de Periodo</label>
          <div className="flex flex-wrap gap-2">
            {PERIODO_ATALHOS.map((atalho, idx) => (
              <button
                key={idx}
                onClick={() => aplicarAtalho(atalho)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-primary-100 hover:text-primary-700 transition-colors"
              >
                {atalho.label}
              </button>
            ))}
          </div>
        </div>

        {/* Linha de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {/* Data Inicio */}
          <div>
            <Input
              label="Data Inicio"
              placeholder="DD/MM/AAAA"
              value={dataInicioBR}
              onChange={handleDataInicioChange}
              maxLength={10}
            />
          </div>

          {/* Data Fim */}
          <div>
            <Input
              label="Data Fim"
              placeholder="DD/MM/AAAA"
              value={dataFimBR}
              onChange={handleDataFimChange}
              maxLength={10}
            />
          </div>

          {/* Profissional */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-2">Profissional</label>
            <div className="relative">
              <select
                value={colaboradorId}
                onChange={(e) => setColaboradorId(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white text-slate-700 text-sm"
              >
                <option value="">Todos os profissionais</option>
                {colaboradores.map((colab) => (
                  <option key={colab.id} value={colab.id}>
                    {colab.nome} {colab.cargo?.nome ? `- ${colab.cargo.nome}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Periodo</p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {dataInicioBR} - {dataFimBR}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Profissional</p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {colaboradorSelecionado?.nome || 'Todos'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Receipt size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Servicos</p>
              <p className="text-sm font-bold text-slate-800">
                {formatters.currency(relatorio?.total_valor || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-green-600 uppercase tracking-wide">Total Comissoes</p>
              <p className="text-lg font-bold text-green-700">
                {formatters.currency(relatorio?.total_comissao || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary-500" />
            <h3 className="font-semibold text-slate-700">Detalhamento</h3>
            <Badge variant="default" size="sm">{relatorio?.total_itens || 0} itens</Badge>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={relatorio?.itens || []}
          loading={isLoading}
          emptyMessage="Nenhuma comissao encontrada no periodo selecionado"
          keyExtractor={(item) => item.id}
        />

        {/* Footer com totais */}
        {relatorio && relatorio.itens.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
              <div className="flex items-center justify-between sm:justify-start gap-8 px-4 py-3 bg-slate-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase">Itens</p>
                  <p className="text-lg font-bold text-slate-700">{relatorio.total_itens}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase">Valor Total</p>
                  <p className="text-lg font-bold text-slate-700">{formatters.currency(relatorio.total_valor)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4 px-6 py-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-xs text-green-600 uppercase">Total Comissoes</p>
                  <p className="text-2xl font-bold text-green-700">{formatters.currency(relatorio.total_comissao)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mensagem de erro */}
      {isError && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-red-700">Erro ao carregar relatorio</p>
              <p className="text-sm text-red-600">Verifique sua conexao e tente novamente</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhe da Comanda */}
      <ComandaDetalheModal
        isOpen={!!comandaDetalheId}
        onClose={() => setComandaDetalheId(null)}
        comandaId={comandaDetalheId}
      />
    </div>
  )
}
