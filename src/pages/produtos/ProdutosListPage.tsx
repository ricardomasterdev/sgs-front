import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, Package, Filter, X } from 'lucide-react'
import { produtosService } from '../../services/produtos.service'
import { Button, DataTable, Pagination, ConfirmModal } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import { formatters } from '../../utils/masks'
import toast from 'react-hot-toast'
import type { Produto } from '../../types'
import ProdutoFormModal from '../../components/produtos/ProdutoFormModal'

export default function ProdutosListPage() {
  const queryClient = useQueryClient()
  const { salao, filial } = useAuthStore()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['produtos', salao?.id, filial?.id, page, perPage, search, statusFilter, categoriaFilter],
    queryFn: () => produtosService.list({
      page,
      per_page: perPage,
      search: search || undefined,
      ativo: statusFilter === 'todos' ? undefined : statusFilter === 'ativo',
      categoria: categoriaFilter || undefined,
      filial_id: filial?.id
    }),
  })

  // Buscar todas as categorias unicas para o filtro
  const { data: allProdutos } = useQuery({
    queryKey: ['produtos-categorias', salao?.id, filial?.id],
    queryFn: () => produtosService.list({ per_page: 500, filial_id: filial?.id }),
  })

  const categorias = useMemo(() => {
    const cats = new Set<string>()
    allProdutos?.items?.forEach(p => { if (p.categoria) cats.add(p.categoria) })
    return Array.from(cats).sort()
  }, [allProdutos])

  const hasFilters = search || statusFilter !== 'todos' || categoriaFilter
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('todos')
    setCategoriaFilter('')
    setPage(1)
  }

  const deleteMutation = useMutation({
    mutationFn: produtosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos', salao?.id, filial?.id] })
      toast.success('Produto desativado')
      setIsDeleteOpen(false)
    },
    onError: () => toast.error('Erro ao desativar produto'),
  })

  const columns = [
    {
      key: 'nome',
      header: 'Produto',
      render: (prod: Produto) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <Package size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{prod.nome}</p>
            <p className="text-sm text-slate-500">{prod.codigo || '-'}</p>
          </div>
        </div>
      ),
    },
    { key: 'categoria', header: 'Categoria' },
    { key: 'marca', header: 'Marca' },
    { key: 'preco_venda', header: 'Preço', render: (prod: Produto) => formatters.currency(prod.preco_venda) },
    { key: 'estoque_atual', header: 'Estoque', render: (prod: Produto) => `${prod.estoque_atual} ${prod.unidade_medida}` },
    {
      key: 'ativo',
      header: 'Status',
      render: (prod: Produto) => (<span className={prod.ativo ? 'badge-success' : 'badge-danger'}>{prod.ativo ? 'Ativo' : 'Inativo'}</span>),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (prod: Produto) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setSelectedProduto(prod); setIsFormOpen(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600"><Edit size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); setSelectedProduto(prod); setIsDeleteOpen(true); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Produtos</h1><p className="text-slate-500">Gerencie os produtos do salão</p></div>
        <Button onClick={() => { setSelectedProduto(null); setIsFormOpen(true); }}><Plus size={18} />Novo Produto</Button>
      </div>
      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
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
      <ProdutoFormModal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedProduto(null); }} produto={selectedProduto} />
      <ConfirmModal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setSelectedProduto(null); }} onConfirm={() => selectedProduto && deleteMutation.mutate(selectedProduto.id)} title="Desativar produto?" message={`Tem certeza que deseja desativar "${selectedProduto?.nome}"?`} confirmText="Desativar" loading={deleteMutation.isPending} />
    </div>
  )
}
