import { useRef } from 'react'
import { Modal, Button } from '../../components/ui'
import { formatters, masks } from '../../utils/masks'
import { Printer, X } from 'lucide-react'
import type { Comanda } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  comanda: Comanda | null
}

export default function ImprimirComandaModal({ isOpen, onClose, comanda }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!printRef.current) return

    const printContent = printRef.current.innerHTML
    const printWindow = window.open('', '', 'width=300,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comanda #${comanda?.numero}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              padding: 5mm;
            }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h1 { font-size: 16px; font-weight: bold; }
            .header p { font-size: 11px; }
            .info { margin: 10px 0; }
            .info p { margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .items { margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .item-desc { flex: 1; }
            .item-price { text-align: right; font-weight: bold; }
            .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .total-row.final { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .payments { margin-top: 10px; }
            .payment { display: flex; justify-content: space-between; margin: 3px 0; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
            .status { text-align: center; font-weight: bold; margin: 10px 0; padding: 5px; border: 1px solid #000; }
            @media print {
              body { width: 80mm; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  if (!comanda) return null

  const totalPago = comanda.pagamentos?.reduce((sum, p) => sum + Number(p.valor), 0) || 0
  const saldoRestante = Number(comanda.total) - totalPago

  const statusLabels: Record<string, string> = {
    aberta: 'ABERTA',
    em_atendimento: 'EM ATENDIMENTO',
    aguardando_pagamento: 'AGUARDANDO PAGAMENTO',
    paga: 'PAGA',
    cancelada: 'CANCELADA',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Imprimir Cupom" size="sm">
      <div className="space-y-4">
        {/* Preview do cupom */}
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div ref={printRef} style={{ fontFamily: "'Courier New', monospace", fontSize: '12px' }}>
            {/* Header */}
            <div className="header" style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 'bold' }}>COMANDA #{comanda.numero}</h1>
              {comanda.data_abertura && (
                <p style={{ fontSize: '11px' }}>{masks.dateTime(comanda.data_abertura)}</p>
              )}
            </div>

            {/* Info Cliente */}
            <div className="info" style={{ margin: '10px 0' }}>
              <p><strong>Cliente:</strong> {comanda.nome_cliente || comanda.cliente?.nome || 'Nao informado'}</p>
            </div>

            {/* Status */}
            <div className="status" style={{ textAlign: 'center', fontWeight: 'bold', margin: '10px 0', padding: '5px', border: '1px solid #000' }}>
              {statusLabels[comanda.status] || comanda.status.toUpperCase()}
            </div>

            {/* Divider */}
            <div className="divider" style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

            {/* Servicos */}
            {comanda.itens?.filter(i => i.tipo === 'servico').length ? (
              <div className="items" style={{ margin: '10px 0' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>SERVICOS:</p>
                {comanda.itens.filter(i => i.tipo === 'servico').map((item, idx) => (
                  <div key={idx} className="item" style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                    <span className="item-desc" style={{ flex: 1 }}>
                      {Number(item.quantidade)}x {item.descricao}
                      {item.colaborador_nome && <span style={{ fontSize: '10px', display: 'block' }}>({item.colaborador_nome})</span>}
                    </span>
                    <span className="item-price" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {formatters.currency(Number(item.valor_total))}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Produtos */}
            {comanda.itens?.filter(i => i.tipo === 'produto').length ? (
              <div className="items" style={{ margin: '10px 0' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>PRODUTOS:</p>
                {comanda.itens.filter(i => i.tipo === 'produto').map((item, idx) => (
                  <div key={idx} className="item" style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                    <span className="item-desc" style={{ flex: 1 }}>
                      {Number(item.quantidade)}x {item.descricao}
                    </span>
                    <span className="item-price" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {formatters.currency(Number(item.valor_total))}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Totais */}
            <div className="totals" style={{ marginTop: '10px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
              <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                <span>Subtotal:</span>
                <span>{formatters.currency(Number(comanda.subtotal))}</span>
              </div>
              {Number(comanda.desconto) > 0 && (
                <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>Desconto:</span>
                  <span>-{formatters.currency(Number(comanda.desconto))}</span>
                </div>
              )}
              {Number(comanda.acrescimo) > 0 && (
                <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>Acrescimo:</span>
                  <span>+{formatters.currency(Number(comanda.acrescimo))}</span>
                </div>
              )}
              <div className="total-row final" style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', fontSize: '14px', fontWeight: 'bold', marginTop: '5px' }}>
                <span>TOTAL:</span>
                <span>{formatters.currency(Number(comanda.total))}</span>
              </div>
            </div>

            {/* Pagamentos */}
            {comanda.pagamentos && comanda.pagamentos.length > 0 && (
              <div className="payments" style={{ marginTop: '10px' }}>
                <div className="divider" style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>PAGAMENTOS:</p>
                {comanda.pagamentos.map((pag, idx) => (
                  <div key={idx} className="payment" style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>{pag.tipo_recebimento_nome}</span>
                    <span>{formatters.currency(Number(pag.valor))}</span>
                  </div>
                ))}
                <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', marginTop: '5px' }}>
                  <span><strong>Total Pago:</strong></span>
                  <span><strong>{formatters.currency(totalPago)}</strong></span>
                </div>
                {saldoRestante > 0 && (
                  <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>Restante:</span>
                    <span>{formatters.currency(saldoRestante)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Observacoes */}
            {comanda.observacoes && (
              <div style={{ marginTop: '10px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
                <p><strong>Obs:</strong> {comanda.observacoes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="footer" style={{ textAlign: 'center', marginTop: '15px', fontSize: '10px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
              <p>Obrigado pela preferencia!</p>
              <p>SGSx - Sistema de Gestao</p>
            </div>
          </div>
        </div>

        {/* Botoes */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            <X size={16} /> Fechar
          </Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer size={16} /> Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  )
}
