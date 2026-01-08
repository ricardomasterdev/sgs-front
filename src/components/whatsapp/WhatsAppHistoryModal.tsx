import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Phone, User, Clock, CheckCircle, XCircle, History } from 'lucide-react'
import { Modal, Button, Spinner } from '../ui'
import { whatsappService } from '../../services/whatsapp.service'
import type { SessaoWhatsapp } from '../../types'

interface WhatsAppHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  sessao: SessaoWhatsapp | null
}

export function WhatsAppHistoryModal({
  isOpen,
  onClose,
  sessao,
}: WhatsAppHistoryModalProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  // Buscar mensagens da sessao
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['whatsapp-mensagens-sessao', sessao?.id, page, search],
    queryFn: () => whatsappService.listarMensagensPorSessao(sessao!.id, {
      page,
      page_size: pageSize,
      search: search || undefined,
    }),
    enabled: isOpen && !!sessao?.id,
    staleTime: 10000,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset para primeira pagina ao buscar
  }

  const handleClose = () => {
    setSearch('')
    setPage(1)
    onClose()
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPhone = (phone: string) => {
    if (!phone) return ''
    // Remove @c.us if present
    const cleanPhone = phone.replace('@c.us', '')
    // Format as phone
    if (cleanPhone.length === 13) {
      // 5562984537185 -> +55 (62) 98453-7185
      return `+${cleanPhone.slice(0, 2)} (${cleanPhone.slice(2, 4)}) ${cleanPhone.slice(4, 9)}-${cleanPhone.slice(9)}`
    } else if (cleanPhone.length === 12) {
      // 556284537185 -> +55 (62) 8453-7185
      return `+${cleanPhone.slice(0, 2)} (${cleanPhone.slice(2, 4)}) ${cleanPhone.slice(4, 8)}-${cleanPhone.slice(8)}`
    }
    return cleanPhone
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Historico de Mensagens - ${sessao?.nome || ''}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Barra de busca */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por telefone, nome ou mensagem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={isFetching}>
            Buscar
          </Button>
        </form>

        {/* Lista de mensagens */}
        <div className="min-h-[400px] max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !data?.items?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <History className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma mensagem encontrada</p>
              <p className="text-sm">As mensagens enviadas por esta sessao aparecerao aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl p-4 border ${
                    msg.from_me
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.cliente_nome ? 'bg-purple-100' : 'bg-slate-200'
                      }`}>
                        <User className={`w-4 h-4 ${msg.cliente_nome ? 'text-purple-600' : 'text-slate-500'}`} />
                      </div>
                      <div>
                        {msg.cliente_nome ? (
                          <p className="font-medium text-slate-800">{msg.cliente_nome}</p>
                        ) : (
                          <p className="text-slate-500">Contato nao vinculado</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="w-3 h-3" />
                          <span>{formatPhone(msg.telefone)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status */}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        msg.status === 'enviada'
                          ? 'bg-green-100 text-green-700'
                          : msg.status === 'erro'
                          ? 'bg-red-100 text-red-700'
                          : msg.status === 'pendente'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {msg.status === 'enviada' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {msg.status === 'erro' && <XCircle className="w-3 h-3 inline mr-1" />}
                        {msg.status === 'enviada' ? 'Enviada' : msg.status === 'erro' ? 'Erro' : msg.status}
                      </span>
                      {/* Direction badge */}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        msg.from_me ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {msg.from_me ? 'Enviada' : 'Recebida'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                      {msg.conteudo}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(msg.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginacao */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Pagina {data.page} de {data.total_pages} ({data.total} mensagens)
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.total_pages || isFetching}
              >
                Proxima
              </Button>
            </div>
          </div>
        )}

        {/* Botao fechar */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
