import { useQuery } from '@tanstack/react-query'
import { Modal, Badge } from '../../components/ui'
import { formatters } from '../../utils/masks'
import {
  Receipt,
  User,
  Scissors,
  Package,
  CreditCard,
  FileText,
  X,
  Loader2,
} from 'lucide-react'
import { comandasService } from '../../services/comandas.service'
import { cn } from '../../utils/cn'
import type { StatusComanda } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  comandaId: string | null
}

const statusConfig: Record<StatusComanda, { label: string; color: string }> = {
  aberta: { label: 'Aberta', color: 'bg-blue-100 text-blue-700' },
  em_atendimento: { label: 'Em Atendimento', color: 'bg-yellow-100 text-yellow-700' },
  aguardando_pagamento: { label: 'Aguardando Pagamento', color: 'bg-orange-100 text-orange-700' },
  paga: { label: 'Paga', color: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
}

export default function ComandaDetalheModal({ isOpen, onClose, comandaId }: Props) {
  const { data: comanda, isLoading } = useQuery({
    queryKey: ['comanda-detalhe', comandaId],
    queryFn: () => comandasService.get(comandaId!),
    enabled: isOpen && !!comandaId,
  })

  if (!isOpen) return null

  const totalPago = comanda?.pagamentos?.reduce((sum, p) => sum + Number(p.valor), 0) || 0
  const saldoRestante = Number(comanda?.total || 0) - totalPago

  const servicos = comanda?.itens?.filter(i => i.tipo === 'servico') || []
  const produtos = comanda?.itens?.filter(i => i.tipo === 'produto') || []

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes da Comanda" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : comanda ? (
        <div className="space-y-6">
          {/* Header com numero e status */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Comanda #{comanda.numero}
                </h3>
                <p className="text-sm text-slate-500">
                  {comanda.data_abertura && formatters.dateTimeShortBR(comanda.data_abertura)}
                </p>
              </div>
            </div>
            <Badge className={cn('px-3 py-1.5', statusConfig[comanda.status]?.color)}>
              {statusConfig[comanda.status]?.label || comanda.status}
            </Badge>
          </div>

          {/* Info do cliente */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <User className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Cliente</p>
              <p className="font-medium text-slate-700">
                {comanda.nome_cliente || comanda.cliente?.nome || 'Nao informado'}
              </p>
            </div>
          </div>

          {/* Servicos */}
          {servicos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Scissors className="w-4 h-4 text-purple-500" />
                <h4 className="font-semibold text-slate-700">Servicos</h4>
                <Badge variant="default" size="sm">{servicos.length}</Badge>
              </div>
              <div className="space-y-2">
                {servicos.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-700">{item.descricao}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        {item.colaborador_nome && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.colaborador_nome}
                          </span>
                        )}
                        <span>{Number(item.quantidade)}x {formatters.currency(Number(item.valor_unitario))}</span>
                        {Number(item.comissao_percentual) > 0 && (
                          <span className="text-green-600">
                            Comissao: {item.comissao_percentual}% ({formatters.currency(Number(item.comissao_valor))})
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-purple-700">
                      {formatters.currency(Number(item.valor_total))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produtos */}
          {produtos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-blue-500" />
                <h4 className="font-semibold text-slate-700">Produtos</h4>
                <Badge variant="default" size="sm">{produtos.length}</Badge>
              </div>
              <div className="space-y-2">
                {produtos.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-700">{item.descricao}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                        <span>{Number(item.quantidade)}x {formatters.currency(Number(item.valor_unitario))}</span>
                        {Number(item.comissao_percentual) > 0 && (
                          <span className="text-green-600">
                            Comissao: {item.comissao_percentual}% ({formatters.currency(Number(item.comissao_valor))})
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-blue-700">
                      {formatters.currency(Number(item.valor_total))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totais */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-700">{formatters.currency(Number(comanda.subtotal))}</span>
            </div>
            {Number(comanda.desconto) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Desconto</span>
                <span className="text-red-600">-{formatters.currency(Number(comanda.desconto))}</span>
              </div>
            )}
            {Number(comanda.desconto_percentual) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Desconto ({comanda.desconto_percentual}%)</span>
                <span className="text-red-600">
                  -{formatters.currency(Number(comanda.subtotal) * Number(comanda.desconto_percentual) / 100)}
                </span>
              </div>
            )}
            {Number(comanda.acrescimo) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Acrescimo</span>
                <span className="text-slate-700">+{formatters.currency(Number(comanda.acrescimo))}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-700">Total</span>
              <span className="text-lg font-bold text-slate-800">
                {formatters.currency(Number(comanda.total))}
              </span>
            </div>
          </div>

          {/* Pagamentos */}
          {comanda.pagamentos && comanda.pagamentos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-green-500" />
                <h4 className="font-semibold text-slate-700">Pagamentos</h4>
              </div>
              <div className="space-y-2">
                {comanda.pagamentos.map((pag) => (
                  <div
                    key={pag.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                  >
                    <div>
                      <p className="font-medium text-slate-700">{pag.tipo_recebimento_nome}</p>
                      {pag.data_pagamento && (
                        <p className="text-xs text-slate-500">
                          {formatters.dateTimeShortBR(pag.data_pagamento)}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-green-700">
                      {formatters.currency(Number(pag.valor))}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-slate-100 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Pago</span>
                  <span className="font-semibold text-slate-700">
                    {formatters.currency(totalPago)}
                  </span>
                </div>
                {saldoRestante > 0.01 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-orange-600">Saldo Restante</span>
                    <span className="font-semibold text-orange-600">
                      {formatters.currency(saldoRestante)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observacoes */}
          {comanda.observacoes && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h4 className="font-semibold text-slate-700">Observacoes</h4>
              </div>
              <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                {comanda.observacoes}
              </p>
            </div>
          )}

          {/* Botao Fechar */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Fechar
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Comanda nao encontrada
        </div>
      )}
    </Modal>
  )
}
