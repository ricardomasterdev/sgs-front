import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, UserCog, Scissors, Filter, X } from 'lucide-react'
import { colaboradoresService } from '../../services/colaboradores.service'
import { cargosService } from '../../services/cargos.service'
import { Button, DataTable, Pagination, ConfirmModal } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'
import type { Colaborador } from '../../types'
import ColaboradorFormModal from '../../components/colaboradores/ColaboradorFormModal'
import ColaboradorServicosModal from '../../components/colaboradores/ColaboradorServicosModal'

export default function ColaboradoresListPage() {
  const queryClient = useQueryClient()
  const { salao, filial } = useAuthStore()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [cargoFilter, setCargoFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isServicosOpen, setIsServicosOpen] = useState(false)

  const { data: cargosData } = useQuery({
    queryKey: ['cargos-filter', salao?.id, filial?.id],
    queryFn: () => cargosService.list({ per_page: 100, ativo: true, filial_id: filial?.id }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['colaboradores', salao?.id, filial?.id, page, perPage, search, statusFilter, cargoFilter],
    queryFn: () => colaboradoresService.list({
      page,
      per_page: perPage,
      search: search || undefined,
      ativo: statusFilter === 'todos' ? undefined : statusFilter === 'ativo',
      cargo_id: cargoFilter || undefined,
      filial_id: filial?.id
    }),
  })

  const hasFilters = search || statusFilter !== 'todos' || cargoFilter
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('todos')
    setCargoFilter('')
    setPage(1)
  }

  const deleteMutation = useMutation({
    mutationFn: colaboradoresService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores', salao?.id, filial?.id] })
      toast.success('Colaborador desativado')
      setIsDeleteOpen(false)
    },
    onError: () => toast.error('Erro ao desativar colaborador'),
  })

  const columns = [
    {
      key: 'nome',
      header: 'Colaborador',
      render: (col: Colaborador) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
            <UserCog size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{col.nome}</p>
            <p className="text-sm text-slate-500">{col.cargo?.nome || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'whatsapp',
      header: 'WhatsApp',
      render: (col: Colaborador) => col.whatsapp || '-',
    },
    {
      key: 'servicos',
      header: 'Servicos',
      render: (col: Colaborador) => (
        <span className="text-sm text-slate-600">{col.servicos?.length || 0} servico(s)</span>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      render: (col: Colaborador) => (
        <span className={col.ativo ? 'badge-success' : 'badge-danger'}>
          {col.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      render: (col: Colaborador) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedColaborador(col); setIsServicosOpen(true); }}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-purple-50 text-slate-500 hover:text-purple-600"
            title="Gerenciar Servicos"
          >
            <Scissors size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedColaborador(col); setIsFormOpen(true); }}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedColaborador(col); setIsDeleteOpen(true); }}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
            title="Desativar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Colaboradores</h1>
          <p className="text-slate-500 text-sm sm:text-base">Gerencie os profissionais do salão</p>
        </div>
        <Button onClick={() => { setSelectedColaborador(null); setIsFormOpen(true); }} className="w-full sm:w-auto">
          <Plus size={18} />
          Novo Colaborador
        </Button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Busca */}
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Filter size={16} className="text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
            <select
              value={cargoFilter}
              onChange={(e) => { setCargoFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Todos os cargos</option>
              {cargosData?.items?.map(cargo => (
                <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>
              ))}
            </select>
          </div>

          {/* Limpar Filtros */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={16} /> Limpar filtros
            </button>
          )}
        </div>

        <DataTable columns={columns} data={data?.items || []} loading={isLoading} />

        {data && data.total > 0 && (
          <Pagination
            page={page}
            totalPages={data.pages}
            total={data.total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(p) => { setPerPage(p); setPage(1); }}
          />
        )}
      </div>

      <ColaboradorFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedColaborador(null); }}
        colaborador={selectedColaborador}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedColaborador(null); }}
        onConfirm={() => selectedColaborador && deleteMutation.mutate(selectedColaborador.id)}
        title="Desativar colaborador?"
        message={`Tem certeza que deseja desativar "${selectedColaborador?.nome}"?`}
        confirmText="Desativar"
        loading={deleteMutation.isPending}
      />

      <ColaboradorServicosModal
        isOpen={isServicosOpen}
        onClose={() => { setIsServicosOpen(false); setSelectedColaborador(null); }}
        colaborador={selectedColaborador}
      />
    </div>
  )
}
