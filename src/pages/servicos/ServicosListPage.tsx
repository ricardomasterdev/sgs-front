import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, Scissors, Filter, X } from 'lucide-react'
import { servicosService } from '../../services/servicos.service'
import { Button, DataTable, Pagination, ConfirmModal } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import { formatters } from '../../utils/masks'
import toast from 'react-hot-toast'
import type { Servico } from '../../types'
import ServicoFormModal from '../../components/servicos/ServicoFormModal'

export default function ServicosListPage() {
  const queryClient = useQueryClient()
  const { salao, filial } = useAuthStore()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['servicos', salao?.id, filial?.id, page, perPage, search, statusFilter, categoriaFilter],
    queryFn: () => servicosService.list({
      page,
      per_page: perPage,
      search: search || undefined,
      ativo: statusFilter === 'todos' ? undefined : statusFilter === 'ativo',
      categoria: categoriaFilter || undefined,
      filial_id: filial?.id
    }),
  })

  // Buscar todas as categorias unicas para o filtro
  const { data: allServicos } = useQuery({
    queryKey: ['servicos-categorias', salao?.id, filial?.id],
    queryFn: () => servicosService.list({ per_page: 500, filial_id: filial?.id }),
  })

  const categorias = useMemo(() => {
    const cats = new Set<string>()
    allServicos?.items?.forEach(s => { if (s.categoria) cats.add(s.categoria) })
    return Array.from(cats).sort()
  }, [allServicos])

  const hasFilters = search || statusFilter !== 'todos' || categoriaFilter
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('todos')
    setCategoriaFilter('')
    setPage(1)
  }

  const deleteMutation = useMutation({
    mutationFn: servicosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos', salao?.id, filial?.id] })
      toast.success('Serviço desativado')
      setIsDeleteOpen(false)
    },
    onError: () => toast.error('Erro ao desativar serviço'),
  })

  const columns = [
    {
      key: 'nome',
      header: 'Serviço',
      render: (srv: Servico) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <Scissors size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{srv.nome}</p>
            <p className="text-sm text-slate-500">{srv.categoria || '-'}</p>
          </div>
        </div>
      ),
    },
    { key: 'preco', header: 'Preço', render: (srv: Servico) => formatters.currency(srv.preco) },
    { key: 'duracao_minutos', header: 'Duração', render: (srv: Servico) => `${srv.duracao_minutos} min` },
    { key: 'comissao_percentual', header: 'Comissão', render: (srv: Servico) => `${srv.comissao_percentual}%` },
    {
      key: 'ativo',
      header: 'Status',
      render: (srv: Servico) => (
        <span className={srv.ativo ? 'badge-success' : 'badge-danger'}>{srv.ativo ? 'Ativo' : 'Inativo'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (srv: Servico) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setSelectedServico(srv); setIsFormOpen(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600"><Edit size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); setSelectedServico(srv); setIsDeleteOpen(true); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Serviços</h1><p className="text-slate-500">Gerencie os serviços oferecidos</p></div>
        <Button onClick={() => { setSelectedServico(null); setIsFormOpen(true); }}><Plus size={18} />Novo Serviço</Button>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar servico..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
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
            <select
              value={categoriaFilter}
              onChange={(e) => { setCategoriaFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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

      <ServicoFormModal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedServico(null); }} servico={selectedServico} />
      <ConfirmModal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setSelectedServico(null); }} onConfirm={() => selectedServico && deleteMutation.mutate(selectedServico.id)} title="Desativar serviço?" message={`Tem certeza que deseja desativar "${selectedServico?.nome}"?`} confirmText="Desativar" loading={deleteMutation.isPending} />
    </div>
  )
}
