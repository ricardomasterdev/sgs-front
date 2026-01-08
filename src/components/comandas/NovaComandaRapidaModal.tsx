import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { comandasService } from '../../services/comandas.service'
import { clientesService } from '../../services/clientes.service'
import { colaboradoresService } from '../../services/colaboradores.service'
import { servicosService } from '../../services/servicos.service'
import { produtosService } from '../../services/produtos.service'
import { tiposRecebimentoService } from '../../services/tipos-recebimento.service'
import { Modal, Button } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import { formatters, masks } from '../../utils/masks'
import toast from 'react-hot-toast'
import { Search, User, Scissors, Package, CreditCard, Plus, Minus, X, Check, UserPlus, Phone, Calendar, CheckCircle, Receipt } from 'lucide-react'
import type { Servico, Produto, Comanda } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface ItemComanda {
  id: string
  tipo: 'servico' | 'produto'
  servico_id?: string
  produto_id?: string
  colaborador_id?: string
  colaborador_nome?: string
  descricao: string
  preco: number
  quantidade: number
  comissao_percentual: number
}

interface PagamentoItem {
  id: string
  tipo_recebimento_id: string
  tipo_nome: string
  valor: number
}

type ModalMode = 'criar' | 'fechar'

export default function NovaComandaRapidaModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Modo do modal: criar ou fechar
  const [mode, setMode] = useState<ModalMode>('criar')
  const [comandaCriada, setComandaCriada] = useState<Comanda | null>(null)

  // Estados do formulario
  const [clienteSearch, setClienteSearch] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [clienteNome, setClienteNome] = useState('')
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoClienteNome, setNovoClienteNome] = useState('')
  const [novoClienteCelular, setNovoClienteCelular] = useState('')
  const [dataComanda, setDataComanda] = useState<string>(() => {
    const hoje = new Date()
    const dia = String(hoje.getDate()).padStart(2, '0')
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ano = hoje.getFullYear()
    return `${dia}/${mes}/${ano}`
  })

  const [itensComanda, setItensComanda] = useState<ItemComanda[]>([])
  const [abaAtiva, setAbaAtiva] = useState<'servico' | 'produto' | null>(null)
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([])
  const [selectedTipoRecebimentoId, setSelectedTipoRecebimentoId] = useState<string>('')
  const [pagamentoValor, setPagamentoValor] = useState<string>('')

  // Estados para adicionar servico
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string>('')
  const [selectedServicoId, setSelectedServicoId] = useState<string>('')
  const [servicoQuantidade, setServicoQuantidade] = useState<string>('1')
  const [servicoPreco, setServicoPreco] = useState<string>('')
  const [servicoComissao, setServicoComissao] = useState<string>('')
  const [servicosDoColaborador, setServicosDoColaborador] = useState<Servico[]>([])
  const [colaboradorSearch, setColaboradorSearch] = useState('')
  const [servicoSearch, setServicoSearch] = useState('')
  const [showColaboradorDropdown, setShowColaboradorDropdown] = useState(false)
  const [showServicoDropdown, setShowServicoDropdown] = useState(false)

  // Estados para adicionar produto
  const [selectedProdutoId, setSelectedProdutoId] = useState<string>('')
  const [produtoQuantidade, setProdutoQuantidade] = useState<string>('1')
  const [produtoPreco, setProdutoPreco] = useState<string>('')
  const [produtoComissao, setProdutoComissao] = useState<string>('')
  const [produtoSearch, setProdutoSearch] = useState('')
  const [showProdutoDropdown, setShowProdutoDropdown] = useState(false)

  // Queries
  const { data: clientesSearch } = useQuery({
    queryKey: ['clientes-search', clienteSearch],
    queryFn: () => clientesService.search(clienteSearch),
    enabled: clienteSearch.length >= 2 && showClienteDropdown,
  })

  const { data: colaboradoresData } = useQuery({
    queryKey: ['colaboradores-comanda'],
    queryFn: () => colaboradoresService.list({ per_page: 100, ativo: true }),
    enabled: isOpen,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: servicosData } = useQuery({
    queryKey: ['servicos-comanda'],
    queryFn: () => servicosService.list({ per_page: 100, ativo: true }),
    enabled: isOpen,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: produtosData } = useQuery({
    queryKey: ['produtos-comanda'],
    queryFn: () => produtosService.list({ per_page: 100, ativo: true }),
    enabled: isOpen,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: tiposRecebimentoData } = useQuery({
    queryKey: ['tipos-recebimento-comanda'],
    queryFn: () => tiposRecebimentoService.list({ per_page: 50, ativo: true }),
    enabled: isOpen,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('criar')
      setComandaCriada(null)
      setClienteSearch('')
      setClienteId(null)
      setClienteNome('')
      setShowNovoCliente(false)
      setNovoClienteNome('')
      setNovoClienteCelular('')
      const hoje = new Date()
      const dia = String(hoje.getDate()).padStart(2, '0')
      const mes = String(hoje.getMonth() + 1).padStart(2, '0')
      const ano = hoje.getFullYear()
      setDataComanda(`${dia}/${mes}/${ano}`)
      setItensComanda([])
      setAbaAtiva(null)
      setPagamentos([])
      setSelectedTipoRecebimentoId('')
      setPagamentoValor('')
      resetServicoForm()
      resetProdutoForm()
    }
  }, [isOpen])

  // Atualizar servicos quando seleciona colaborador
  useEffect(() => {
    if (selectedColaboradorId && colaboradoresData?.items && servicosData?.items) {
      const colaborador = colaboradoresData.items.find(c => c.id === selectedColaboradorId)
      if (colaborador?.servicos && colaborador.servicos.length > 0) {
        const servicosIds = colaborador.servicos.map(s => s.servico_id)
        const servicosFiltrados = servicosData.items.filter(s => servicosIds.includes(s.id))
        setServicosDoColaborador(servicosFiltrados)
      } else {
        setServicosDoColaborador(servicosData.items)
      }
      setSelectedServicoId('')
      setServicoPreco('')
      setServicoComissao('')
    } else {
      setServicosDoColaborador([])
    }
  }, [selectedColaboradorId, colaboradoresData, servicosData])

  // Atualizar preco/comissao quando seleciona servico
  useEffect(() => {
    if (selectedServicoId && servicosData?.items) {
      const servico = servicosData.items.find(s => s.id === selectedServicoId)
      if (servico) {
        setServicoPreco(String(Number(servico.preco)))
        setServicoComissao(String(Number(servico.comissao_percentual ?? 0)))
      }
    }
  }, [selectedServicoId, servicosData])

  // Atualizar preco/comissao quando seleciona produto
  useEffect(() => {
    if (selectedProdutoId && produtosData?.items) {
      const produto = produtosData.items.find(p => p.id === selectedProdutoId)
      if (produto) {
        setProdutoPreco(String(Number(produto.preco_venda)))
        setProdutoComissao(String(Number(produto.comissao_percentual ?? 0)))
      }
    }
  }, [selectedProdutoId, produtosData])

  const resetServicoForm = () => {
    setSelectedColaboradorId('')
    setSelectedServicoId('')
    setServicoQuantidade('1')
    setServicoPreco('')
    setServicoComissao('')
    setServicosDoColaborador([])
    setColaboradorSearch('')
    setServicoSearch('')
    setShowColaboradorDropdown(false)
    setShowServicoDropdown(false)
  }

  const resetProdutoForm = () => {
    setSelectedProdutoId('')
    setProdutoQuantidade('1')
    setProdutoPreco('')
    setProdutoComissao('')
    setProdutoSearch('')
    setShowProdutoDropdown(false)
  }

  // Calcular total
  const total = mode === 'criar'
    ? itensComanda.reduce((sum, item) => sum + (item.preco * item.quantidade), 0)
    : comandaCriada?.total || 0
  const totalPagamentos = pagamentos.reduce((sum, p) => sum + p.valor, 0)
  const restante = total - totalPagamentos

  // Mutation para criar cliente
  const createClienteMutation = useMutation({
    mutationFn: () => clientesService.create({
      nome: novoClienteNome,
      celular: novoClienteCelular || undefined,
    }),
    onSuccess: (cliente) => {
      setClienteId(cliente.id)
      setClienteNome(cliente.nome)
      setClienteSearch(cliente.nome)
      setShowNovoCliente(false)
      setNovoClienteNome('')
      setNovoClienteCelular('')
      toast.success('Cliente cadastrado!')
    },
    onError: () => toast.error('Erro ao cadastrar cliente'),
  })

  // Mutation para criar comanda
  const createMutation = useMutation({
    mutationFn: async () => {
      const dataISO = masks.dateToISO(dataComanda)
      const comanda = await comandasService.create({
        cliente_id: clienteId || undefined,
        nome_cliente: clienteNome || undefined,
        data_abertura: dataISO ? `${dataISO}T12:00:00` : undefined,
        itens: itensComanda.map(item => ({
          tipo: item.tipo,
          servico_id: item.servico_id,
          produto_id: item.produto_id,
          colaborador_id: item.colaborador_id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.preco,
          comissao_percentual: item.comissao_percentual,
        }))
      })
      return comanda
    },
    onSuccess: (comanda) => {
      queryClient.invalidateQueries({ queryKey: ['comandas', salao?.id] })
      toast.success('Comanda criada!')
      // Mudar para modo fechar
      setComandaCriada(comanda)
      setMode('fechar')
      setPagamentos([])
      setSelectedTipoRecebimentoId('')
      setPagamentoValor('')
    },
    onError: () => toast.error('Erro ao criar comanda'),
  })

  // Mutation para fechar comanda (atualizar status para paga)
  const fecharComandaMutation = useMutation({
    mutationFn: async () => {
      if (!comandaCriada) throw new Error('Comanda não encontrada')

      // Adicionar pagamentos pendentes
      for (const pag of pagamentos) {
        await comandasService.addPagamento(comandaCriada.id, {
          tipo_recebimento_id: pag.tipo_recebimento_id,
          valor: pag.valor,
        })
      }

      // Buscar comanda atualizada
      return comandasService.get(comandaCriada.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas', salao?.id] })
      toast.success('Comanda fechada com sucesso!')
      onClose()
    },
    onError: () => toast.error('Erro ao fechar comanda'),
  })

  // Handlers
  const handleSelectCliente = (cliente: { id: string; nome: string }) => {
    setClienteId(cliente.id)
    setClienteNome(cliente.nome)
    setClienteSearch(cliente.nome)
    setShowClienteDropdown(false)
  }

  const handleClienteInputChange = (value: string) => {
    setClienteSearch(value)
    setClienteNome(value)
    setClienteId(null)
    setShowClienteDropdown(true)
  }

  const addServico = () => {
    if (!selectedServicoId || !servicoPreco) return

    const servico = servicosData?.items?.find(s => s.id === selectedServicoId)
    const colaborador = colaboradoresData?.items?.find(c => c.id === selectedColaboradorId)

    if (!servico) return

    const novoItem: ItemComanda = {
      id: `${Date.now()}-${servico.id}`,
      tipo: 'servico',
      servico_id: servico.id,
      colaborador_id: selectedColaboradorId || undefined,
      colaborador_nome: colaborador?.nome,
      descricao: servico.nome,
      preco: parseFloat(servicoPreco) || 0,
      quantidade: parseInt(servicoQuantidade) || 1,
      comissao_percentual: parseFloat(servicoComissao) || 0,
    }
    setItensComanda([...itensComanda, novoItem])
    resetServicoForm()
  }

  const addProduto = () => {
    if (!selectedProdutoId || !produtoPreco) return

    const produto = produtosData?.items?.find(p => p.id === selectedProdutoId)

    if (!produto) return

    const novoItem: ItemComanda = {
      id: `${Date.now()}-${produto.id}`,
      tipo: 'produto',
      produto_id: produto.id,
      descricao: produto.nome,
      preco: parseFloat(produtoPreco) || 0,
      quantidade: parseInt(produtoQuantidade) || 1,
      comissao_percentual: parseFloat(produtoComissao) || 0,
    }
    setItensComanda([...itensComanda, novoItem])
    resetProdutoForm()
  }

  const removeItem = (itemId: string) => {
    setItensComanda(itensComanda.filter(item => item.id !== itemId))
  }

  const updateQuantidade = (itemId: string, delta: number) => {
    setItensComanda(itensComanda.map(item => {
      if (item.id === itemId) {
        const newQtd = Math.max(1, item.quantidade + delta)
        return { ...item, quantidade: newQtd }
      }
      return item
    }))
  }

  const addPagamento = () => {
    if (!selectedTipoRecebimentoId || !pagamentoValor) return

    const tipo = tiposRecebimentoData?.items?.find(t => t.id === selectedTipoRecebimentoId)
    if (!tipo) return

    const valor = parseFloat(pagamentoValor) || 0
    if (valor <= 0) return

    const novoPagamento: PagamentoItem = {
      id: `${Date.now()}-${selectedTipoRecebimentoId}`,
      tipo_recebimento_id: selectedTipoRecebimentoId,
      tipo_nome: tipo.nome,
      valor,
    }
    setPagamentos([...pagamentos, novoPagamento])
    setSelectedTipoRecebimentoId('')
    setPagamentoValor('')
  }

  const removePagamento = (pagamentoId: string) => {
    setPagamentos(pagamentos.filter(p => p.id !== pagamentoId))
  }

  const preencherRestante = () => {
    if (restante > 0) {
      setPagamentoValor(restante.toFixed(2))
    }
  }

  // Handler para selecionar forma de pagamento (auto-preenche valor restante)
  const handleSelectTipoRecebimento = (tipoId: string) => {
    setSelectedTipoRecebimentoId(tipoId)
    // Calcula o restante considerando pagamentos existentes da comanda criada
    const pagamentosExistentes = comandaCriada?.pagamentos?.reduce((sum, p) => sum + Number(p.valor), 0) || 0
    const totalPago = pagamentos.reduce((sum, p) => sum + p.valor, 0) + pagamentosExistentes
    const valorRestante = (comandaCriada ? Number(comandaCriada.total) : total) - totalPago
    if (tipoId && valorRestante > 0) {
      setPagamentoValor(valorRestante.toFixed(2))
    }
  }

  // Handlers para selecionar colaborador/servico
  const handleSelectColaborador = (colaboradorId: string, colaboradorNome: string) => {
    setSelectedColaboradorId(colaboradorId)
    setColaboradorSearch(colaboradorNome)
    setShowColaboradorDropdown(false)
    setSelectedServicoId('')
    setServicoSearch('')
    setServicoPreco('')
    setServicoComissao('')
  }

  const handleSelectServico = (servico: Servico) => {
    setSelectedServicoId(servico.id)
    setServicoSearch(`R$ ${Number(servico.preco).toFixed(2)} - ${servico.nome}`)
    setShowServicoDropdown(false)
    setServicoPreco(String(Number(servico.preco)))
    setServicoComissao(String(Number(servico.comissao_percentual ?? 0)))
  }

  // Filtrar colaboradores pela busca
  const colaboradoresFiltrados = colaboradoresData?.items?.filter(c =>
    c.nome.toLowerCase().includes(colaboradorSearch.toLowerCase())
  ) || []

  // Filtrar servicos pela busca
  const servicosFiltrados = servicosDoColaborador.filter(s =>
    s.nome.toLowerCase().includes(servicoSearch.toLowerCase())
  )

  // Handler para selecionar produto
  const handleSelectProduto = (produto: Produto) => {
    setSelectedProdutoId(produto.id)
    setProdutoSearch(`R$ ${Number(produto.preco_venda).toFixed(2)} - ${produto.nome}`)
    setShowProdutoDropdown(false)
    setProdutoPreco(String(Number(produto.preco_venda)))
    setProdutoComissao(String(Number(produto.comissao_percentual ?? 0)))
  }

  // Filtrar produtos pela busca
  const produtosFiltrados = produtosData?.items?.filter(p =>
    p.nome.toLowerCase().includes(produtoSearch.toLowerCase())
  ) || []

  const canSubmit = itensComanda.length > 0
  const canAddServico = selectedColaboradorId && selectedServicoId && servicoPreco
  const canAddProduto = selectedProdutoId && produtoPreco
  const canAddPagamento = selectedTipoRecebimentoId && pagamentoValor && parseFloat(pagamentoValor) > 0
  const canFechar = pagamentos.length > 0 && restante <= 0

  // Renderizar modo FECHAR
  if (mode === 'fechar' && comandaCriada) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Fechar Comanda" size="md">
        <div className="space-y-5">
          {/* Info da Comanda */}
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Receipt size={24} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-800">Comanda #{comandaCriada.numero}</p>
                <p className="text-sm text-green-600">
                  {comandaCriada.nome_cliente || comandaCriada.cliente?.nome || 'Cliente nao informado'}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-green-200">
              <span className="text-green-700 font-medium">Total da Comanda:</span>
              <span className="text-2xl font-bold text-green-800">{formatters.currency(total)}</span>
            </div>
          </div>

          {/* Adicionar Pagamento */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <h4 className="font-medium text-slate-700 flex items-center gap-2">
              <CreditCard size={18} className="text-primary-600" />
              Adicionar Pagamento
            </h4>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-600 mb-1">Forma de Pagamento</label>
                <select
                  value={selectedTipoRecebimentoId}
                  onChange={(e) => handleSelectTipoRecebimento(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">Selecione...</option>
                  {tiposRecebimentoData?.items?.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs text-slate-600 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={pagamentoValor}
                  onChange={(e) => setPagamentoValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              {restante > 0 && (
                <button
                  type="button"
                  onClick={preencherRestante}
                  className="px-2 py-2 text-xs text-primary-600 hover:text-primary-800 underline whitespace-nowrap"
                >
                  Total
                </button>
              )}
              <Button
                type="button"
                onClick={addPagamento}
                disabled={!canAddPagamento}
                className="px-4"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Lista de Pagamentos */}
          {pagamentos.length > 0 && (
            <div className="space-y-2">
              {pagamentos.map(pag => (
                <div key={pag.id} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-green-600" />
                    <span className="text-sm text-slate-700">{pag.tipo_nome}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-green-700">{formatters.currency(pag.valor)}</span>
                    <button
                      type="button"
                      onClick={() => removePagamento(pag.id)}
                      className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resumo */}
          <div className="bg-slate-100 p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Comanda:</span>
              <span className="font-medium">{formatters.currency(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total Pagamentos:</span>
              <span className="font-medium text-green-600">{formatters.currency(totalPagamentos)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
              <span className="font-medium">Restante:</span>
              <span className={`font-bold ${restante > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatters.currency(restante)}
              </span>
            </div>
          </div>

          {/* Botoes */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Fechar Depois
            </Button>
            <Button
              onClick={() => fecharComandaMutation.mutate()}
              loading={fecharComandaMutation.isPending}
              disabled={!canFechar}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle size={18} />
              Fechar Comanda
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  // Renderizar modo CRIAR
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comanda Rapida" size="xl">
      <div className="space-y-5 max-h-[80vh] overflow-y-auto">
        {/* Cliente */}
        <div className={`relative p-3 rounded-lg transition-colors ${clienteId ? 'bg-green-50 border border-green-200' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <label className={`text-sm font-medium flex items-center gap-1 ${clienteId ? 'text-green-700' : 'text-slate-700'}`}>
              <User size={14} /> Cliente {clienteId && <Check size={14} className="text-green-600" />}
            </label>
            <button
              type="button"
              onClick={() => setShowNovoCliente(!showNovoCliente)}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <UserPlus size={12} /> {showNovoCliente ? 'Cancelar' : 'Novo cliente'}
            </button>
          </div>

          {!showNovoCliente ? (
            <>
              <div className="relative">
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${clienteId ? 'text-green-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou celular..."
                  value={clienteSearch}
                  onChange={(e) => handleClienteInputChange(e.target.value)}
                  onFocus={() => setShowClienteDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                  className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm ${clienteId ? 'border-green-300 bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100' : 'border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'}`}
                />
              </div>
              {showClienteDropdown && clientesSearch && clientesSearch.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {clientesSearch.map(cliente => (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => handleSelectCliente(cliente)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-700">{cliente.nome}</span>
                        {cliente.celular && (
                          <span className="text-slate-500 flex items-center gap-1">
                            <Phone size={12} /> {cliente.celular}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-50 p-3 rounded-lg space-y-2">
              <input
                type="text"
                placeholder="Nome do cliente *"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Celular (opcional)"
                  value={novoClienteCelular}
                  onChange={(e) => setNovoClienteCelular(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                <Button
                  type="button"
                  onClick={() => createClienteMutation.mutate()}
                  disabled={!novoClienteNome.trim()}
                  loading={createClienteMutation.isPending}
                  className="px-4"
                >
                  Cadastrar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Data da Comanda */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1 whitespace-nowrap">
            <Calendar size={14} /> Data:
          </label>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="DD/MM/AAAA"
              value={dataComanda}
              onChange={(e) => setDataComanda(masks.dateBR(e.target.value))}
              className="w-28 px-2 py-2 rounded-l-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-sm text-center"
            />
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker()}
              className="px-2 py-2 rounded-r-lg border border-l-0 border-slate-200 hover:bg-slate-50"
            >
              <Calendar size={16} className="text-slate-500" />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={masks.dateToISO(dataComanda) || ''}
              onChange={(e) => {
                if (e.target.value) {
                  setDataComanda(masks.dateFromISO(e.target.value))
                }
              }}
              className="absolute opacity-0 pointer-events-none w-0 h-0"
            />
          </div>
          <span className="text-xs text-slate-400">(controle de caixa)</span>
        </div>

        {/* Botoes Incluir Servico / Produto */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAbaAtiva(abaAtiva === 'servico' ? null : 'servico')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
              abaAtiva === 'servico'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            <Scissors size={16} /> Incluir Servico
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva(abaAtiva === 'produto' ? null : 'produto')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
              abaAtiva === 'produto'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <Package size={16} /> Incluir Produto
          </button>
        </div>

        {/* Form Servico expandido */}
        {abaAtiva === 'servico' && (
          <div className="bg-purple-50 p-4 rounded-xl space-y-3 border border-purple-200">
            <div className="flex items-end gap-2">
              {/* Profissional com busca */}
              <div className="flex-1 min-w-0 relative">
                <label className="block text-xs text-purple-700 mb-1">Profissional</label>
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={colaboradorSearch}
                    onChange={(e) => {
                      setColaboradorSearch(e.target.value)
                      setShowColaboradorDropdown(true)
                      if (!e.target.value) {
                        setSelectedColaboradorId('')
                        setSelectedServicoId('')
                        setServicoSearch('')
                        setServicoPreco('')
                        setServicoComissao('')
                      }
                    }}
                    onFocus={() => setShowColaboradorDropdown(true)}
                    onBlur={() => setTimeout(() => setShowColaboradorDropdown(false), 200)}
                    className="w-full pl-7 pr-2 py-2 rounded-lg border border-purple-200 bg-white text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                  {selectedColaboradorId && <Check size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
                </div>
                {showColaboradorDropdown && colaboradoresFiltrados.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-purple-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {colaboradoresFiltrados.map(colab => (
                      <button
                        key={colab.id}
                        type="button"
                        onClick={() => handleSelectColaborador(colab.id, colab.nome)}
                        className="w-full px-3 py-2 text-left hover:bg-purple-50 text-sm flex items-center justify-between"
                      >
                        <span>{colab.nome}</span>
                        {colab.cargo?.nome && <span className="text-xs text-slate-400">{colab.cargo.nome}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Servico com busca */}
              <div className="flex-1 min-w-0 relative">
                <label className="block text-xs text-purple-700 mb-1">Servico</label>
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={servicoSearch}
                    onChange={(e) => {
                      setServicoSearch(e.target.value)
                      setShowServicoDropdown(true)
                      if (!e.target.value) {
                        setSelectedServicoId('')
                        setServicoPreco('')
                        setServicoComissao('')
                      }
                    }}
                    onFocus={() => setShowServicoDropdown(true)}
                    onBlur={() => setTimeout(() => setShowServicoDropdown(false), 200)}
                    disabled={!selectedColaboradorId}
                    className="w-full pl-7 pr-2 py-2 rounded-lg border border-purple-200 bg-white text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  {selectedServicoId && <Check size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
                </div>
                {showServicoDropdown && selectedColaboradorId && servicosFiltrados.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-purple-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {servicosFiltrados.map(servico => (
                      <button
                        key={servico.id}
                        type="button"
                        onClick={() => handleSelectServico(servico)}
                        className="w-full px-3 py-2 text-left hover:bg-purple-50 text-sm"
                      >
                        <span className="font-medium text-green-600">R$ {Number(servico.preco).toFixed(2)}</span>
                        <span className="mx-2 text-slate-400">-</span>
                        <span>{servico.nome}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-16">
                <label className="block text-xs text-purple-700 mb-1">Qtd</label>
                <input
                  type="number"
                  min="1"
                  value={servicoQuantidade}
                  onChange={(e) => setServicoQuantidade(e.target.value)}
                  disabled={!selectedServicoId}
                  className="w-full px-2 py-2 rounded-lg border border-purple-200 bg-white text-sm text-center focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs text-purple-700 mb-1">Preco</label>
                <input
                  type="number"
                  step="0.01"
                  value={servicoPreco}
                  onChange={(e) => setServicoPreco(e.target.value)}
                  placeholder="R$"
                  disabled={!selectedServicoId}
                  className="w-full px-2 py-2 rounded-lg border border-purple-200 bg-white text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="w-16">
                <label className="block text-xs text-purple-700 mb-1">%</label>
                <input
                  type="number"
                  step="0.1"
                  value={servicoComissao}
                  onChange={(e) => setServicoComissao(e.target.value)}
                  placeholder="%"
                  disabled={!selectedServicoId}
                  className="w-full px-2 py-2 rounded-lg border border-purple-200 bg-white text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <Button
                type="button"
                onClick={addServico}
                disabled={!canAddServico}
                className="px-3"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Form Produto expandido */}
        {abaAtiva === 'produto' && (
          <div className="bg-blue-50 p-4 rounded-xl space-y-3 border border-blue-200">
            <div className="flex items-end gap-2">
              {/* Produto com busca */}
              <div className="flex-1 min-w-0 relative">
                <label className="block text-xs text-blue-700 mb-1">Produto</label>
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={produtoSearch}
                    onChange={(e) => {
                      setProdutoSearch(e.target.value)
                      setShowProdutoDropdown(true)
                      if (!e.target.value) {
                        setSelectedProdutoId('')
                        setProdutoPreco('')
                        setProdutoComissao('')
                      }
                    }}
                    onFocus={() => setShowProdutoDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProdutoDropdown(false), 200)}
                    className="w-full pl-7 pr-2 py-2 rounded-lg border border-blue-200 bg-white text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  {selectedProdutoId && <Check size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
                </div>
                {showProdutoDropdown && produtosFiltrados.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {produtosFiltrados.map(produto => (
                      <button
                        key={produto.id}
                        type="button"
                        onClick={() => handleSelectProduto(produto)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm"
                      >
                        <span className="font-medium text-green-600">R$ {Number(produto.preco_venda).toFixed(2)}</span>
                        <span className="mx-2 text-slate-400">-</span>
                        <span>{produto.nome}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-16">
                <label className="block text-xs text-blue-700 mb-1">Qtd</label>
                <input
                  type="number"
                  min="1"
                  value={produtoQuantidade}
                  onChange={(e) => setProdutoQuantidade(e.target.value)}
                  disabled={!selectedProdutoId}
                  className="w-full px-2 py-2 rounded-lg border border-blue-200 bg-white text-sm text-center focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs text-blue-700 mb-1">Preco</label>
                <input
                  type="number"
                  step="0.01"
                  value={produtoPreco}
                  onChange={(e) => setProdutoPreco(e.target.value)}
                  placeholder="R$"
                  disabled={!selectedProdutoId}
                  className="w-full px-2 py-2 rounded-lg border border-blue-200 bg-white text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="w-16">
                <label className="block text-xs text-blue-700 mb-1">%</label>
                <input
                  type="number"
                  step="0.1"
                  value={produtoComissao}
                  onChange={(e) => setProdutoComissao(e.target.value)}
                  placeholder="%"
                  disabled={!selectedProdutoId}
                  className="w-full px-2 py-2 rounded-lg border border-blue-200 bg-white text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <Button
                type="button"
                onClick={addProduto}
                disabled={!canAddProduto}
                className="px-3"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Itens - Separados por tipo */}
        <div className="space-y-3">
          {/* Servicos */}
          {itensComanda.filter(i => i.tipo === 'servico').length > 0 && (
            <div className="border border-purple-200 rounded-xl overflow-hidden">
              <div className="bg-purple-50 px-4 py-2 border-b border-purple-200 flex items-center gap-2">
                <Scissors size={16} className="text-purple-600" />
                <h4 className="font-medium text-purple-700 text-sm">
                  Servicos ({itensComanda.filter(i => i.tipo === 'servico').length})
                </h4>
              </div>
              <div className="divide-y divide-purple-100 max-h-40 overflow-y-auto bg-white">
                {itensComanda.filter(i => i.tipo === 'servico').map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">{item.descricao}</div>
                      {item.colaborador_nome && (
                        <div className="text-xs text-purple-600">Prof: {item.colaborador_nome}</div>
                      )}
                      <div className="text-xs text-slate-500">{item.quantidade}x {formatters.currency(item.preco)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => updateQuantidade(item.id, -1)} className="p-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-600">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantidade}</span>
                      <button type="button" onClick={() => updateQuantidade(item.id, 1)} className="p-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-600">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-semibold text-purple-700">{formatters.currency(item.preco * item.quantidade)}</span>
                    <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produtos */}
          {itensComanda.filter(i => i.tipo === 'produto').length > 0 && (
            <div className="border border-blue-200 rounded-xl overflow-hidden">
              <div className="bg-blue-50 px-4 py-2 border-b border-blue-200 flex items-center gap-2">
                <Package size={16} className="text-blue-600" />
                <h4 className="font-medium text-blue-700 text-sm">
                  Produtos ({itensComanda.filter(i => i.tipo === 'produto').length})
                </h4>
              </div>
              <div className="divide-y divide-blue-100 max-h-40 overflow-y-auto bg-white">
                {itensComanda.filter(i => i.tipo === 'produto').map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">{item.descricao}</div>
                      <div className="text-xs text-slate-500">{item.quantidade}x {formatters.currency(item.preco)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => updateQuantidade(item.id, -1)} className="p-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-600">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantidade}</span>
                      <button type="button" onClick={() => updateQuantidade(item.id, 1)} className="p-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-600">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-semibold text-blue-700">{formatters.currency(item.preco * item.quantidade)}</span>
                    <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensagem quando vazio */}
          {itensComanda.length === 0 && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-center text-slate-400 text-sm">Nenhum item na comanda</p>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="bg-primary-50 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-700">Total da Comanda:</span>
            <span className="text-2xl font-bold text-primary-600">{formatters.currency(total)}</span>
          </div>
        </div>

        {/* Botoes */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!canSubmit}
            className="flex-1"
          >
            Criar Comanda
          </Button>
        </div>
      </div>
    </Modal>
  )
}
