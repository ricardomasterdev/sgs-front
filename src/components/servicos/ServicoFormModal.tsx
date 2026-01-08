import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { servicosService } from '../../services/servicos.service'
import { Modal, Button, Input } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'
import type { Servico } from '../../types'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  preco: z.number().min(0, 'Preço deve ser positivo'),
  duracao_minutos: z.number().min(1, 'Duração deve ser ao menos 1 minuto'),
  comissao_percentual: z.number().min(0).max(100),
})

type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  servico: Servico | null
}

export default function ServicoFormModal({ isOpen, onClose, servico }: Props) {
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)
  const isEditing = !!servico

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preco: 0, duracao_minutos: 60, comissao_percentual: 0 }
  })

  useEffect(() => {
    if (servico) {
      reset({
        nome: servico.nome,
        descricao: servico.descricao || '',
        categoria: servico.categoria || '',
        preco: servico.preco,
        duracao_minutos: servico.duracao_minutos,
        comissao_percentual: servico.comissao_percentual,
      })
    } else {
      reset({ preco: 0, duracao_minutos: 60, comissao_percentual: 0 })
    }
  }, [servico, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing ? servicosService.update(servico.id, data) : servicosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos', salao?.id] })
      toast.success(isEditing ? 'Serviço atualizado' : 'Serviço cadastrado')
      onClose()
    },
    onError: () => toast.error('Erro ao salvar serviço'),
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Serviço' : 'Novo Serviço'} size="md">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <Input label="Nome *" {...register('nome')} error={errors.nome?.message} />
        <Input label="Categoria" {...register('categoria')} placeholder="Ex: Cabelo, Unhas, Estética..." />
        <div className="grid grid-cols-3 gap-4">
          <Input label="Preço (R$) *" type="number" step="0.01" {...register('preco', { valueAsNumber: true })} error={errors.preco?.message} />
          <Input label="Duração (min) *" type="number" {...register('duracao_minutos', { valueAsNumber: true })} error={errors.duracao_minutos?.message} />
          <Input label="Comissão (%)" type="number" step="0.01" {...register('comissao_percentual', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
          <textarea {...register('descricao')} className="input-field h-24 resize-none" placeholder="Descrição do serviço..." />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>{isEditing ? 'Salvar' : 'Cadastrar'}</Button>
        </div>
      </form>
    </Modal>
  )
}
