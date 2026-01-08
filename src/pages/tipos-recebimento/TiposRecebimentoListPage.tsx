import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, CreditCard, ToggleLeft, ToggleRight, Filter, X } from 'lucide-react'
import { tiposRecebimentoService } from '../../services/tipos-recebimento.service'
import { Button, DataTable, Pagination, ConfirmModal, Modal, Input } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'
import type { TipoRecebimento } from '../../types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  taxa_percentual: z.number().min(0).max(100),
  dias_recebimento: z.number().min(0),
})

type FormData = z.infer<typeof schema>

export default function TiposRecebimentoListPage() {
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<TipoRecebimento | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isPermanentDelete, setIsPermanentDelete] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['tipos-recebimento', salao?.id, page, perPage, statusFilter],
    queryFn: () => tiposRecebimentoService.list({
      page,
      per_page: perPage,
      ativo: statusFilter === 'todos' ? undefined : statusFilter === 'ativo'
    }),
  })

  const hasFilters = search || statusFilter !== 'todos'
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('todos')
    setPage(1)
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { taxa_percentual: 0, dias_recebimento: 0 }
  })

  useEffect(() => {
    if (selectedTipo && isFormOpen) {
      reset({
        nome: selectedTipo.nome,
        descricao: selectedTipo.descricao || '',
        taxa_percentual: Number(selectedTipo.taxa_percentual),
        dias_recebimento: selectedTipo.dias_recebimento
      })
    } else if (!selectedTipo && isFormOpen) {
      reset({ nome: '', descricao: '', taxa_percentual: 0, dias_recebimento: 0 })
    }
  }, [selectedTipo, isFormOpen, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      selectedTipo
        ? tiposRecebimentoService.update(selectedTipo.id, data)
        : tiposRecebimentoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-recebimento', salao?.id] })
      toast.success(selectedTipo ? 'Forma de pagamento atualizada' : 'Forma de pagamento cadastrada')
      setIsFormOpen(false)
      setSelectedTipo(null)
    },
    onError: () => toast.error('Erro ao salvar'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) =>
      tiposRecebimentoService.delete(id, permanent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-recebimento', salao?.id] })
      toast.success(isPermanentDelete ? 'Forma de pagamento excluida permanentemente' : 'Forma de pagamento desativada')
      setIsDeleteOpen(false)
      setSelectedTipo(null)
      setIsPermanentDelete(false)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || (isPermanentDelete ? 'Erro ao excluir' : 'Erro ao desativar')
      toast.error(message)
    },
  })

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      tiposRecebimentoService.update(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-recebimento', salao?.id] })
      toast.success('Status atualizado')
    },
    onError: () => toast.error('Erro ao atualizar status'),
  })

  // Filtrar localmente pela busca
  const filteredItems = data?.items?.filter(item => {
    const matchSearch = item.nome.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  }) || []

  const columns = [
    {
      key: 'nome',
      header: 'Forma de Pagamento',
      render: (t: TipoRecebimento) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <CreditCard size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{t.nome}</p>
            {t.descricao && <p className="text-sm text-slate-500">{t.descricao}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'taxa_percentual',
      header: 'Taxa',
      render: (t: TipoRecebimento) => (
        <span className={Number(t.taxa_percentual) > 0 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
          {Number(t.taxa_percentual).toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'dias_recebimento',
      header: 'Prazo Recebimento',
      render: (t: TipoRecebimento) => (
        <span className={t.dias_recebimento > 0 ? 'text-blue-600' : 'text-green-600'}>
          {t.dias_recebimento === 0 ? 'Na hora' : `${t.dias_recebimento} dia(s)`}
        </span>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      render: (t: TipoRecebimento) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleAtivoMutation.mutate({ id: t.id, ativo: !t.ativo })
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            t.ativo
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {t.ativo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          {t.ativo ? 'Ativo' : 'Inativo'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (t: TipoRecebimento) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedTipo(t)
              setIsFormOpen(true)
            }}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          {t.ativo && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedTipo(t)
                setIsPermanentDelete(false)
                setIsDeleteOpen(true)
              }}
              className="p-2 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600"
              title="Desativar"
            >
              <ToggleLeft size={16} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Formas de Pagamento</h1>
          <p className="text-slate-500">Configure as formas de recebimento do salao</p>
        </div>
        <Button onClick={() => { setSelectedTipo(null); setIsFormOpen(true) }}>
          <Plus size={18} /> Nova Forma
        </Button>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar forma de pagamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
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

        <DataTable columns={columns} data={filteredItems} loading={isLoading} />

        {data && data.total > perPage && (
          <Pagination
            page={page}
            totalPages={data.pages}
            total={data.total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(p) => { setPerPage(p); setPage(1) }}
          />
        )}
      </div>

      {/* Modal de Formulario */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedTipo(null) }}
        title={selectedTipo ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
        size="md"
      >
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <Input
            label="Nome *"
            placeholder="Ex: Dinheiro, PIX, Cartao Credito..."
            {...register('nome')}
            error={errors.nome?.message}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descricao</label>
            <textarea
              {...register('descricao')}
              className="input-field h-20 resize-none"
              placeholder="Descricao opcional..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Taxa (%)"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('taxa_percentual', { valueAsNumber: true })}
              error={errors.taxa_percentual?.message}
            />
            <Input
              label="Dias para Receber"
              type="number"
              placeholder="0 = na hora"
              {...register('dias_recebimento', { valueAsNumber: true })}
              error={errors.dias_recebimento?.message}
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
            <p><strong>Taxa:</strong> Percentual descontado da operadora (ex: 3.5% cartao credito)</p>
            <p><strong>Dias:</strong> Prazo para receber o valor (0 = na hora, 30 = credito)</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => { setIsFormOpen(false); setSelectedTipo(null) }}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {selectedTipo ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmacao */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedTipo(null); setIsPermanentDelete(false) }}
        onConfirm={() => selectedTipo && deleteMutation.mutate({ id: selectedTipo.id, permanent: isPermanentDelete })}
        title={isPermanentDelete ? 'Excluir forma de pagamento?' : 'Desativar forma de pagamento?'}
        message={
          isPermanentDelete
            ? `Tem certeza que deseja EXCLUIR PERMANENTEMENTE "${selectedTipo?.nome}"? Esta acao nao pode ser desfeita. Se houver pagamentos vinculados, a exclusao sera bloqueada.`
            : `Tem certeza que deseja desativar "${selectedTipo?.nome}"? Esta forma de pagamento nao podera ser usada em novas comandas.`
        }
        confirmText={isPermanentDelete ? 'Excluir' : 'Desativar'}
        loading={deleteMutation.isPending}
        variant={isPermanentDelete ? 'danger' : 'warning'}
      />
    </div>
  )
}
