import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User, MapPin, FileText } from 'lucide-react'
import { clientesService } from '../../services/clientes.service'
import { Modal, Button, Input } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import { masks } from '../../utils/masks'
import toast from 'react-hot-toast'
import type { Cliente } from '../../types'

const GENEROS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informado', label: 'Prefiro nao informar' },
]

const TABS = [
  { id: 'dados', label: 'Dados Pessoais', icon: User },
  { id: 'endereco', label: 'Endereco', icon: MapPin },
  { id: 'observacoes', label: 'Observacoes', icon: FileText },
] as const

type TabId = typeof TABS[number]['id']

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  whatsapp: z.string().min(10, 'WhatsApp e obrigatorio'),
  genero: z.string().min(1, 'Genero e obrigatorio'),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  cpf: z.string().optional(),
  celular: z.string().optional(),
  data_nascimento: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  observacoes: z.string().optional(),
  alergias: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  cliente: Cliente | null
}

export default function ClienteFormModal({ isOpen, onClose, cliente }: Props) {
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)
  const isEditing = !!cliente
  const [activeTab, setActiveTab] = useState<TabId>('dados')

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (cliente) {
      reset({
        nome: cliente.nome,
        genero: cliente.genero || '',
        email: cliente.email || '',
        cpf: cliente.cpf || '',
        celular: cliente.celular || '',
        whatsapp: cliente.whatsapp || '',
        data_nascimento: masks.dateFromISO(cliente.data_nascimento || ''),
        cep: cliente.cep || '',
        logradouro: cliente.logradouro || '',
        numero: cliente.numero || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        uf: cliente.uf || '',
        observacoes: cliente.observacoes || '',
        alergias: cliente.alergias || '',
      })
    } else {
      reset({ genero: '' })
    }
    setActiveTab('dados')
  }, [cliente, reset, isOpen])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing ? clientesService.update(cliente.id, data) : clientesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', salao?.id] })
      toast.success(isEditing ? 'Cliente atualizado' : 'Cliente cadastrado')
      onClose()
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail
      if (typeof detail === 'string') {
        toast.error(detail)
      } else if (detail?.message) {
        toast.error(
          <div>
            {detail.message}
            {detail.cliente_id && (
              <a
                href={`/clientes?id=${detail.cliente_id}`}
                className="block mt-1 text-primary-400 hover:text-primary-300 underline"
              >
                Ver cliente: {detail.cliente_nome}
              </a>
            )}
          </div>,
          { duration: 6000 }
        )
      } else {
        toast.error('Erro ao salvar cliente')
      }
    },
  })

  const onSubmit = (data: FormData) => {
    // Limpar campos vazios para enviar null ao backend
    const cleanData: Record<string, any> = {
      nome: data.nome,
      whatsapp: masks.onlyNumbers(data.whatsapp),
      genero: data.genero,
    }

    // Campos opcionais - só incluir se tiver valor
    if (data.email) cleanData.email = data.email
    if (data.cpf) cleanData.cpf = masks.onlyNumbers(data.cpf)
    if (data.celular) cleanData.celular = masks.onlyNumbers(data.celular)
    if (data.data_nascimento) {
      const dataISO = masks.dateToISO(data.data_nascimento)
      if (dataISO) cleanData.data_nascimento = dataISO
    }
    if (data.cep) cleanData.cep = masks.onlyNumbers(data.cep)
    if (data.logradouro) cleanData.logradouro = data.logradouro
    if (data.numero) cleanData.numero = data.numero
    if (data.bairro) cleanData.bairro = data.bairro
    if (data.cidade) cleanData.cidade = data.cidade
    if (data.uf) cleanData.uf = data.uf
    if (data.observacoes) cleanData.observacoes = data.observacoes
    if (data.alergias) cleanData.alergias = data.alergias

    mutation.mutate(cleanData as FormData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-colors
                  border-b-2 -mb-px
                  ${activeTab === tab.id
                    ? 'text-primary-600 border-primary-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                  }
                `}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[320px]">
          {/* Dados Pessoais */}
          {activeTab === 'dados' && (
            <div className="space-y-4">
              {/* Nome - linha completa */}
              <Input label="Nome *" {...register('nome')} error={errors.nome?.message} />

              {/* WhatsApp e Genero */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="WhatsApp *"
                  {...register('whatsapp')}
                  onChange={(e) => setValue('whatsapp', masks.phone(e.target.value))}
                  error={errors.whatsapp?.message}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Genero *</label>
                  <select
                    {...register('genero')}
                    className={`input-field w-full ${errors.genero ? 'border-red-500' : ''}`}
                  >
                    <option value="">Selecione...</option>
                    {GENEROS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                  {errors.genero && <p className="text-sm text-red-500 mt-1">{errors.genero.message}</p>}
                </div>
              </div>

              {/* Celular e Data Nascimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Celular"
                  {...register('celular')}
                  onChange={(e) => setValue('celular', masks.phone(e.target.value))}
                />
                <Input
                  label="Data de Nascimento"
                  placeholder="DD/MM/AAAA"
                  {...register('data_nascimento')}
                  onChange={(e) => setValue('data_nascimento', masks.dateBR(e.target.value))}
                />
              </div>

              {/* Email - linha completa */}
              <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />

              {/* CPF - linha completa */}
              <Input
                label="CPF"
                {...register('cpf')}
                onChange={(e) => setValue('cpf', masks.cpf(e.target.value))}
              />
            </div>
          )}

          {/* Endereco */}
          {activeTab === 'endereco' && (
            <div className="space-y-4">
              {/* CEP e Logradouro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="CEP"
                  {...register('cep')}
                  onChange={(e) => setValue('cep', masks.cep(e.target.value))}
                />
                <div className="md:col-span-2">
                  <Input label="Logradouro" {...register('logradouro')} />
                </div>
              </div>

              {/* Numero e Complemento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Numero" {...register('numero')} />
                <Input label="Bairro" {...register('bairro')} />
              </div>

              {/* Cidade e UF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Cidade" {...register('cidade')} />
                <Input label="UF" {...register('uf')} maxLength={2} />
              </div>
            </div>
          )}

          {/* Observacoes */}
          {activeTab === 'observacoes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Observacoes</label>
                <textarea
                  {...register('observacoes')}
                  className="input-field h-32 resize-none w-full"
                  placeholder="Observacoes sobre o cliente..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Alergias / Restricoes</label>
                <textarea
                  {...register('alergias')}
                  className="input-field h-32 resize-none w-full"
                  placeholder="Alergias, sensibilidades ou restricoes do cliente..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
