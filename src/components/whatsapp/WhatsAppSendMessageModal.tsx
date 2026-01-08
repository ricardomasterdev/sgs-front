import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Phone, MessageSquare, CheckCircle, XCircle, User, Loader2, Clock, History } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal, Button } from '../ui'
import { whatsappService } from '../../services/whatsapp.service'
import type { SessaoWhatsapp } from '../../types'

// Icone do WhatsApp
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

interface WhatsAppSendMessageModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: {
    id: string
    nome: string
    whatsapp?: string | null
    celular?: string | null
  }
}

interface SendResult {
  success: boolean
  timestamp: string
  error?: string
}

export function WhatsAppSendMessageModal({
  isOpen,
  onClose,
  cliente,
}: WhatsAppSendMessageModalProps) {
  const queryClient = useQueryClient()
  const [selectedSessaoId, setSelectedSessaoId] = useState<string>('')
  const [mensagem, setMensagem] = useState('')
  const [lastResult, setLastResult] = useState<SendResult | null>(null)

  // Buscar sessoes conectadas
  const sessoesQuery = useQuery({
    queryKey: ['whatsapp-sessoes'],
    queryFn: () => whatsappService.list({ ativo: true }),
    enabled: isOpen,
    staleTime: 30000,
  })

  // Buscar historico de mensagens do cliente
  const historicoQuery = useQuery({
    queryKey: ['whatsapp-mensagens-cliente', cliente.id],
    queryFn: () => whatsappService.listarMensagensPorCliente(cliente.id, { page_size: 5 }),
    enabled: isOpen && !!cliente.id,
    staleTime: 10000,
  })

  // Filtrar apenas sessoes conectadas
  const sessoesConectadas = (sessoesQuery.data?.items || []).filter(
    (s: SessaoWhatsapp) => s.status === 'conectada'
  )

  // Selecionar primeira sessao conectada por padrao
  useEffect(() => {
    if (sessoesConectadas.length > 0 && !selectedSessaoId) {
      setSelectedSessaoId(sessoesConectadas[0].id)
    }
  }, [sessoesConectadas, selectedSessaoId])

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setMensagem('')
      setLastResult(null)
    }
  }, [isOpen])

  // Mutation para enviar mensagem
  const sendMutation = useMutation({
    mutationFn: () => {
      const telefone = cliente.whatsapp || cliente.celular
      if (!telefone) throw new Error('Cliente sem telefone cadastrado')
      if (!selectedSessaoId) throw new Error('Selecione uma sessao de WhatsApp')

      // Limpar telefone - apenas numeros com DDI
      const telefoneNumeros = telefone.replace(/\D/g, '')
      const telefoneComDDI = telefoneNumeros.startsWith('55') ? telefoneNumeros : `55${telefoneNumeros}`

      return whatsappService.sendMessage(selectedSessaoId, {
        telefone: telefoneComDDI,
        mensagem,
        cliente_id: cliente.id,
      })
    },
    onSuccess: () => {
      setLastResult({
        success: true,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      })
      toast.success('Mensagem enviada com sucesso!')
      setMensagem('')
      // Atualizar historico
      queryClient.invalidateQueries({ queryKey: ['whatsapp-mensagens-cliente', cliente.id] })
    },
    onError: (error: any) => {
      const message = error.message || error.response?.data?.detail || 'Erro ao enviar mensagem'
      setLastResult({
        success: false,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        error: message,
      })
      toast.error(message)
    },
  })

  const handleClose = () => {
    setMensagem('')
    setLastResult(null)
    setSelectedSessaoId('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mensagem.trim()) {
      toast.error('Digite uma mensagem')
      return
    }
    sendMutation.mutate()
  }

  // Telefone para exibir
  const telefoneDisplay = cliente.whatsapp || cliente.celular || 'Nao informado'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enviar WhatsApp"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Destinatario */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{cliente.nome}</p>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Phone className="w-3 h-3" />
                <span>{telefoneDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selecao de Sessao */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enviar pela sessao:
          </label>
          {sessoesQuery.isLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Carregando sessoes...</span>
            </div>
          ) : sessoesConectadas.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                Nenhuma sessao de WhatsApp conectada.
                <br />
                Acesse a pagina WhatsApp para conectar uma sessao.
              </p>
            </div>
          ) : (
            <select
              value={selectedSessaoId}
              onChange={(e) => setSelectedSessaoId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {sessoesConectadas.map((sessao: SessaoWhatsapp) => (
                <option key={sessao.id} value={sessao.id}>
                  {sessao.nome} {sessao.numero ? `(${sessao.numero})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Mensagem */}
        <div>
          <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>Mensagem</span>
          </div>
          <textarea
            placeholder="Digite sua mensagem..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200 placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* Historico de mensagens enviadas - ABAIXO do campo de digitacao */}
        {historicoQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando historico...</span>
          </div>
        ) : historicoQuery.data && historicoQuery.data.items.length > 0 ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <History className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-green-800">
                Ultimas {historicoQuery.data.items.length} mensagens enviadas para este cliente
              </span>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-2">
              {historicoQuery.data.items.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-green-400"
                >
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                    {msg.conteudo}
                  </p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {new Date(msg.timestamp).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        msg.status === 'enviada'
                          ? 'bg-green-100 text-green-700'
                          : msg.status === 'erro'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {msg.status === 'enviada' ? 'Enviada' : msg.status === 'erro' ? 'Erro' : msg.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Nenhuma mensagem enviada para este cliente ainda</p>
          </div>
        )}

        {/* Resultado do ultimo envio */}
        {lastResult && (
          <div className={`rounded-xl p-4 ${lastResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <div>
                <span className={`font-medium ${lastResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {lastResult.success ? 'Mensagem enviada!' : 'Erro ao enviar'}
                </span>
                <span className="text-xs text-slate-500 ml-2">({lastResult.timestamp})</span>
                {lastResult.error && (
                  <p className="text-sm text-red-700 mt-1">{lastResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botoes */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={sendMutation.isPending}
          >
            Fechar
          </Button>
          <Button
            type="submit"
            loading={sendMutation.isPending}
            disabled={sessoesConectadas.length === 0 || !selectedSessaoId}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Mensagem
          </Button>
        </div>
      </form>
    </Modal>
  )
}
