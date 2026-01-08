import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { colaboradoresService } from '../../services/colaboradores.service'
import { servicosService } from '../../services/servicos.service'
import { cargosService } from '../../services/cargos.service'
import { Modal, Button, Input } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import { masks } from '../../utils/masks'
import toast from 'react-hot-toast'
import type { Colaborador, ServicoVinculado } from '../../types'
import { X } from 'lucide-react'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  whatsapp: z.string().optional(),
  cargo_id: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  colaborador: Colaborador | null
}

export default function ColaboradorFormModal({ isOpen, onClose, colaborador }: Props) {
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)
  const isEditing = !!colaborador
  const [servicosVinculados, setServicosVinculados] = useState<ServicoVinculado[]>([])

  const { data: servicosData } = useQuery({
    queryKey: ['servicos-list'],
    queryFn: () => servicosService.list({ per_page: 100, ativo: true }),
    enabled: isOpen,
  })

  const { data: cargosData } = useQuery({
    queryKey: ['cargos-list'],
    queryFn: () => cargosService.list({ per_page: 100, ativo: true }),
    enabled: isOpen,
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (colaborador) {
      reset({
        nome: colaborador.nome,
        whatsapp: colaborador.whatsapp || '',
        cargo_id: colaborador.cargo_id || '',
      })
      setServicosVinculados(
        colaborador.servicos?.map(s => ({ servico_id: s.servico_id })) || []
      )
    } else {
      reset({ nome: '', whatsapp: '', cargo_id: '' })
      setServicosVinculados([])
    }
  }, [colaborador, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData & { servicos: ServicoVinculado[] }) =>
      isEditing ? colaboradoresService.update(colaborador.id, data) : colaboradoresService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores', salao?.id] })
      toast.success(isEditing ? 'Colaborador atualizado' : 'Colaborador cadastrado')
      onClose()
    },
    onError: () => toast.error('Erro ao salvar colaborador'),
  })

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      cargo_id: data.cargo_id || undefined,
      servicos: servicosVinculados
    }
    mutation.mutate(payload)
  }

  const toggleServico = (servicoId: string) => {
    if (servicosVinculados.some(s => s.servico_id === servicoId)) {
      setServicosVinculados(servicosVinculados.filter(s => s.servico_id !== servicoId))
    } else {
      setServicosVinculados([...servicosVinculados, { servico_id: servicoId }])
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nome *" {...register('nome')} error={errors.nome?.message} />
          <Input
            label="WhatsApp"
            {...register('whatsapp')}
            onChange={(e) => setValue('whatsapp', masks.phone(e.target.value))}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Cargo</label>
            <select
              {...register('cargo_id')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
            >
              <option value="">Selecione um cargo</option>
              {cargosData?.items.map(cargo => (
                <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h4 className="font-medium text-slate-800 mb-4">Servicos que o colaborador realiza</h4>
          <div className="flex flex-wrap gap-2">
            {servicosData?.items.map(servico => {
              const isSelected = servicosVinculados.some(s => s.servico_id === servico.id)
              return (
                <button
                  key={servico.id}
                  type="button"
                  onClick={() => toggleServico(servico.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                      : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                  }`}
                >
                  {servico.nome}
                  {isSelected && <X size={14} className="inline ml-1" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
