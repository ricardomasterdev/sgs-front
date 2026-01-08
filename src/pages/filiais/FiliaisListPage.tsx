import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Power, PowerOff, Building2, MapPin } from 'lucide-react'
import { filiaisService } from '../../services/filiais.service'
import { useAuthStore } from '../../stores/authStore'
import { Button, DataTable, Pagination, ConfirmModal, Modal, Input, Badge } from '../../components/ui'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
import type { Filial, SalaoSimples } from '../../types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  telefone_contato: z.string().optional(),
  whatsapp: z.string().optional(),
  email_contato: z.string().email('Email invalido').optional().or(z.literal('')),
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
  filial: Filial
  onEdit: (filial: Filial) => void
  onToggleStatus: (filial: Filial) => void
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ filial, onEdit, onToggleStatus }) => {
  const isAtivo = filial.ativo

  return (
    <div className="flex items-center gap-1">
      {/* Editar */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(filial) }}
        className="p-2 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Editar"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Ativar/Desativar */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleStatus(filial) }}
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

export default function FiliaisListPage() {
  const queryClient = useQueryClient()
  const { setFiliais, salao } = useAuthStore()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedFilial, setSelectedFilial] = useState<Filial | null>(null)
  const [filialToToggle, setFilialToToggle] = useState<Filial | null>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['filiais', salao?.id, page, perPage],
    queryFn: () => filiaisService.list({ page, per_page: perPage }),
  })

  // Atualiza lista de filiais no authStore (para o header)
  const refreshFiliaisList = useCallback(async () => {
    try {
      // Busca todas as filiais ativas para o header
      const response = await filiaisService.list({ per_page: 100, ativo: true })
      const filiaisList: SalaoSimples[] = response.items.map(f => ({
        id: f.id,
        codigo: f.codigo || '',
        nome: f.nome,
        is_filial: true
      }))
      setFiliais(filiaisList)
    } catch (error) {
      console.error('Erro ao atualizar lista de filiais:', error)
    }
  }, [setFiliais])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (selectedFilial && isFormOpen) {
      reset({
        nome: selectedFilial.nome,
        telefone_contato: selectedFilial.telefone_contato || '',
        whatsapp: selectedFilial.whatsapp || '',
        email_contato: selectedFilial.email_contato || '',
        cep: selectedFilial.cep || '',
        logradouro: selectedFilial.logradouro || '',
        numero: selectedFilial.numero || '',
        complemento: selectedFilial.complemento || '',
        bairro: selectedFilial.bairro || '',
        cidade: selectedFilial.cidade || '',
        uf: selectedFilial.uf || '',
      })
    } else if (!selectedFilial && isFormOpen) {
      reset({
        nome: '', telefone_contato: '', whatsapp: '', email_contato: '',
        cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: ''
      })
    }
  }, [selectedFilial, isFormOpen, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => selectedFilial ? filiaisService.update(selectedFilial.id, data) : filiaisService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['filiais', salao?.id] })
      await refreshFiliaisList()
      toast.success(selectedFilial ? 'Filial atualizada' : 'Filial cadastrada')
      setIsFormOpen(false)
      setSelectedFilial(null)
    },
    onError: () => toast.error('Erro ao salvar filial'),
  })

  // Mutation para ativar/desativar
  const toggleStatusMutation = useMutation({
    mutationFn: async (filial: Filial) => {
      if (filial.ativo) {
        return filiaisService.desativar(filial.id)
      } else {
        return filiaisService.ativar(filial.id)
      }
    },
    onSuccess: async (_, filial) => {
      await queryClient.invalidateQueries({ queryKey: ['filiais', salao?.id] })
      await refreshFiliaisList()
      toast.success(
        filial.ativo
          ? `Filial "${filial.nome}" desativada`
          : `Filial "${filial.nome}" ativada`
      )
      setConfirmModalOpen(false)
      setFilialToToggle(null)
    },
    onError: () => {
      toast.error('Erro ao alterar status')
    },
  })

  const handleToggleStatus = (filial: Filial) => {
    setFilialToToggle(filial)
    setConfirmModalOpen(true)
  }

  const handleConfirmToggle = () => {
    if (filialToToggle) {
      toggleStatusMutation.mutate(filialToToggle)
    }
  }

  const columns = [
    {
      key: 'nome',
      header: 'Filial',
      render: (f: Filial) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{f.nome}</p>
            {f.codigo && <p className="text-sm text-slate-500">{f.codigo}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'endereco',
      header: 'Endereco',
      render: (f: Filial) => {
        const parts = [f.logradouro, f.numero, f.bairro, f.cidade].filter(Boolean)
        return parts.length > 0 ? (
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <MapPin size={12} />
            <span className="truncate max-w-[200px]">{parts.join(', ')}</span>
          </div>
        ) : '-'
      }
    },
    { key: 'contato', header: 'Contato', render: (f: Filial) => f.telefone_contato || f.whatsapp || '-' },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      align: 'center' as const,
      render: (f: Filial) => (
        <Badge variant={f.ativo ? 'success' : 'default'}>
          {f.ativo ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (f: Filial) => (
        <ActionButtons
          filial={f}
          onEdit={(filial) => { setSelectedFilial(filial); setIsFormOpen(true) }}
          onToggleStatus={handleToggleStatus}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Filiais</h1>
          <p className="text-slate-500">Gerencie as filiais do salao</p>
        </div>
        <Button onClick={() => { setSelectedFilial(null); setIsFormOpen(true) }}><Plus size={18} />Nova Filial</Button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          rowClassName={(filial) => !filial.ativo ? 'bg-slate-50 opacity-75' : ''}
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

      <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setSelectedFilial(null) }} title={selectedFilial ? 'Editar Filial' : 'Nova Filial'} size="lg">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {selectedFilial?.codigo && (
            <div className="bg-slate-50 rounded-lg p-3 mb-2">
              <p className="text-xs text-slate-500">Codigo da Filial</p>
              <p className="text-sm font-semibold text-slate-800">{selectedFilial.codigo}</p>
            </div>
          )}
          <Input label="Nome *" {...register('nome')} error={errors.nome?.message} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Telefone" {...register('telefone_contato')} />
            <Input label="WhatsApp" {...register('whatsapp')} />
            <Input label="Email" type="email" {...register('email_contato')} error={errors.email_contato?.message} />
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
            <Button type="button" variant="secondary" onClick={() => { setIsFormOpen(false); setSelectedFilial(null) }}>Cancelar</Button>
            <Button type="submit" loading={mutation.isPending}>{selectedFilial ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setFilialToToggle(null) }}
        onConfirm={handleConfirmToggle}
        title={filialToToggle?.ativo ? 'Desativar filial?' : 'Ativar filial?'}
        message={filialToToggle?.ativo
          ? `Deseja desativar a filial "${filialToToggle?.nome}"? Todos os dados serao preservados.`
          : `Deseja ativar a filial "${filialToToggle?.nome}"?`
        }
        confirmText={filialToToggle?.ativo ? 'Desativar' : 'Ativar'}
        loading={toggleStatusMutation.isPending}
      />
    </div>
  )
}
