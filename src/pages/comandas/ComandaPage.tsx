import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Scissors, Package, Calendar, User, CreditCard, Receipt, XCircle, Play, Printer } from 'lucide-react'
import { comandasService } from '../../services/comandas.service'
import { Spinner, Button, ConfirmModal } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import { formatters, masks } from '../../utils/masks'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
import NovaComandaNormalModal from '../../components/comandas/NovaComandaNormalModal'
import ImprimirComandaModal from '../../components/comandas/ImprimirComandaModal'
import type { Comanda } from '../../types'

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  aberta: { label: 'ABERTA', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300' },
  em_atendimento: { label: 'EM ATENDIMENTO', color: 'text-amber-700', bgColor: 'bg-amber-100 border-amber-300' },
  aguardando_pagamento: { label: 'AGUARDANDO PAGAMENTO', color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-300' },
  paga: { label: 'PAGA', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' },
  cancelada: { label: 'CANCELADA', color: 'text-red-700', bgColor: 'bg-red-100 border-red-300' },
}

export default function ComandaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)

  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isContinuarOpen, setIsContinuarOpen] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)

  const { data: comanda, isLoading } = useQuery({
    queryKey: ['comanda', id],
    queryFn: () => comandasService.get(id!),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: () => comandasService.cancelar(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comanda', id] })
      queryClient.invalidateQueries({ queryKey: ['comandas', salao?.id] })
      toast.success('Comanda cancelada')
      setIsCancelOpen(false)
    },
    onError: () => toast.error('Erro ao cancelar comanda'),
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!comanda) return <div className="text-center py-12 text-slate-500">Comanda nao encontrada</div>

  // Calcular subtotal a partir dos itens (soma de todos os valores)
  const subtotalCalculado = comanda.itens?.reduce((sum, item) => sum + Number(item.valor_total), 0) || 0
  const subtotal = subtotalCalculado || Number(comanda.subtotal) || 0

  // Calcular total: subtotal - desconto + acrescimo
  const desconto = Number(comanda.desconto) || 0
  const acrescimo = Number(comanda.acrescimo) || 0
  const totalCalculado = subtotal - desconto + acrescimo
  const total = totalCalculado || Number(comanda.total) || 0

  const totalPago = comanda.pagamentos?.reduce((sum, p) => sum + Number(p.valor), 0) || 0
  const saldoRestante = total - totalPago
  const statusInfo = statusConfig[comanda.status] || statusConfig.aberta
  const podeEditar = comanda.status !== 'paga' && comanda.status !== 'cancelada'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/comandas')} className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="page-title">Comanda #{comanda.numero}</h1>
          <p className="text-slate-500 flex items-center gap-2">
            <User size={14} />
            {comanda.nome_cliente || comanda.cliente?.nome || 'Cliente nao informado'}
          </p>
        </div>
      </div>

      {/* Status em Destaque */}
      <div className={cn('p-6 rounded-2xl border-2 text-center', statusInfo.bgColor)}>
        <div className="flex items-center justify-center gap-3">
          <Receipt size={32} className={statusInfo.color} />
          <span className={cn('text-2xl font-bold', statusInfo.color)}>
            {statusInfo.label}
          </span>
        </div>
        {comanda.data_abertura && (
          <p className="mt-2 text-sm text-slate-600 flex items-center justify-center gap-1">
            <Calendar size={14} />
            Data: {masks.date(comanda.data_abertura)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itens - Separados por tipo */}
        <div className="lg:col-span-2 space-y-4">
          {/* Servicos */}
          {comanda.itens?.filter(i => i.tipo === 'servico').length ? (
            <div className="card">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <Scissors size={18} className="text-purple-600" />
                Servicos ({comanda.itens.filter(i => i.tipo === 'servico').length})
              </h3>
              <div className="space-y-3">
                {comanda.itens.filter(i => i.tipo === 'servico').map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
                        <Scissors size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{item.descricao}</p>
                        <p className="text-sm text-slate-500">
                          {item.colaborador_nome && <span className="text-purple-600">{item.colaborador_nome} | </span>}
                          {item.quantidade}x {formatters.currency(Number(item.valor_unitario))}
                          {Number(item.comissao_percentual) > 0 && <span className="text-slate-400"> | {item.comissao_percentual}% comissao</span>}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-purple-700">{formatters.currency(Number(item.valor_total))}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Produtos */}
          {comanda.itens?.filter(i => i.tipo === 'produto').length ? (
            <div className="card">
              <h3 className="section-title mb-4 flex items-center gap-2">
                <Package size={18} className="text-blue-600" />
                Produtos ({comanda.itens.filter(i => i.tipo === 'produto').length})
              </h3>
              <div className="space-y-3">
                {comanda.itens.filter(i => i.tipo === 'produto').map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                        <Package size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{item.descricao}</p>
                        <p className="text-sm text-slate-500">
                          {item.quantidade}x {formatters.currency(Number(item.valor_unitario))}
                          {Number(item.comissao_percentual) > 0 && <span className="text-slate-400"> | {item.comissao_percentual}% comissao</span>}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-blue-700">{formatters.currency(Number(item.valor_total))}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Mensagem quando vazio */}
          {!comanda.itens?.length && (
            <div className="card">
              <p className="text-center text-slate-400 py-8">Nenhum item na comanda</p>
            </div>
          )}
        </div>

        {/* Resumo e Pagamentos */}
        <div className="space-y-6">
          {/* Resumo */}
          <div className="card">
            <h3 className="section-title mb-4">Resumo Financeiro</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatters.currency(subtotal)}</span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto</span>
                  <span>-{formatters.currency(desconto)}</span>
                </div>
              )}
              {acrescimo > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Acrescimo</span>
                  <span>+{formatters.currency(acrescimo)}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary-600">{formatters.currency(total)}</span>
              </div>
            </div>
          </div>

          {/* Pagamentos */}
          <div className="card">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-green-600" />
              Pagamentos
            </h3>
            {comanda.pagamentos?.length ? (
              <div className="space-y-2">
                {comanda.pagamentos.map(pag => (
                  <div key={pag.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-slate-700">{pag.tipo_recebimento_nome}</span>
                    <span className="font-medium text-green-600">{formatters.currency(Number(pag.valor))}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-4">Nenhum pagamento registrado</p>
            )}

            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Pago</span>
                <span className="text-green-600 font-medium">{formatters.currency(totalPago)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Saldo Restante</span>
                <span className={cn('font-medium', saldoRestante > 0 ? 'text-red-600' : 'text-green-600')}>
                  {formatters.currency(saldoRestante)}
                </span>
              </div>
            </div>
          </div>

          {/* Observacoes */}
          {comanda.observacoes && (
            <div className="card">
              <h3 className="section-title mb-2">Observacoes</h3>
              <p className="text-sm text-slate-600">{comanda.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Botoes de Acao */}
      <div className="flex justify-center gap-4 pt-4">
        <Button
          variant="secondary"
          onClick={() => setIsPrintOpen(true)}
          className="px-6"
        >
          <Printer size={18} /> Imprimir
        </Button>

        {podeEditar && (
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCancelOpen(true)}
              className="px-6 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle size={18} /> Cancelar Comanda
            </Button>

            <Button
              onClick={() => setIsContinuarOpen(true)}
              className="px-6 bg-green-600 hover:bg-green-700"
            >
              <Play size={18} /> Continuar / Fechar
            </Button>
          </>
        )}
      </div>

      {/* Modais */}
      <ConfirmModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancelar comanda?"
        message={`Deseja cancelar a comanda #${comanda.numero}? Esta acao nao pode ser desfeita.`}
        confirmText="Cancelar Comanda"
        loading={cancelMutation.isPending}
      />

      <NovaComandaNormalModal
        isOpen={isContinuarOpen}
        onClose={() => {
          setIsContinuarOpen(false)
          queryClient.invalidateQueries({ queryKey: ['comanda', id] })
        }}
        comanda={comanda as Comanda}
      />

      <ImprimirComandaModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        comanda={comanda as Comanda}
      />
    </div>
  )
}
