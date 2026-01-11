import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Power, PowerOff, User, Filter, X } from 'lucide-react'
import { clientesService } from '../../services/clientes.service'
import { Button, DataTable, Pagination, ConfirmModal } from '../../components/ui'
import { WhatsAppSendMessageModal, WhatsAppIcon } from '../../components/whatsapp'
import { useAuthStore } from '../../stores/authStore'
import { masks } from '../../utils/masks'
import toast from 'react-hot-toast'
import type { Cliente } from '../../types'
import ClienteFormModal from '../../components/clientes/ClienteFormModal'

export default function ClientesListPage() {
  const queryClient = useQueryClient()
  const { salao, filial } = useAuthStore()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false)
  const [whatsAppCliente, setWhatsAppCliente] = useState<Cliente | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', salao?.id, filial?.id, page, perPage, search, statusFilter],
    queryFn: () => clientesService.list({
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

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      clientesService.update(id, { ativo }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes', salao?.id, filial?.id] })
      toast.success(variables.ativo ? 'Cliente ativado com sucesso' : 'Cliente desativado com sucesso')
      setIsDeleteOpen(false)
      setSelectedCliente(null)
    },
    onError: () => toast.error('Erro ao alterar status do cliente'),
  })

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsFormOpen(true)
  }

  const handleToggleStatus = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsDeleteOpen(true)
  }

  const handleWhatsApp = (cliente: Cliente) => {
    setWhatsAppCliente(cliente)
    setIsWhatsAppOpen(true)
  }

  const columns = [
    {
      key: 'nome',
      header: 'Cliente',
      render: (cliente: Cliente) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{cliente.nome}</p>
            <p className="text-sm text-slate-500">{cliente.email || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'celular',
      header: 'Celular',
      render: (cliente: Cliente) => cliente.celular ? masks.phone(cliente.celular) : '-',
    },
    {
      key: 'cpf',
      header: 'CPF',
      render: (cliente: Cliente) => cliente.cpf ? masks.cpf(cliente.cpf) : '-',
    },
    {
      key: 'total_atendimentos',
      header: 'Atendimentos',
      align: 'center' as const,
    },
    {
      key: 'ativo',
      header: 'Status',
      render: (cliente: Cliente) => (
        <span className={cliente.ativo ? 'badge-success' : 'badge-danger'}>
          {cliente.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      render: (cliente: Cliente) => (
        <div className="flex items-center gap-1">
          {/* WhatsApp */}
          {(cliente.whatsapp || cliente.celular) && (
            <button
              onClick={(e) => { e.stopPropagation(); handleWhatsApp(cliente); }}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#25D366] hover:text-[#128C7E] hover:bg-green-50 transition-colors"
              title="Enviar WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </button>
          )}
          {/* Editar */}
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(cliente); }}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          {/* Ativar/Desativar */}
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(cliente); }}
            className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
              cliente.ativo
                ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                : 'text-green-500 hover:text-green-600 hover:bg-green-50'
            }`}
            title={cliente.ativo ? 'Desativar' : 'Ativar'}
          >
            {cliente.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Clientes</h1>
          <p className="text-slate-500 text-sm sm:text-base">Gerencie os clientes do salão</p>
        </div>
        <Button onClick={() => { setSelectedCliente(null); setIsFormOpen(true); }} className="w-full sm:w-auto">
          <Plus size={18} />
          Novo Cliente
        </Button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Busca */}
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou celular..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Filtro Status */}
          <div className="flex items-center gap-2">
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

        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          emptyMessage="Nenhum cliente encontrado"
        />

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

      <ClienteFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedCliente(null); }}
        cliente={selectedCliente}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedCliente(null); }}
        onConfirm={() => selectedCliente && toggleStatusMutation.mutate({
          id: selectedCliente.id,
          ativo: !selectedCliente.ativo
        })}
        title={selectedCliente?.ativo ? 'Desativar cliente?' : 'Ativar cliente?'}
        message={`Tem certeza que deseja ${selectedCliente?.ativo ? 'desativar' : 'ativar'} o cliente "${selectedCliente?.nome}"?`}
        confirmText={selectedCliente?.ativo ? 'Desativar' : 'Ativar'}
        loading={toggleStatusMutation.isPending}
      />

      {whatsAppCliente && (
        <WhatsAppSendMessageModal
          isOpen={isWhatsAppOpen}
          onClose={() => { setIsWhatsAppOpen(false); setWhatsAppCliente(null); }}
          cliente={{
            id: whatsAppCliente.id,
            nome: whatsAppCliente.nome,
            whatsapp: whatsAppCliente.whatsapp,
            celular: whatsAppCliente.celular,
          }}
        />
      )}
    </div>
  )
}
