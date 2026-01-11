import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, Briefcase, Filter, X } from 'lucide-react'
import { cargosService } from '../../services/cargos.service'
import { Button, DataTable, Pagination, ConfirmModal } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'
import type { Cargo } from '../../types'
import CargoFormModal from '../../components/cargos/CargoFormModal'

export default function CargosListPage() {
  const queryClient = useQueryClient()
  const { salao, filial } = useAuthStore()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['cargos', salao?.id, filial?.id, page, perPage, search, statusFilter],
    queryFn: () => cargosService.list({
      page,
      per_page: perPage,
      search: search || undefined,
      ativo: statusFilter === 'todos' ? undefined : statusFilter === 'ativo',
      filial_id: filial?.id
    }),
  })

  const hasFilters = search || statusFilter !== 'todos'
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('todos')
    setPage(1)
  }

  const deleteMutation = useMutation({
    mutationFn: cargosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos', salao?.id, filial?.id] })
      toast.success('Cargo desativado')
      setIsDeleteOpen(false)
    },
    onError: () => toast.error('Erro ao desativar cargo'),
  })

  const columns = [
    {
      key: 'nome',
      header: 'Cargo',
      render: (cargo: Cargo) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
            <Briefcase size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{cargo.nome}</p>
            <p className="text-sm text-slate-500">{cargo.descricao || '-'}</p>
          </div>
        </div>
      ),
    },
    { key: 'ordem', header: 'Ordem', render: (cargo: Cargo) => cargo.ordem },
    {
      key: 'ativo',
      header: 'Status',
      render: (cargo: Cargo) => (
        <span className={cargo.ativo ? 'badge-success' : 'badge-danger'}>{cargo.ativo ? 'Ativo' : 'Inativo'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (cargo: Cargo) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setSelectedCargo(cargo); setIsFormOpen(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600"><Edit size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); setSelectedCargo(cargo); setIsDeleteOpen(true); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Cargos</h1><p className="text-slate-500">Gerencie os cargos dos colaboradores</p></div>
        <Button onClick={() => { setSelectedCargo(null); setIsFormOpen(true); }}><Plus size={18} />Novo Cargo</Button>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar cargo..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          {/* Limpar Filtros */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={16} /> Limpar filtros
            </button>
          )}
        </div>
        <DataTable columns={columns} data={data?.items || []} loading={isLoading} />
        {data && data.total > 0 && <Pagination page={page} totalPages={data.pages} total={data.total} perPage={perPage} onPageChange={setPage} onPerPageChange={(p) => { setPerPage(p); setPage(1); }} />}
      </div>

      <CargoFormModal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedCargo(null); }} cargo={selectedCargo} />
      <ConfirmModal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setSelectedCargo(null); }} onConfirm={() => selectedCargo && deleteMutation.mutate(selectedCargo.id)} title="Desativar cargo?" message={`Tem certeza que deseja desativar "${selectedCargo?.nome}"?`} confirmText="Desativar" loading={deleteMutation.isPending} />
    </div>
  )
}
