import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Cake,
  Phone,
  Calendar,
  Gift,
  Filter,
  X,
  User,
} from 'lucide-react'

import { Button, DataTable, Badge } from '../../components/ui'
import { WhatsAppSendMessageModal, WhatsAppIcon } from '../../components/whatsapp'
import { aniversariantesService, Aniversariante } from '../../services/aniversariantes.service'
import { useAuthStore } from '../../stores/authStore'
import { masks } from '../../utils/masks'
import { cn } from '../../utils/cn'

// Botoes de acao
interface ActionButtonsProps {
  aniversariante: Aniversariante
  onWhatsAppClick: (aniversariante: Aniversariante) => void
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ aniversariante, onWhatsAppClick }) => {
  const hasWhatsApp = aniversariante.whatsapp || aniversariante.celular

  return (
    <div className="flex items-center gap-1">
      {/* WhatsApp */}
      {hasWhatsApp && (
        <button
          onClick={() => onWhatsAppClick(aniversariante)}
          className="p-2 rounded-lg text-[#25D366] hover:text-[#128C7E] hover:bg-green-50 transition-colors"
          title="Enviar WhatsApp"
        >
          <WhatsAppIcon className="w-5 h-5" />
        </button>
      )}

      {/* Telefone */}
      {(aniversariante.celular || aniversariante.whatsapp) && (
        <a
          href={`tel:${aniversariante.celular || aniversariante.whatsapp}`}
          className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          title="Ligar"
        >
          <Phone className="w-4 h-4" />
        </a>
      )}
    </div>
  )
}

// Formatar data para exibicao (dd/mm)
const formatarData = (dataStr: string): { dia: string; mes: string; diaNum: number; mesNum: number } => {
  const parts = dataStr.split('-')
  if (parts.length === 3) {
    const mesNum = parseInt(parts[1], 10)
    const diaNum = parseInt(parts[2], 10)
    return {
      dia: parts[2].padStart(2, '0'),
      mes: parts[1].padStart(2, '0'),
      diaNum,
      mesNum,
    }
  }
  const date = new Date(dataStr + 'T00:00:00')
  return {
    dia: String(date.getDate()).padStart(2, '0'),
    mes: String(date.getMonth() + 1).padStart(2, '0'),
    diaNum: date.getDate(),
    mesNum: date.getMonth() + 1,
  }
}

// Nome do mes
const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function AniversariantesListPage() {
  const salao = useAuthStore((state) => state.salao)
  const hoje = new Date()

  // Estado do filtro de datas
  const [filtroTipo, setFiltroTipo] = useState<'hoje' | 'semana' | 'mes' | 'periodo'>('hoje')
  const [dataInicio, setDataInicio] = useState<string>(hoje.toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState<string>(hoje.toISOString().split('T')[0])
  const [mesSelecionado, setMesSelecionado] = useState<number>(hoje.getMonth() + 1)
  const [showFilters, setShowFilters] = useState(false)

  // Estado do modal de WhatsApp
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false)
  const [selectedAniversariante, setSelectedAniversariante] = useState<Aniversariante | null>(null)

  // Handler para abrir modal de WhatsApp
  const handleWhatsAppClick = useCallback((aniversariante: Aniversariante) => {
    setSelectedAniversariante(aniversariante)
    setWhatsAppModalOpen(true)
  }, [])

  // Calcular datas baseado no filtro
  const getDatas = useCallback(() => {
    const now = new Date()

    switch (filtroTipo) {
      case 'hoje':
        const hojeStr = now.toISOString().split('T')[0]
        return { inicio: hojeStr, fim: hojeStr }

      case 'semana':
        const inicioSemana = new Date(now)
        const fimSemana = new Date(now)
        fimSemana.setDate(fimSemana.getDate() + 7)
        return {
          inicio: inicioSemana.toISOString().split('T')[0],
          fim: fimSemana.toISOString().split('T')[0],
        }

      case 'mes':
        const inicioMes = new Date(now.getFullYear(), mesSelecionado - 1, 1)
        const fimMes = new Date(now.getFullYear(), mesSelecionado, 0)
        return {
          inicio: inicioMes.toISOString().split('T')[0],
          fim: fimMes.toISOString().split('T')[0],
        }

      case 'periodo':
        return { inicio: dataInicio, fim: dataFim }

      default:
        return { inicio: now.toISOString().split('T')[0], fim: now.toISOString().split('T')[0] }
    }
  }, [filtroTipo, dataInicio, dataFim, mesSelecionado])

  const datas = getDatas()

  // Query para buscar aniversariantes
  const { data: aniversariantes = [], isLoading } = useQuery({
    queryKey: ['aniversariantes', salao?.id, filtroTipo, datas.inicio, datas.fim, mesSelecionado],
    queryFn: async () => {
      if (filtroTipo === 'hoje') {
        return aniversariantesService.listarHoje()
      } else if (filtroTipo === 'mes') {
        return aniversariantesService.listarPorMes(mesSelecionado)
      } else {
        return aniversariantesService.listarPorPeriodo(datas.inicio, datas.fim)
      }
    },
  })

  // Colunas da tabela
  const columns = [
    {
      key: 'nome',
      header: 'Nome',
      render: (pessoa: Aniversariante) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{pessoa.nome}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'dataNascimento',
      header: 'Data',
      width: '150px',
      align: 'center' as const,
      render: (pessoa: Aniversariante) => {
        if (!pessoa.data_nascimento) return '-'
        const { dia, mes, diaNum, mesNum } = formatarData(pessoa.data_nascimento)
        const isHoje =
          diaNum === hoje.getDate() &&
          mesNum === (hoje.getMonth() + 1)

        return (
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className={cn(
              'font-medium',
              isHoje ? 'text-pink-600' : 'text-slate-700'
            )}>
              {dia}/{mes}
            </span>
            {isHoje && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-xs font-medium">
                <Gift className="w-3 h-3" />
                Hoje!
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'idade',
      header: 'Idade',
      width: '100px',
      align: 'center' as const,
      render: (pessoa: Aniversariante) => (
        <Badge className="bg-slate-100 text-slate-700">
          {pessoa.idade} anos
        </Badge>
      ),
    },
    {
      key: 'contato',
      header: 'Contato',
      render: (pessoa: Aniversariante) => (
        <div className="space-y-1">
          {pessoa.celular && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Phone className="w-3 h-3" />
              {masks.phone(pessoa.celular)}
            </div>
          )}
          {pessoa.whatsapp && !pessoa.celular && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <WhatsAppIcon className="w-3 h-3" />
              {masks.phone(pessoa.whatsapp)}
            </div>
          )}
          {!pessoa.celular && !pessoa.whatsapp && (
            <span className="text-slate-400 text-sm">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (aniversariante: Aniversariante) => (
        <ActionButtons
          aniversariante={aniversariante}
          onWhatsAppClick={handleWhatsAppClick}
        />
      ),
    },
  ]

  // Titulo baseado no filtro
  const getTitulo = () => {
    switch (filtroTipo) {
      case 'hoje':
        return 'Aniversariantes de Hoje'
      case 'semana':
        return 'Aniversariantes da Semana'
      case 'mes':
        return `Aniversariantes de ${MESES[mesSelecionado - 1]}`
      case 'periodo':
        return 'Aniversariantes do Periodo'
      default:
        return 'Aniversariantes'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Cake className="w-6 h-6 text-pink-500" />
            <h1 className="page-title">Aniversariantes</h1>
          </div>
          <p className="text-slate-500 mt-1">
            {getTitulo()}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Filtrar por periodo</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Tipo de filtro */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'hoje', label: 'Hoje' },
                { value: 'semana', label: 'Proximos 7 dias' },
                { value: 'mes', label: 'Mes' },
                { value: 'periodo', label: 'Periodo personalizado' },
              ].map((opcao) => (
                <button
                  key={opcao.value}
                  onClick={() => setFiltroTipo(opcao.value as any)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    filtroTipo === opcao.value
                      ? 'bg-pink-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {opcao.label}
                </button>
              ))}
            </div>

            {/* Seletor de mes */}
            {filtroTipo === 'mes' && (
              <div className="flex flex-wrap gap-2">
                {MESES.map((mes, idx) => (
                  <button
                    key={mes}
                    onClick={() => setMesSelecionado(idx + 1)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      mesSelecionado === idx + 1
                        ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-500'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {mes.substring(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {/* Periodo personalizado */}
            {filtroTipo === 'periodo' && (
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data inicio
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data fim
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Cake className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{aniversariantes.length}</p>
              <p className="text-sm text-slate-500">
                {aniversariantes.length === 1 ? 'aniversariante' : 'aniversariantes'}
                {filtroTipo === 'hoje' && ' hoje'}
                {filtroTipo === 'semana' && ' nos proximos 7 dias'}
                {filtroTipo === 'mes' && ` em ${MESES[mesSelecionado - 1]}`}
              </p>
            </div>
          </div>
          {aniversariantes.length > 0 && (
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              <span className="text-sm text-slate-600">
                Envie seus parabens!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <DataTable
          columns={columns}
          data={aniversariantes}
          loading={isLoading}
          emptyMessage="Nenhum aniversariante encontrado"
        />
      </div>

      {/* Modal de WhatsApp */}
      {selectedAniversariante && (
        <WhatsAppSendMessageModal
          isOpen={whatsAppModalOpen}
          onClose={() => {
            setWhatsAppModalOpen(false)
            setSelectedAniversariante(null)
          }}
          cliente={{
            id: selectedAniversariante.id,
            nome: selectedAniversariante.nome,
            whatsapp: selectedAniversariante.whatsapp,
            celular: selectedAniversariante.celular,
          }}
        />
      )}
    </div>
  )
}
