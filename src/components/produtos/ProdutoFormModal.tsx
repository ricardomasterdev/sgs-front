import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { produtosService } from '../../services/produtos.service'
import { Modal, Button, Input } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'
import type { Produto } from '../../types'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  codigo: z.string().optional(),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  marca: z.string().optional(),
  preco_custo: z.number().min(0),
  preco_venda: z.number().min(0),
  comissao_percentual: z.number().min(0).max(100),
  estoque_atual: z.number().min(0),
  estoque_minimo: z.number().min(0),
  unidade_medida: z.string(),
})

type FormData = z.infer<typeof schema>

interface Props { isOpen: boolean; onClose: () => void; produto: Produto | null }

export default function ProdutoFormModal({ isOpen, onClose, produto }: Props) {
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)
  const isEditing = !!produto
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preco_custo: 0, preco_venda: 0, comissao_percentual: 0, estoque_atual: 0, estoque_minimo: 0, unidade_medida: 'UN' }
  })

  useEffect(() => {
    if (produto) {
      reset({ nome: produto.nome, codigo: produto.codigo || '', descricao: produto.descricao || '', categoria: produto.categoria || '', marca: produto.marca || '', preco_custo: produto.preco_custo, preco_venda: produto.preco_venda, comissao_percentual: produto.comissao_percentual || 0, estoque_atual: produto.estoque_atual, estoque_minimo: produto.estoque_minimo, unidade_medida: produto.unidade_medida })
    } else { reset({ preco_custo: 0, preco_venda: 0, comissao_percentual: 0, estoque_atual: 0, estoque_minimo: 0, unidade_medida: 'UN' }) }
  }, [produto, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => isEditing ? produtosService.update(produto.id, data) : produtosService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['produtos', salao?.id] }); toast.success(isEditing ? 'Produto atualizado' : 'Produto cadastrado'); onClose() },
    onError: () => toast.error('Erro ao salvar produto'),
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Produto' : 'Novo Produto'} size="lg">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nome *" {...register('nome')} error={errors.nome?.message} />
          <Input label="Código" {...register('codigo')} />
          <Input label="Categoria" {...register('categoria')} />
          <Input label="Marca" {...register('marca')} />
          <Input label="Preco Custo (R$)" type="number" step="0.01" {...register('preco_custo', { valueAsNumber: true })} />
          <Input label="Preco Venda (R$) *" type="number" step="0.01" {...register('preco_venda', { valueAsNumber: true })} />
          <Input label="Comissao (%)" type="number" step="0.01" {...register('comissao_percentual', { valueAsNumber: true })} />
          <Input label="Estoque Atual" type="number" step="0.001" {...register('estoque_atual', { valueAsNumber: true })} />
          <Input label="Estoque Mínimo" type="number" step="0.001" {...register('estoque_minimo', { valueAsNumber: true })} />
          <Input label="Unidade de Medida" {...register('unidade_medida')} placeholder="UN, KG, ML..." />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}>{isEditing ? 'Salvar' : 'Cadastrar'}</Button>
        </div>
      </form>
    </Modal>
  )
}
