import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Power, PowerOff, User, Shield, Store, Users, Search, Filter, X } from 'lucide-react'
import { usuariosService } from '../../services/usuarios.service'
import { Button, DataTable, Pagination, Badge, ConfirmModal } from '../../components/ui'
import { UsuarioFormModal } from '../../components/admin'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
import type { Usuario } from '../../types'

// Componente de Acoes (botoes visiveis)
interface ActionButtonsProps {
  usuario: Usuario
  onEdit: (usuario: Usuario) => void
  onToggleStatus: (usuario: Usuario) => void
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  usuario,
  onEdit,
  onToggleStatus,
}) => {
  const isAtivo = usuario.status === 'ativo'

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(usuario) }}
        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleStatus(usuario) }}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isAtivo
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
            : 'text-green-500 hover:text-green-600 hover:bg-green-50'
        )}
        title={isAtivo ? 'Desativar' : 'Ativar'}
      >
        {isAtivo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function AdminUsuariosListPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo' | 'bloqueado'>('todos')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [usuarioToToggle, setUsuarioToToggle] = useState<Usuario | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  // Query SEM dependencia de salao - lista todos os usuarios do sistema
  const { data, isLoading } = useQuery({
    queryKey: ['admin-usuarios', page, perPage, search, statusFilter],
    queryFn: () => usuariosService.list({
      page,
      per_page: perPage,
      search: search || undefined,
      status: statusFilter === 'todos' ? undefined : statusFilter
    }),
  })

  const hasFilters = search || statusFilter !== 'todos'
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('todos')
    setPage(1)
  }

  const toggleStatusMutation = useMutation({
    mutationFn: async (usuario: Usuario) => {
      const novoStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo'
      return usuariosService.update(usuario.id, { status: novoStatus } as any)
    },
    onSuccess: (_, usuario) => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      toast.success(
        usuario.status === 'ativo'
          ? `Usuario "${usuario.nome}" desativado`
          : `Usuario "${usuario.nome}" ativado`
      )
      setConfirmModalOpen(false)
      setUsuarioToToggle(null)
    },
    onError: () => {
      toast.error('Erro ao alterar status do usuario')
    },
  })

  const handleToggleStatus = (usuario: Usuario) => {
    setUsuarioToToggle(usuario)
    setConfirmModalOpen(true)
  }

  const handleConfirmToggle = () => {
    if (usuarioToToggle) {
      toggleStatusMutation.mutate(usuarioToToggle)
    }
  }

  const handleOpenNewModal = () => {
    setSelectedUsuario(null)
    setIsFormOpen(true)
  }

  const handleOpenEditModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setIsFormOpen(true)
  }

  const handleCloseFormModal = () => {
    setIsFormOpen(false)
    setSelectedUsuario(null)
    queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
  }

  const columns = [
    {
      key: 'nome',
      header: 'Usuario',
      render: (u: Usuario) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
            {u.nome.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">{u.nome}</p>
              {u.super_usuario && (
                <Shield className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'salao',
      header: 'Salao',
      render: (u: Usuario) => (
        <div>
          {u.salao_nome ? (
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <div>
                <p className="text-slate-700 font-medium">{u.salao_nome}</p>
              </div>
            </div>
          ) : (
            <span className="text-slate-400 text-sm">
              {u.super_usuario ? 'Todos' : 'Nao vinculado'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'perfil',
      header: 'Perfil',
      render: (u: Usuario) => (
        <div>
          {u.perfil_codigo ? (
            <Badge variant={u.perfil_codigo === 'admin' ? 'info' : 'default'}>
              {u.perfil_nome || u.perfil_codigo}
            </Badge>
          ) : u.super_usuario ? (
            <Badge variant="warning">Super Admin</Badge>
          ) : (
            <span className="text-slate-400 text-sm">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      align: 'center' as const,
      render: (u: Usuario) => {
        const statusConfig: Record<string, { variant: 'success' | 'default' | 'error'; label: string }> = {
          ativo: { variant: 'success', label: 'Ativo' },
          inativo: { variant: 'default', label: 'Inativo' },
          bloqueado: { variant: 'error', label: 'Bloqueado' },
        }
        const config = statusConfig[u.status || 'inativo'] || statusConfig.inativo
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (u: Usuario) => (
        <ActionButtons
          usuario={u}
          onEdit={handleOpenEditModal}
          onToggleStatus={handleToggleStatus}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-slate-900">Usuarios do Sistema</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Gerencie todos os usuarios cadastrados no sistema
          </p>
        </div>
        <Button onClick={handleOpenNewModal}>
          <Plus size={18} className="mr-2" />
          Novo Usuario
        </Button>
      </div>

      {/* Cards de estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-700">{data?.total || 0}</p>
              <p className="text-sm text-primary-600">Total de Usuarios</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {data?.items.filter(u => u.status === 'ativo').length || 0}
              </p>
              <p className="text-sm text-green-600">Usuarios Ativos</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">
                {data?.items.filter(u => u.super_usuario).length || 0}
              </p>
              <p className="text-sm text-amber-600">Super Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

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
              <option value="bloqueado">Bloqueados</option>
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={16} /> Limpar filtros
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          rowClassName={(usuario: Usuario) =>
            usuario.status !== 'ativo' ? 'bg-slate-50 opacity-75' : ''
          }
        />
        {data && data.total > 0 && (
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

      {/* Modal de formulario */}
      <UsuarioFormModal
        isOpen={isFormOpen}
        onClose={handleCloseFormModal}
        usuario={selectedUsuario}
      />

      {/* Modal de confirmacao */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setUsuarioToToggle(null) }}
        onConfirm={handleConfirmToggle}
        title={usuarioToToggle?.status === 'ativo' ? 'Desativar usuario?' : 'Ativar usuario?'}
        message={usuarioToToggle?.status === 'ativo'
          ? `Deseja desativar o usuario "${usuarioToToggle?.nome}"?`
          : `Deseja ativar o usuario "${usuarioToToggle?.nome}"?`
        }
        confirmText={usuarioToToggle?.status === 'ativo' ? 'Desativar' : 'Ativar'}
        loading={toggleStatusMutation.isPending}
      />
    </div>
  )
}
