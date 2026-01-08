import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Power, PowerOff, Store, Building2, Users } from 'lucide-react'
import { saloesService } from '../../services/saloes.service'
import { useAuthStore } from '../../stores/authStore'
import { Button, DataTable, Pagination, ConfirmModal, Modal, Input, Badge } from '../../components/ui'
import { masks } from '../../utils/masks'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
import type { Salao, SalaoSimples } from '../../types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  razao_social: z.string().optional(),
  cnpj: z.string().optional(),
  nome_proprietario: z.string().optional(),
  email_contato: z.string().email('Email invalido').optional().or(z.literal('')),
  telefone_contato: z.string().optional(),
  whatsapp: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// Componente de botoes de acao - padrao GPVx
interface ActionButtonsProps {
  salao: Salao
  onEdit: (salao: Salao) => void
  onToggleStatus: (salao: Salao) => void
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ salao, onEdit, onToggleStatus }) => {
  const isAtivo = salao.ativo

  return (
    <div className="flex items-center gap-1">
      {/* Editar */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(salao) }}
        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Ativar/Desativar */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStatus(salao) }}
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

export default function SaloesListPage() {
  const queryClient = useQueryClient()
  const { setSaloes } = useAuthStore()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSalao, setSelectedSalao] = useState<Salao | null>(null)
  const [salaoToToggle, setSalaoToToggle] = useState<Salao | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['admin-saloes', page, perPage],
    queryFn: () => saloesService.list({ page, per_page: perPage }),
    staleTime: 30000, // 30 segundos para evitar refetch excessivo
    retry: 1,
  })

  // Log de erro para debug
  if (isError) {
    console.error('Erro ao carregar saloes:', error)
  }

  // Atualiza lista de saloes no authStore (para o header)
  const refreshSaloesList = useCallback(async () => {
    try {
      // Busca todos os saloes ativos para o header
      const response = await saloesService.list({ per_page: 100, ativo: true })
      const saloesList: SalaoSimples[] = response.items.map(s => ({
        id: s.id,
        codigo: s.codigo || '',
        nome: s.nome,
        is_filial: false
      }))
      setSaloes(saloesList)
    } catch (error) {
      console.error('Erro ao atualizar lista de saloes:', error)
    }
  }, [setSaloes])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (selectedSalao && isFormOpen) {
      reset({
        nome: selectedSalao.nome,
        razao_social: selectedSalao.razao_social || '',
        cnpj: selectedSalao.cnpj || '',
        nome_proprietario: selectedSalao.nome_proprietario || '',
        email_contato: selectedSalao.email_contato || '',
        telefone_contato: selectedSalao.telefone_contato || '',
        whatsapp: selectedSalao.whatsapp || '',
        cep: selectedSalao.cep || '',
        logradouro: selectedSalao.logradouro || '',
        numero: selectedSalao.numero || '',
        complemento: selectedSalao.complemento || '',
        bairro: selectedSalao.bairro || '',
        cidade: selectedSalao.cidade || '',
        uf: selectedSalao.uf || '',
      })
    } else if (!selectedSalao && isFormOpen) {
      reset({
        nome: '', razao_social: '', cnpj: '', nome_proprietario: '',
        email_contato: '', telefone_contato: '', whatsapp: '',
        cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: ''
      })
    }
  }, [selectedSalao, isFormOpen, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => selectedSalao ? saloesService.update(selectedSalao.id, data) : saloesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-saloes'] })
      await refreshSaloesList()
      toast.success(selectedSalao ? 'Salao atualizado' : 'Salao cadastrado')
      setIsFormOpen(false)
      setSelectedSalao(null)
    },
    onError: () => toast.error('Erro ao salvar salao'),
  })

  // Mutation para ativar/desativar
  const toggleStatusMutation = useMutation({
    mutationFn: async (salao: Salao) => {
      if (salao.ativo) {
        return saloesService.desativar(salao.id)
      } else {
        return saloesService.ativar(salao.id)
      }
    },
    onSuccess: async (_, salao) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-saloes'] })
      await refreshSaloesList()
      toast.success(
        salao.ativo
          ? `Salao "${salao.nome}" desativado`
          : `Salao "${salao.nome}" ativado`
      )
      setConfirmModalOpen(false)
      setSalaoToToggle(null)
    },
    onError: () => {
      toast.error('Erro ao alterar status')
    },
  })

  const handleToggleStatus = (salao: Salao) => {
    setSalaoToToggle(salao)
    setConfirmModalOpen(true)
  }

  const handleConfirmToggle = () => {
    if (salaoToToggle) {
      toggleStatusMutation.mutate(salaoToToggle)
    }
  }

  const columns = [
    {
      key: 'nome',
      header: 'Salao',
      render: (s: Salao) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-600 rounded-full flex items-center justify-center">
            <Store size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{s.nome}</p>
            <p className="text-sm text-slate-500">{s.codigo}</p>
          </div>
        </div>
      ),
    },
    { key: 'cnpj', header: 'CNPJ', render: (s: Salao) => s.cnpj || '-' },
    { key: 'telefone', header: 'Contato', render: (s: Salao) => s.telefone_contato || s.whatsapp || '-' },
    {
      key: 'created_at',
      header: 'Criado em',
      render: (s: Salao) => s.created_at ? masks.date(s.created_at) : '-',
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      align: 'center' as const,
      render: (s: Salao) => (
        <Badge variant={s.ativo ? 'success' : 'default'}>
          {s.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (s: Salao) => (
        <ActionButtons
          salao={s}
          onEdit={(salao) => { setSelectedSalao(salao); setIsFormOpen(true) }}
          onToggleStatus={handleToggleStatus}
        />
      ),
    },
  ]

  // Tela de erro
  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Saloes</h1>
          <p className="text-slate-500">Gerencie os saloes do sistema (Super Admin)</p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <Store size={24} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-red-700">Erro ao carregar saloes</p>
              <p className="text-sm text-red-600">Verifique sua conexao e tente novamente</p>
            </div>
          </div>
          <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-saloes'] })}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Saloes</h1>
          <p className="text-slate-500">Gerencie os saloes do sistema (Super Admin)</p>
        </div>
        <Button onClick={() => { setSelectedSalao(null); setIsFormOpen(true) }}><Plus size={18} />Novo Salao</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <Store size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-700">{data?.total || 0}</p>
              <p className="text-sm text-primary-600">Saloes Cadastrados</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{data?.items.filter(s => s.ativo).length || 0}</p>
              <p className="text-sm text-green-600">Saloes Ativos</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-500 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-700">-</p>
              <p className="text-sm text-secondary-600">Total de Usuarios</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          rowClassName={(salao) => !salao.ativo ? 'bg-slate-50 opacity-75' : ''}
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

      <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedSalao(null) }} title={selectedSalao ? 'Editar Salao' : 'Novo Salao'} size="lg">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {selectedSalao && (
            <div className="bg-slate-50 rounded-lg p-3 mb-2">
              <p className="text-xs text-slate-500">Codigo do Salao</p>
              <p className="text-sm font-semibold text-slate-800">{selectedSalao.codigo}</p>
            </div>
          )}
          <Input label="Nome *" {...register('nome')} error={errors.nome?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Razao Social" {...register('razao_social')} />
            <Input label="CNPJ" {...register('cnpj')} placeholder="00.000.000/0000-00" />
          </div>
          <Input label="Nome Proprietario" {...register('nome_proprietario')} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Email Contato" type="email" {...register('email_contato')} error={errors.email_contato?.message} />
            <Input label="Telefone" {...register('telefone_contato')} />
            <Input label="WhatsApp" {...register('whatsapp')} />
          </div>
          <div className="border-t border-slate-100 pt-4 mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Endereco</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input label="CEP" {...register('cep')} placeholder="00000-000" />
              <div className="col-span-2">
                <Input label="Logradouro" {...register('logradouro')} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-3">
              <Input label="Numero" {...register('numero')} />
              <Input label="Complemento" {...register('complemento')} />
              <Input label="Bairro" {...register('bairro')} />
              <Input label="UF" {...register('uf')} maxLength={2} />
            </div>
            <div className="mt-3">
              <Input label="Cidade" {...register('cidade')} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => { setIsFormOpen(false); setSelectedSalao(null) }}>Cancelar</Button>
            <Button type="submit" loading={mutation.isPending}>{selectedSalao ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setSalaoToToggle(null) }}
        onConfirm={handleConfirmToggle}
        title={salaoToToggle?.ativo ? 'Desativar salao?' : 'Ativar salao?'}
        message={salaoToToggle?.ativo
          ? `Deseja desativar o salao "${salaoToToggle?.nome}"? Todos os dados serao preservados.`
          : `Deseja ativar o salao "${salaoToToggle?.nome}"?`
        }
        confirmText={salaoToToggle?.ativo ? 'Desativar' : 'Ativar'}
        loading={toggleStatusMutation.isPending}
      />
    </div>
  )
}
