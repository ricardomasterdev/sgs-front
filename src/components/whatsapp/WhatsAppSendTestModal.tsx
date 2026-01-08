import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Send, Phone, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal, Button, Input } from '../ui'
import { whatsappService } from '../../services/whatsapp.service'
import { masks } from '../../utils/masks'
import type { SessaoWhatsapp } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  sessao: SessaoWhatsapp | null
}

interface SendResult {
  success: boolean
  timestamp: string
  error?: string
}

export function WhatsAppSendTestModal({ isOpen, onClose, sessao }: Props) {
  const [telefone, setTelefone] = useState('')
  const [mensagem, setMensagem] = useState('Ola! Esta e uma mensagem de teste do sistema.')
  const [lastResult, setLastResult] = useState<SendResult | null>(null)

  const sendMutation = useMutation({
    mutationFn: () => {
      if (!sessao) throw new Error('Sessao nao selecionada')
      if (!telefone) throw new Error('Informe o telefone')

      // Limpar telefone - apenas numeros com DDI
      const telefoneNumeros = telefone.replace(/\D/g, '')
      const telefoneComDDI = telefoneNumeros.startsWith('55') ? telefoneNumeros : `55${telefoneNumeros}`

      return whatsappService.sendMessage(sessao.id, {
        telefone: telefoneComDDI,
        mensagem,
      })
    },
    onSuccess: () => {
      setLastResult({
        success: true,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      })
      toast.success('Mensagem de teste enviada!')
      setTelefone('')
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
    setTelefone('')
    setLastResult(null)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!telefone.trim()) {
      toast.error('Informe o telefone')
      return
    }
    if (!mensagem.trim()) {
      toast.error('Informe a mensagem')
      return
    }
    sendMutation.mutate()
  }

  if (!sessao) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enviar Mensagem de Teste" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Info da sessao */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800">
            <strong>Sessao:</strong> {sessao.nome}
            {sessao.numero && <span className="ml-2">({sessao.numero})</span>}
          </p>
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>Telefone de destino</span>
            </div>
          </label>
          <Input
            value={telefone}
            onChange={(e) => setTelefone(masks.phone(e.target.value))}
            placeholder="(62) 98453-7185"
            maxLength={15}
          />
          <p className="text-xs text-slate-500 mt-1">
            Informe o numero com DDD. O DDI 55 sera adicionado automaticamente.
          </p>
        </div>

        {/* Mensagem */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mensagem
          </label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all duration-200 placeholder:text-slate-400 resize-none"
            placeholder="Digite a mensagem de teste..."
          />
        </div>

        {/* Resultado */}
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
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Fechar
          </Button>
          <Button
            type="submit"
            loading={sendMutation.isPending}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <Send className="w-4 h-4" />
            Enviar Teste
          </Button>
        </div>
      </form>
    </Modal>
  )
}
