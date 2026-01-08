import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Eye, Receipt, XCircle, Zap, FileText, Play, Printer, Pencil } from 'lucide-react'
import { comandasService } from '../../services/comandas.service'
import { Button, DataTable, Pagination, ConfirmModal } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import { formatters, masks } from '../../utils/masks'
import toast from 'react-hot-toast'
import type { Comanda, StatusComanda } from '../../types'
import { cn } from '../../utils/cn'
import NovaComandaRapidaModal from '../../components/comandas/NovaComandaRapidaModal'
import NovaComandaNormalModal from '../../components/comandas/NovaComandaNormalModal'
import ImprimirComandaModal from '../../components/comandas/ImprimirComandaModal'

const statusColors: Record<StatusComanda, string> = {
  aberta: 'bg-blue-100 text-blue-700',
  em_atendimento: 'bg-amber-100 text-amber-700',
  aguardando_pagamento: 'bg-purple-100 text-purple-700',
  paga: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}

const statusLabels: Record<StatusComanda, string> = {
  aberta: 'Aberta',
  em_atendimento: 'Em Atendimento',
  aguardando_pagamento: 'Aguardando Pgto',
  paga: 'Paga',
  cancelada: 'Cancelada',
}

export default function ComandasListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [statusFilter, setStatusFilter] = useState<StatusComanda | ''>('')
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null)
  const [isNovaRapidaOpen, setIsNovaRapidaOpen] = useState(false)
  const [isNovaNormalOpen, setIsNovaNormalOpen] = useState(false)
  const [isContinuarOpen, setIsContinuarOpen] = useState(false)
  const [comandaParaContinuar, setComandaParaContinuar] = useState<Comanda | null>(null)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [comandaParaImprimir, setComandaParaImprimir] = useState<Comanda | null>(null)
  const [isEditarOpen, setIsEditarOpen] = useState(false)
  const [comandaParaEditar, setComandaParaEditar] = useState<Comanda | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['comandas', salao?.id, page, perPage, statusFilter],
    queryFn: () => comandasService.list({ page, per_page: perPage, status_filter: statusFilter || undefined }),
  })

  const cancelMutation = useMutation({
    mutationFn: comandasService.cancelar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas', salao?.id] })
      toast.success('Comanda cancelada')
      setIsCancelOpen(false)
    },
    onError: () => toast.error('Erro ao cancelar comanda'),
  })

  const columns = [
    {
      key: 'numero',
      header: 'Comanda / Cliente',
      render: (c: Comanda) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <Receipt size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-primary-600">{c.nome_cliente || c.cliente?.nome || 'Cliente nao informado'}</p>
            <p className="text-xs text-slate-400">
              #{c.numero} • {c.data_abertura ? masks.dateTime(c.data_abertura) : '-'}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'total', header: 'Total', render: (c: Comanda) => <span className="font-semibold text-slate-800">{formatters.currency(c.total)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (c: Comanda) => (
        <span className={cn('badge', statusColors[c.status])}>{statusLabels[c.status]}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '220px',
      render: (c: Comanda) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/comandas/${c.id}`); }}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600"
            title="Ver detalhes"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setComandaParaEditar(c); setIsEditarOpen(true); }}
            className="p-2 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setComandaParaImprimir(c); setIsPrintOpen(true); }}
            className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600"
            title="Imprimir cupom"
          >
            <Printer size={16} />
          </button>
          {c.status !== 'paga' && c.status !== 'cancelada' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setComandaParaContinuar(c); setIsContinuarOpen(true); }}
                className="p-2 rounded-lg hover:bg-green-50 text-slate-500 hover:text-green-600"
                title="Continuar / Fechar"
              >
                <Play size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedComanda(c); setIsCancelOpen(true); }}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                title="Cancelar"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Comandas</h1><p className="text-slate-500">Gerencie os atendimentos</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsNovaNormalOpen(true)}><FileText size={18} />Comanda Normal</Button>
          <Button onClick={() => setIsNovaRapidaOpen(true)}><Zap size={18} />Comanda Rapida</Button>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as StatusComanda | ''); setPage(1); }} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white">
            <option value="">Todos os status</option>
            <option value="aberta">Aberta</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="aguardando_pagamento">Aguardando Pagamento</option>
            <option value="paga">Paga</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <DataTable columns={columns} data={data?.items || []} loading={isLoading} onRowClick={(c) => navigate(`/comandas/${c.id}`)} />
        {data && data.total > 0 && <Pagination page={page} totalPages={data.pages} total={data.total} perPage={perPage} onPageChange={setPage} onPerPageChange={(p) => { setPerPage(p); setPage(1); }} />}
      </div>
      <ConfirmModal isOpen={isCancelOpen} onClose={() => { setIsCancelOpen(false); setSelectedComanda(null) }} onConfirm={() => selectedComanda && cancelMutation.mutate(selectedComanda.id)} title="Cancelar comanda?" message={`Deseja cancelar a comanda #${selectedComanda?.numero}?`} confirmText="Cancelar Comanda" loading={cancelMutation.isPending} />

      <NovaComandaRapidaModal isOpen={isNovaRapidaOpen} onClose={() => setIsNovaRapidaOpen(false)} />
      <NovaComandaNormalModal isOpen={isNovaNormalOpen} onClose={() => setIsNovaNormalOpen(false)} />
      <NovaComandaNormalModal isOpen={isContinuarOpen} onClose={() => { setIsContinuarOpen(false); setComandaParaContinuar(null); }} comanda={comandaParaContinuar} />
      <NovaComandaNormalModal isOpen={isEditarOpen} onClose={() => { setIsEditarOpen(false); setComandaParaEditar(null); }} comanda={comandaParaEditar} modoEditar={true} />
      <ImprimirComandaModal isOpen={isPrintOpen} onClose={() => { setIsPrintOpen(false); setComandaParaImprimir(null); }} comanda={comandaParaImprimir} />
    </div>
  )
}
