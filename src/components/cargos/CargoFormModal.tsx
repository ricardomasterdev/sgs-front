import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cargosService } from '../../services/cargos.service'
import { Modal, Button, Input } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'
import type { Cargo } from '../../types'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  descricao: z.string().optional(),
  ordem: z.number().min(0),
})

type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  cargo: Cargo | null
}

export default function CargoFormModal({ isOpen, onClose, cargo }: Props) {
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)
  const isEditing = !!cargo

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ordem: 0 }
  })

  useEffect(() => {
    if (cargo) {
      reset({
        nome: cargo.nome,
        descricao: cargo.descricao || '',
        ordem: cargo.ordem,
      })
    } else {
      reset({ nome: '', descricao: '', ordem: 0 })
    }
  }, [cargo, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing ? cargosService.update(cargo.id, data) : cargosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos', salao?.id] })
      toast.success(isEditing ? 'Cargo atualizado' : 'Cargo cadastrado')
      onClose()
    },
    onError: () => toast.error('Erro ao salvar cargo'),
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Cargo' : 'Novo Cargo'} size="sm">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <Input label="Nome *" {...register('nome')} error={errors.nome?.message} placeholder="Ex: Cabeleireira, Manicure..." />
        <Input label="Ordem" type="number" {...register('ordem', { valueAsNumber: true })} placeholder="0" />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Descricao</label>
          <textarea {...register('descricao')} className="input-field h-20 resize-none" placeholder="Descricao do cargo..." />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>{isEditing ? 'Salvar' : 'Cadastrar'}</Button>
        </div>
      </form>
    </Modal>
  )
}
