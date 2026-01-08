import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { colaboradoresService } from '../../services/colaboradores.service'
import { servicosService } from '../../services/servicos.service'
import { Modal, Button } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'
import type { Colaborador, ServicoVinculado } from '../../types'
import { Check } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  colaborador: Colaborador | null
}

export default function ColaboradorServicosModal({ isOpen, onClose, colaborador }: Props) {
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)
  const [servicosVinculados, setServicosVinculados] = useState<ServicoVinculado[]>([])

  const { data: servicosData, isLoading } = useQuery({
    queryKey: ['servicos-list'],
    queryFn: () => servicosService.list({ per_page: 100, ativo: true }),
    enabled: isOpen,
  })

  useEffect(() => {
    if (colaborador) {
      setServicosVinculados(
        colaborador.servicos?.map(s => ({ servico_id: s.servico_id })) || []
      )
    } else {
      setServicosVinculados([])
    }
  }, [colaborador])

  const mutation = useMutation({
    mutationFn: (servicos: ServicoVinculado[]) => {
      if (!colaborador) return Promise.reject('Colaborador nao encontrado')
      return colaboradoresService.update(colaborador.id, { servicos })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores', salao?.id] })
      toast.success('Servicos atualizados')
      onClose()
    },
    onError: () => toast.error('Erro ao atualizar servicos'),
  })

  const toggleServico = (servicoId: string) => {
    if (servicosVinculados.some(s => s.servico_id === servicoId)) {
      setServicosVinculados(servicosVinculados.filter(s => s.servico_id !== servicoId))
    } else {
      setServicosVinculados([...servicosVinculados, { servico_id: servicoId }])
    }
  }

  const handleSave = () => {
    mutation.mutate(servicosVinculados)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Servicos de ${colaborador?.nome || ''}`}
      size="lg"
    >
      <div className="space-y-6">
        <p className="text-sm text-slate-600">
          Selecione os servicos que este colaborador realiza:
        </p>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-slate-500 mt-2">Carregando servicos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {servicosData?.items?.map(servico => {
              const isSelected = servicosVinculados.some(s => s.servico_id === servico.id)
              return (
                <button
                  key={servico.id}
                  type="button"
                  onClick={() => toggleServico(servico.id)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all text-left ${
                    isSelected
                      ? 'bg-primary-50 text-primary-700 border-2 border-primary-300 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{servico.nome}</span>
                    {isSelected && <Check size={16} className="text-primary-600" />}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    R$ {Number(servico.preco ?? 0).toFixed(2)} - {servico.comissao_percentual ?? 0}% comissao
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {!isLoading && servicosData?.items?.length === 0 && (
          <p className="text-center text-slate-500 py-8">
            Nenhum servico cadastrado. Cadastre servicos primeiro.
          </p>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <span className="text-sm text-slate-500">
            {servicosVinculados.length} servico(s) selecionado(s)
          </span>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} loading={mutation.isPending}>
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
