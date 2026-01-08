import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Save, QrCode, RefreshCw, CheckCircle, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Modal, Button, Input, Spinner } from '../ui'
import { whatsappService } from '../../services/whatsapp.service'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import type { SessaoWhatsapp } from '../../types'

interface FormData {
  nome: string
  salao_id: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  sessao?: SessaoWhatsapp | null
}

type ModalStep = 'form' | 'qrcode' | 'connected'

interface SalaoComFilial {
  id: string
  nome: string
  codigo?: string
  is_filial: boolean
  salao_principal_nome?: string | null
}

export function WhatsAppFormModal({ isOpen, onClose, sessao }: Props) {
  const queryClient = useQueryClient()
  const usuario = useAuthStore((state) => state.usuario)
  const salao = useAuthStore((state) => state.salao)
  const isSuperAdmin = usuario?.super_usuario

  const isEditing = !!sessao

  // Estados
  const [step, setStep] = useState<ModalStep>('form')
  const [createdSessao, setCreatedSessao] = useState<SessaoWhatsapp | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // Buscar saloes e filiais (apenas para super admin)
  const saloesQuery = useQuery({
    queryKey: ['saloes-filiais-ativos'],
    queryFn: async () => {
      const response = await api.get<{ items: SalaoComFilial[] }>('/admin/saloes-com-filiais', { params: { ativo: true } })
      return response.data.items
    },
    enabled: isOpen && !!isSuperAdmin,
    staleTime: 60000,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      nome: '',
      salao_id: null,
    },
  })

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (sessao) {
        reset({
          nome: sessao.nome,
          salao_id: sessao.salao_id || null,
        })
        setStep('form')
      } else {
        reset({
          nome: '',
          salao_id: null,
        })
        setStep('form')
      }
      setCreatedSessao(null)
      setQrCode(null)
      setIsPolling(false)
    }
  }, [sessao, reset, isOpen])

  // Polling para verificar status da conexao
  useEffect(() => {
    if (!isPolling || !createdSessao) return

    const interval = setInterval(async () => {
      try {
        const data = await whatsappService.getStatus(createdSessao.id)

        if (data.status === 'conectada') {
          setIsPolling(false)
          setStep('connected')
          queryClient.invalidateQueries({ queryKey: ['whatsapp-sessoes', salao?.id] })
          toast.success('WhatsApp conectado com sucesso!')
        } else if (data.qr_code && data.qr_code !== qrCode) {
          setQrCode(data.qr_code)
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isPolling, createdSessao, qrCode, queryClient, salao?.id])

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: { nome: string; salao_id?: string | null }) => whatsappService.create(data),
    onSuccess: async (response) => {
      setCreatedSessao(response)
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessoes', salao?.id] })
      toast.success('Sessao criada! Gerando QR Code...')

      // Iniciar conexao automaticamente
      try {
        await whatsappService.connect(response.id)
        // Buscar QR code
        const qrResponse = await whatsappService.getQrCode(response.id)
        if (qrResponse.qr_code) {
          setQrCode(qrResponse.qr_code)
          setStep('qrcode')
          setIsPolling(true)
        }
      } catch (error: any) {
        toast.error('Erro ao gerar QR Code')
        handleClose()
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar sessao'
      toast.error(message)
    },
  })

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: { nome: string; salao_id?: string | null }) => whatsappService.update(sessao!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-sessoes', salao?.id] })
      toast.success('Sessao atualizada com sucesso!')
      handleClose()
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar sessao'
      toast.error(message)
    },
  })

  // Mutation para reconectar
  const connectMutation = useMutation({
    mutationFn: async (id: string) => {
      await whatsappService.connect(id)
      return whatsappService.getQrCode(id)
    },
    onSuccess: (response) => {
      if (response.qr_code) {
        setQrCode(response.qr_code)
        setIsPolling(true)
      }
    },
    onError: () => {
      toast.error('Erro ao gerar QR Code')
    },
  })

  const handleClose = () => {
    setIsPolling(false)
    reset()
    setStep('form')
    setCreatedSessao(null)
    setQrCode(null)
    onClose()
  }

  const onSubmit = (data: FormData) => {
    const payload: { nome: string; salao_id?: string | null } = { nome: data.nome }

    // Para super admin, incluir salao_id (pode ser null para sessao geral)
    if (isSuperAdmin) {
      payload.salao_id = data.salao_id || null
    }

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleRefreshQrCode = () => {
    if (createdSessao) {
      connectMutation.mutate(createdSessao.id)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  // Renderizacao do Form
  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selecao de Salao (apenas Super Admin) - Vem primeiro */}
      {isSuperAdmin && (
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
            <Building2 className="w-4 h-4" />
            <span>Vincular a Salao</span>
            {saloesQuery.isLoading && <span className="text-xs text-slate-400">(Carregando...)</span>}
            {saloesQuery.isError && <span className="text-xs text-red-500">(Erro ao carregar)</span>}
          </div>
          <select
            {...register('salao_id')}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200"
            disabled={saloesQuery.isLoading}
          >
            <option value="">Geral (Sistema) - Sem vinculo</option>
            {saloesQuery.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.is_filial ? `  ↳ ${item.nome} (Filial de ${item.salao_principal_nome})` : item.nome}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Deixe em branco para criar uma sessao geral sem vinculo a um salao especifico.
          </p>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
          <MessageSquare className="w-4 h-4" />
          <span>Nome da Sessao</span>
        </div>
        <Input
          placeholder="Ex: WhatsApp Principal"
          {...register('nome', {
            required: 'Campo obrigatorio',
            maxLength: { value: 100, message: 'Maximo 100 caracteres' },
          })}
          error={errors.nome?.message}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          {isEditing ? <><Save className="w-4 h-4" /> Salvar</> : <><QrCode className="w-4 h-4" /> Criar e Conectar</>}
        </Button>
      </div>
    </form>
  )

  // Renderizacao do QR Code
  const renderQRCode = () => (
    <div className="flex flex-col items-center py-4">
      <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 mb-6">
        <div className="w-64 h-64 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
          {connectMutation.isPending ? (
            <div className="flex flex-col items-center">
              <Spinner size="lg" />
              <p className="mt-2 text-sm text-slate-500">Gerando QR Code...</p>
            </div>
          ) : qrCode ? (
            <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <QrCode className="w-16 h-16" />
              <p className="mt-2 text-sm">QR Code indisponivel</p>
            </div>
          )}
        </div>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Escaneie o QR Code
        </h3>
        <p className="text-slate-500 text-sm max-w-xs">
          Abra o WhatsApp no seu celular, va em <strong>Dispositivos conectados</strong> e escaneie o codigo acima.
        </p>
      </div>

      {isPolling && (
        <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Aguardando conexao...</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={handleRefreshQrCode}
          disabled={connectMutation.isPending}
        >
          <RefreshCw className="w-4 h-4" />
          Novo QR Code
        </Button>
        <Button
          variant="secondary"
          onClick={handleClose}
        >
          Fechar
        </Button>
      </div>
    </div>
  )

  // Renderizacao de Conectado
  const renderConnected = () => (
    <div className="flex flex-col items-center py-8">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">WhatsApp Conectado!</h3>
      <p className="text-slate-500 text-center mb-6">
        A sessao <strong>{createdSessao?.nome}</strong> esta conectada e pronta para uso.
      </p>
      <Button
        onClick={handleClose}
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
      >
        Concluir
      </Button>
    </div>
  )

  // Titulo dinamico
  const getTitle = () => {
    if (isEditing) return 'Editar Sessao'
    switch (step) {
      case 'form':
        return 'Nova Sessao de WhatsApp'
      case 'qrcode':
        return `Conectar WhatsApp - ${createdSessao?.nome || ''}`
      case 'connected':
        return 'Conexao Estabelecida'
      default:
        return 'WhatsApp'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size="md"
    >
      {step === 'form' && renderForm()}
      {step === 'qrcode' && renderQRCode()}
      {step === 'connected' && renderConnected()}
    </Modal>
  )
}
