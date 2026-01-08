import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, MessageCircle, QrCode, RefreshCw, Power, PowerOff, Send, Edit, Building2, History } from 'lucide-react'
import { whatsappService } from '../../services/whatsapp.service'
import { Button, DataTable, ConfirmModal, Modal, Spinner } from '../../components/ui'
import { WhatsAppSendTestModal, WhatsAppFormModal, WhatsAppHistoryModal } from '../../components/whatsapp'
import { masks } from '../../utils/masks'
import toast from 'react-hot-toast'
import type { SessaoWhatsapp, StatusSessaoWhatsapp } from '../../types'
import { cn } from '../../utils/cn'

const statusColors: Record<StatusSessaoWhatsapp, string> = {
  desconectada: 'bg-slate-100 text-slate-700',
  conectando: 'bg-amber-100 text-amber-700',
  conectada: 'bg-green-100 text-green-700',
  erro: 'bg-red-100 text-red-700',
}

const statusLabels: Record<StatusSessaoWhatsapp, string> = {
  desconectada: 'Desconectada',
  conectando: 'Conectando',
  conectada: 'Conectada',
  erro: 'Erro',
}

export default function AdminWhatsAppListPage() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [isSendTestOpen, setIsSendTestOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedSessao, setSelectedSessao] = useState<SessaoWhatsapp | null>(null)
  const [editingSessao, setEditingSessao] = useState<SessaoWhatsapp | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrPolling, setQrPolling] = useState(false)

  // Query SEM dependencia de salao - lista todas as sessoes do sistema
  const { data, isLoading } = useQuery({
    queryKey: ['admin-whatsapp-sessoes'],
    queryFn: () => whatsappService.list({ per_page: 100 }),
  })

  const deleteMutation = useMutation({
    mutationFn: whatsappService.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessoes'] })
      toast.success(data.message)
      setIsDeleteOpen(false)
      setSelectedSessao(null)
    },
    onError: () => toast.error('Erro ao remover sessao'),
  })

  const connectMutation = useMutation({
    mutationFn: whatsappService.connect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessoes'] })
      toast.success('Conectando...')
    },
    onError: () => toast.error('Erro ao conectar'),
  })

  const disconnectMutation = useMutation({
    mutationFn: whatsappService.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessoes'] })
      toast.success('Desconectado')
    },
    onError: () => toast.error('Erro ao desconectar'),
  })

  // Polling para verificar status durante conexao
  const checkConnectionStatus = useCallback(async () => {
    if (!selectedSessao || !isQrOpen) return

    try {
      const status = await whatsappService.getStatus(selectedSessao.id)
      if (status.status === 'conectada') {
        setQrPolling(false)
        setIsQrOpen(false)
        queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessoes'] })
        toast.success('WhatsApp conectado com sucesso!')
      } else if (status.qr_code) {
        setQrCode(status.qr_code)
      }
    } catch {
      // Ignora erros de polling
    }
  }, [selectedSessao, isQrOpen, queryClient])

  // Efeito para polling durante QR Code aberto
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isQrOpen && qrPolling && selectedSessao) {
      interval = setInterval(checkConnectionStatus, 3000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isQrOpen, qrPolling, selectedSessao, checkConnectionStatus])

  const handleGetQr = async (sessao: SessaoWhatsapp) => {
    setSelectedSessao(sessao)
    setQrLoading(true)
    setIsQrOpen(true)
    setQrPolling(true)
    try {
      const result = await whatsappService.getQrCode(sessao.id)
      setQrCode(result.qr_code || null)
    } catch {
      toast.error('Erro ao obter QR Code')
      setQrCode(null)
    } finally {
      setQrLoading(false)
    }
  }

  const handleSendTest = (sessao: SessaoWhatsapp) => {
    setSelectedSessao(sessao)
    setIsSendTestOpen(true)
  }

  const handleViewHistory = (sessao: SessaoWhatsapp) => {
    setSelectedSessao(sessao)
    setIsHistoryOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingSessao(null)
    queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-sessoes'] })
  }

  const columns = [
    {
      key: 'nome',
      header: 'Sessao',
      render: (s: SessaoWhatsapp) => (
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', s.status === 'conectada' ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-slate-400 to-slate-600')}>
            <MessageCircle size={18} className="text-white" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{s.nome}</p>
            {s.numero && <p className="text-sm text-slate-500">{s.numero}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'salao',
      header: 'Salao',
      render: (s: SessaoWhatsapp) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className={s.salao_nome ? 'text-slate-700' : 'text-slate-400 italic'}>
            {s.salao_nome || 'Geral (Sistema)'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: SessaoWhatsapp) => (
        <span className={cn('badge', statusColors[s.status])}>
          {statusLabels[s.status]}
        </span>
      ),
    },
    {
      key: 'ultima_conexao',
      header: 'Ultima Conexao',
      render: (s: SessaoWhatsapp) => s.ultima_conexao ? masks.dateTime(s.ultima_conexao) : '-',
    },
    {
      key: 'actions',
      header: '',
      width: '200px',
      render: (s: SessaoWhatsapp) => (
        <div className="flex items-center gap-2">
          {s.status === 'desconectada' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleGetQr(s); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600" title="QR Code"><QrCode size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); connectMutation.mutate(s.id); }} className="p-2 rounded-lg hover:bg-green-50 text-slate-500 hover:text-green-600" title="Conectar"><Power size={16} /></button>
            </>
          )}
          {s.status === 'conectada' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleViewHistory(s); }} className="p-2 rounded-lg hover:bg-purple-50 text-slate-500 hover:text-purple-600" title="Historico de Mensagens"><History size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleSendTest(s); }} className="p-2 rounded-lg hover:bg-green-50 text-slate-500 hover:text-green-600" title="Enviar Teste"><Send size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); disconnectMutation.mutate(s.id); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600" title="Desconectar"><PowerOff size={16} /></button>
            </>
          )}
          {s.status === 'conectando' && (
            <button onClick={(e) => { e.stopPropagation(); handleGetQr(s); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600" title="Ver QR Code"><QrCode size={16} /></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setEditingSessao(s); setIsFormOpen(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600" title="Editar"><Edit size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); setSelectedSessao(s); setIsDeleteOpen(true); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600" title="Remover"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-500" />
            <h1 className="text-2xl font-bold text-slate-900">WhatsApp Global</h1>
          </div>
          <p className="text-slate-500 mt-1">Gerencie todas as sessoes de WhatsApp do sistema</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}><Plus size={18} />Nova Sessao</Button>
      </div>

      {/* Cards de estatisticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">{data?.items?.length || 0}</p>
              <p className="text-sm text-slate-600">Total de Sessoes</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Power size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {data?.items?.filter(s => s.status === 'conectada').length || 0}
              </p>
              <p className="text-sm text-green-600">Conectadas</p>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <PowerOff size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">
                {data?.items?.filter(s => s.status === 'desconectada').length || 0}
              </p>
              <p className="text-sm text-amber-600">Desconectadas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={data?.items || []} loading={isLoading} />
      </div>

      <WhatsAppFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        sessao={editingSessao}
      />

      <Modal isOpen={isQrOpen} onClose={() => { setIsQrOpen(false); setQrCode(null); setQrPolling(false); setSelectedSessao(null); }} title="QR Code - WhatsApp" size="sm">
        <div className="text-center space-y-4">
          <p className="text-slate-500">Escaneie o QR Code com o WhatsApp para conectar a sessao "{selectedSessao?.nome}"</p>
          <div className="flex items-center justify-center min-h-[256px] bg-slate-50 rounded-xl relative">
            {qrLoading ? (
              <Spinner size="lg" />
            ) : qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            ) : (
              <div className="text-slate-400">
                <QrCode size={64} className="mx-auto mb-2 opacity-50" />
                <p>QR Code nao disponivel</p>
                <p className="text-sm">Clique em conectar primeiro</p>
              </div>
            )}
          </div>
          {qrPolling && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Aguardando leitura do QR Code...</span>
            </div>
          )}
          <Button variant="secondary" onClick={() => handleGetQr(selectedSessao!)} disabled={qrLoading}>
            <RefreshCw size={16} className={qrLoading ? 'animate-spin' : ''} />
            Atualizar QR Code
          </Button>
        </div>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => { setIsDeleteOpen(false); setSelectedSessao(null) }} onConfirm={() => selectedSessao && deleteMutation.mutate(selectedSessao.id)} title="Remover sessao?" message={`Deseja remover a sessao "${selectedSessao?.nome}"? Esta acao nao pode ser desfeita.`} confirmText="Remover" loading={deleteMutation.isPending} />

      <WhatsAppSendTestModal
        isOpen={isSendTestOpen}
        onClose={() => { setIsSendTestOpen(false); setSelectedSessao(null); }}
        sessao={selectedSessao}
      />

      <WhatsAppHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => { setIsHistoryOpen(false); setSelectedSessao(null); }}
        sessao={selectedSessao}
      />
    </div>
  )
}
