import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { comandasService } from '../../services/comandas.service'
import { clientesService } from '../../services/clientes.service'
import { colaboradoresService } from '../../services/colaboradores.service'
import { servicosService } from '../../services/servicos.service'
import { produtosService } from '../../services/produtos.service'
import { Modal, Button } from '../../components/ui'
import { useAuthStore } from '../../stores/authStore'
import { formatters, masks, getDataHoraBrasilISO } from '../../utils/masks'
import toast from 'react-hot-toast'
import { Search, User, Scissors, Package, Plus, Minus, X, Check, UserPlus, Calendar, UserCircle, Receipt, AlertTriangle } from 'lucide-react'
import type { Servico, Produto, Comanda } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  clienteInicial?: { id: string; nome: string } | null
  comandaId?: string | null  // ID da comanda para continuar
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

export default function ComandaColaboradorModal({ isOpen, onClose, onSuccess, clienteInicial, comandaId }: Props) {
  const queryClient = useQueryClient()
  const { usuario } = useAuthStore()
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Estados do formulario
  const [clienteSearch, setClienteSearch] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [clienteNome, setClienteNome] = useState('')
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoClienteNome, setNovoClienteNome] = useState('')
  const [novoClienteWhatsapp, setNovoClienteWhatsapp] = useState('')
  const [novoClienteGenero, setNovoClienteGenero] = useState<string>('')
  const [comandaAbertaCliente, setComandaAbertaCliente] = useState<Comanda | null>(null)
  const [dataComanda, setDataComanda] = useState<string>(() => {
    const hoje = new Date()
    const dia = String(hoje.getDate()).padStart(2, '0')
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const ano = hoje.getFullYear()
    return `${dia}/${mes}/${ano}`
  })

  const [itensComanda, setItensComanda] = useState<ItemComanda[]>([])
  const [abaAtiva, setAbaAtiva] = useState<'servico' | 'produto' | null>(null)

  // Estados para adicionar servico
  const [selectedServicoId, setSelectedServicoId] = useState<string>('')
  const [servicoQuantidade, setServicoQuantidade] = useState<string>('1')
  const [servicoPreco, setServicoPreco] = useState<string>('')
  const [servicoComissao, setServicoComissao] = useState<string>('')
  const [servicosDoColaborador, setServicosDoColaborador] = useState<Servico[]>([])
  const [servicoSearch, setServicoSearch] = useState('')
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

  // Buscar comanda por ID quando fornecido (para continuar comanda existente)
  const { data: comandaPorId, refetch: refetchComanda } = useQuery({
    queryKey: ['comanda-por-id', comandaId],
    queryFn: () => comandasService.get(comandaId!),
    enabled: !!comandaId && isOpen,
    staleTime: 0, // Sempre buscar dados frescos
  })

  // Verificar comandas abertas do cliente selecionado
  const { data: comandasClienteData } = useQuery({
    queryKey: ['comandas-cliente-aberta', clienteId],
    queryFn: () => comandasService.list({
      cliente_id: clienteId!,
      per_page: 5
    }),
    enabled: !!clienteId && isOpen && !comandaId, // Nao buscar se ja tem comandaId
  })

  // Buscar comandas abertas para mostrar na lista de busca
  const { data: comandasAbertasHoje } = useQuery({
    queryKey: ['comandas-abertas-hoje'],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0]
      const response = await comandasService.list({
        per_page: 100,
        data_inicio: hoje,
        data_fim: hoje
      })
      // Filtrar apenas abertas/em_atendimento e retornar mapa por cliente_id
      const abertas: Record<string, {numero: string, data: string}> = {}
      response.items.forEach((c: Comanda) => {
        if ((c.status === 'aberta' || c.status === 'em_atendimento') && c.cliente_id) {
          abertas[c.cliente_id] = {
            numero: c.numero,
            data: formatters.dateTimeShortBR(c.data_abertura || c.created_at)
          }
        }
      })
      return abertas
    },
    enabled: isOpen,
  })

  const { data: colaboradorData } = useQuery({
    queryKey: ['colaborador-atual', usuario?.colaborador_id],
    queryFn: () => colaboradoresService.get(usuario!.colaborador_id!),
    enabled: !!usuario?.colaborador_id && isOpen,
  })

  const { data: servicosData } = useQuery({
    queryKey: ['servicos-comanda'],
    queryFn: () => servicosService.list({ per_page: 100, ativo: true }),
    enabled: isOpen,
  })

  const { data: produtosData } = useQuery({
    queryKey: ['produtos-comanda'],
    queryFn: () => produtosService.list({ per_page: 100, ativo: true }),
    enabled: isOpen,
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Se tem cliente inicial (continuar comanda), pre-seleciona
      if (clienteInicial) {
        setClienteSearch(clienteInicial.nome)
        setClienteId(clienteInicial.id)
        setClienteNome(clienteInicial.nome)
      } else if (!comandaId) {
        // Só limpa cliente se NÃO estiver continuando uma comanda por ID
        setClienteSearch('')
        setClienteId(null)
        setClienteNome('')
      }
      setShowNovoCliente(false)
      setNovoClienteNome('')
      setNovoClienteWhatsapp('')
      setNovoClienteGenero('')
      // Só limpa comanda aberta se NÃO estiver continuando uma comanda por ID
      if (!comandaId) {
        setComandaAbertaCliente(null)
      }
      const hoje = new Date()
      const dia = String(hoje.getDate()).padStart(2, '0')
      const mes = String(hoje.getMonth() + 1).padStart(2, '0')
      const ano = hoje.getFullYear()
      setDataComanda(`${dia}/${mes}/${ano}`)
      setItensComanda([])
      setAbaAtiva(null)
      resetServicoForm()
      resetProdutoForm()
    }
  }, [isOpen, clienteInicial, comandaId])

  // Forcar busca da comanda quando modal abre com comandaId
  useEffect(() => {
    if (comandaId && isOpen) {
      refetchComanda()
    }
  }, [comandaId, isOpen, refetchComanda])

  // Quando temos comandaPorId, usar ela diretamente e preencher cliente
  useEffect(() => {
    if (comandaPorId && isOpen) {
      console.log('Comanda carregada por ID:', comandaPorId)
      setComandaAbertaCliente(comandaPorId)
      // Preencher dados do cliente se existir
      if (comandaPorId.cliente_id) {
        setClienteId(comandaPorId.cliente_id)
        setClienteNome(comandaPorId.cliente?.nome || comandaPorId.nome_cliente || '')
        setClienteSearch(comandaPorId.cliente?.nome || comandaPorId.nome_cliente || '')
      } else if (comandaPorId.nome_cliente) {
        setClienteNome(comandaPorId.nome_cliente)
        setClienteSearch(comandaPorId.nome_cliente)
      }
    }
  }, [comandaPorId, isOpen])

  // Verificar se cliente tem comanda aberta e buscar detalhes completos
  useEffect(() => {
    const buscarComandaCompleta = async () => {
      if (comandasClienteData?.items) {
        const comandasAbertas = comandasClienteData.items.filter(
          (c: Comanda) => c.status === 'aberta' || c.status === 'em_atendimento'
        )
        if (comandasAbertas.length > 0) {
          // Buscar comanda completa com itens
          try {
            const comandaCompleta = await comandasService.get(comandasAbertas[0].id)
            setComandaAbertaCliente(comandaCompleta)
          } catch (error) {
            console.error('Erro ao buscar comanda completa:', error)
            setComandaAbertaCliente(comandasAbertas[0])
          }
        } else {
          setComandaAbertaCliente(null)
        }
      }
    }
    buscarComandaCompleta()
  }, [comandasClienteData])

  // Carregar servicos do colaborador quando dados estiverem disponiveis
  useEffect(() => {
    if (colaboradorData && servicosData?.items) {
      if (colaboradorData.servicos && colaboradorData.servicos.length > 0) {
        const servicosIds = colaboradorData.servicos.map(s => s.servico_id)
        const servicosFiltrados = servicosData.items.filter(s => servicosIds.includes(s.id))
        setServicosDoColaborador(servicosFiltrados)
      } else {
        setServicosDoColaborador([])
      }
    }
  }, [colaboradorData, servicosData])

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
    setSelectedServicoId('')
    setServicoQuantidade('1')
    setServicoPreco('')
    setServicoComissao('')
    setServicoSearch('')
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
  const total = itensComanda.reduce((sum, item) => sum + (item.preco * item.quantidade), 0)

  // Mutation para criar cliente
  const createClienteMutation = useMutation({
    mutationFn: () => clientesService.create({
      nome: novoClienteNome,
      whatsapp: novoClienteWhatsapp,
      genero: novoClienteGenero,
    }),
    onSuccess: (cliente) => {
      setClienteId(cliente.id)
      setClienteNome(cliente.nome)
      setClienteSearch(cliente.nome)
      setShowNovoCliente(false)
      setNovoClienteNome('')
      setNovoClienteWhatsapp('')
      setNovoClienteGenero('')
      toast.success('Cliente cadastrado!')
    },
    onError: () => toast.error('Erro ao cadastrar cliente'),
  })

  // Funcao para obter data/hora de abertura no fuso horario do Brasil
  const getDataAberturaISO = () => {
    const dataISO = masks.dateToISO(dataComanda)
    if (!dataISO) return undefined
    return getDataHoraBrasilISO(dataISO)
  }

  // Mutation para criar comanda ou adicionar itens em comanda existente
  const createMutation = useMutation({
    mutationFn: async () => {
      // Se cliente tem comanda aberta, adiciona itens nela
      if (comandaAbertaCliente && clienteId) {
        const comandasResponse = await comandasService.list({
          cliente_id: clienteId,
          per_page: 10
        })
        const comandaAberta = comandasResponse.items.find(
          (c: Comanda) => c.status === 'aberta' || c.status === 'em_atendimento'
        )

        if (comandaAberta) {
          // Adiciona cada item na comanda existente
          for (const item of itensComanda) {
            await comandasService.addItem(comandaAberta.id, {
              tipo: item.tipo,
              servico_id: item.servico_id,
              produto_id: item.produto_id,
              colaborador_id: item.colaborador_id,
              descricao: item.descricao,
              quantidade: item.quantidade,
              valor_unitario: item.preco,
              comissao_percentual: item.comissao_percentual,
            })
          }
          return comandaAberta
        }
      }

      // Cria nova comanda
      const comanda = await comandasService.create({
        cliente_id: clienteId || undefined,
        nome_cliente: clienteNome || undefined,
        data_abertura: getDataAberturaISO(),
        status: 'aberta',
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
    onSuccess: (_, __, ___) => {
      queryClient.invalidateQueries({ queryKey: ['comandas'] })
      queryClient.invalidateQueries({ queryKey: ['comanda-por-id'] })
      if (comandaAbertaCliente) {
        toast.success(`Itens adicionados na comanda #${comandaAbertaCliente.numero}!`)
      } else {
        toast.success('Comanda criada com sucesso!')
      }
      onSuccess?.()
      onClose()
    },
    onError: () => toast.error('Erro ao processar comanda'),
  })

  // Mutation para remover item da comanda existente
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!comandaAbertaCliente) throw new Error('Comanda nao encontrada')
      return comandasService.removeItem(comandaAbertaCliente.id, itemId)
    },
    onSuccess: async () => {
      // Buscar comanda completa atualizada
      if (comandaAbertaCliente) {
        try {
          const comandaAtualizada = await comandasService.get(comandaAbertaCliente.id)
          setComandaAbertaCliente(comandaAtualizada)
        } catch (error) {
          console.error('Erro ao atualizar comanda:', error)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['comandas'] })
      queryClient.invalidateQueries({ queryKey: ['comanda-por-id'] })
      toast.success('Item removido!')
    },
    onError: () => toast.error('Erro ao remover item'),
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
    if (!servico) return

    const novoItem: ItemComanda = {
      id: `${Date.now()}-${servico.id}`,
      tipo: 'servico',
      servico_id: servico.id,
      colaborador_id: usuario?.colaborador_id || undefined,
      colaborador_nome: usuario?.colaborador_nome || usuario?.nome,
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
      colaborador_id: usuario?.colaborador_id || undefined,
      colaborador_nome: usuario?.colaborador_nome || usuario?.nome,
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

  const handleSelectServico = (servico: Servico) => {
    setSelectedServicoId(servico.id)
    setServicoSearch(`R$ ${Number(servico.preco).toFixed(2)} - ${servico.nome}`)
    setShowServicoDropdown(false)
    setServicoPreco(String(Number(servico.preco)))
    setServicoComissao(String(Number(servico.comissao_percentual ?? 0)))
  }

  const handleSelectProduto = (produto: Produto) => {
    setSelectedProdutoId(produto.id)
    setProdutoSearch(`R$ ${Number(produto.preco_venda).toFixed(2)} - ${produto.nome}`)
    setShowProdutoDropdown(false)
    setProdutoPreco(String(Number(produto.preco_venda)))
    setProdutoComissao(String(Number(produto.comissao_percentual ?? 0)))
  }

  // Filtrar servicos pela busca
  const servicosFiltrados = servicosDoColaborador.filter(s =>
    s.nome.toLowerCase().includes(servicoSearch.toLowerCase())
  )

  // Filtrar produtos pela busca
  const produtosFiltrados = produtosData?.items?.filter(p =>
    p.nome.toLowerCase().includes(produtoSearch.toLowerCase())
  ) || []

  // Colaborador precisa selecionar cliente para criar comanda
  const canSubmit = itensComanda.length > 0 && !!clienteId
  const canAddServico = selectedServicoId && servicoPreco
  const canAddProduto = selectedProdutoId && produtoPreco

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Comanda" size="lg">
      <div className="space-y-5 max-h-[80vh] overflow-y-auto">
        {/* Profissional (read-only) */}
        <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
          <label className="text-sm font-medium text-teal-700 flex items-center gap-1 mb-1">
            <UserCircle size={14} /> Profissional
          </label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-medium">
              {(usuario?.colaborador_nome || usuario?.nome)?.charAt(0) || 'C'}
            </div>
            <div>
              <p className="font-semibold text-teal-800">{usuario?.colaborador_nome || usuario?.nome}</p>
              <p className="text-xs text-teal-600">Colaborador</p>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className={`relative p-3 rounded-lg transition-colors ${clienteId ? 'bg-green-50 border border-green-200' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <label className={`text-sm font-medium flex items-center gap-1 ${clienteId ? 'text-green-700' : 'text-slate-700'}`}>
              <User size={14} /> Cliente {clienteId && <Check size={14} className="text-green-600" />}
            </label>
            <button
              type="button"
              onClick={() => setShowNovoCliente(!showNovoCliente)}
              className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
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
                  className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm ${clienteId ? 'border-green-300 bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100' : 'border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100'}`}
                />
              </div>
              {showClienteDropdown && clientesSearch && clientesSearch.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {clientesSearch.map(cliente => {
                    const comandaAberta = comandasAbertasHoje?.[cliente.id]
                    return (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => handleSelectCliente(cliente)}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-50 text-sm ${comandaAberta ? 'bg-amber-50 hover:bg-amber-100' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-medium text-slate-700 truncate">
                              {cliente.nome}{cliente.celular ? ` - ${masks.phone(cliente.celular)}` : ''}
                            </span>
                          </div>
                          {comandaAberta && (
                            <div className="flex items-center gap-1 text-amber-600 bg-amber-100 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0">
                              <AlertTriangle size={12} />
                              <span>#{comandaAberta.numero}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
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
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="WhatsApp *"
                  value={novoClienteWhatsapp}
                  onChange={(e) => setNovoClienteWhatsapp(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                <select
                  value={novoClienteGenero}
                  onChange={(e) => setNovoClienteGenero(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">Genero *</option>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <Button
                type="button"
                onClick={() => createClienteMutation.mutate()}
                disabled={!novoClienteNome.trim() || !novoClienteWhatsapp.trim() || !novoClienteGenero}
                loading={createClienteMutation.isPending}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Cadastrar Cliente
              </Button>
            </div>
          )}
        </div>

        {/* Comanda aberta do cliente */}
        {comandaAbertaCliente && (
          <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Receipt className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-800">Cliente com comanda em aberto</p>
                <p className="text-sm text-blue-700 mt-0.5">
                  Comanda <span className="font-semibold">#{comandaAbertaCliente.numero}</span> - {formatters.dateTimeShortBR(comandaAbertaCliente.data_abertura || comandaAbertaCliente.created_at)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Seus servicos serao adicionados automaticamente nessa comanda.
                </p>
              </div>
            </div>

            {/* Itens existentes na comanda */}
            {comandaAbertaCliente.itens && comandaAbertaCliente.itens.length > 0 && (
              <div className="border-t border-blue-200 pt-3 space-y-3">
                {/* Servicos */}
                {comandaAbertaCliente.itens.filter(i => i.tipo === 'servico').length > 0 && (
                  <div className="border border-teal-200 rounded-lg overflow-hidden">
                    <div className="bg-teal-50 px-3 py-1.5 border-b border-teal-200 flex items-center gap-2">
                      <Scissors size={14} className="text-teal-600" />
                      <span className="text-xs font-medium text-teal-700">
                        Servicos ({comandaAbertaCliente.itens.filter(i => i.tipo === 'servico').length})
                      </span>
                    </div>
                    <div className="divide-y divide-teal-100 max-h-28 overflow-y-auto bg-white">
                      {comandaAbertaCliente.itens.filter(i => i.tipo === 'servico').map((item) => {
                        const isMeuItem = String(item.colaborador_id) === String(usuario?.colaborador_id)
                        return (
                          <div key={item.id} className={`flex items-center justify-between px-3 py-2 text-sm ${isMeuItem ? 'bg-teal-50' : ''}`}>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-slate-700 truncate block">{item.descricao}</span>
                              <span className="text-xs text-slate-500">
                                {item.colaborador_nome || 'Colaborador'} • {item.quantidade}x {formatters.currency(item.valor_unitario)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-teal-700">{formatters.currency(item.valor_total)}</span>
                              {isMeuItem && (
                                <button
                                  type="button"
                                  onClick={() => removeItemMutation.mutate(item.id)}
                                  disabled={removeItemMutation.isPending}
                                  className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600"
                                  title="Remover item"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Produtos */}
                {comandaAbertaCliente.itens.filter(i => i.tipo === 'produto').length > 0 && (
                  <div className="border border-blue-200 rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-3 py-1.5 border-b border-blue-200 flex items-center gap-2">
                      <Package size={14} className="text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">
                        Produtos ({comandaAbertaCliente.itens.filter(i => i.tipo === 'produto').length})
                      </span>
                    </div>
                    <div className="divide-y divide-blue-100 max-h-28 overflow-y-auto bg-white">
                      {comandaAbertaCliente.itens.filter(i => i.tipo === 'produto').map((item) => {
                        const isMeuItem = String(item.colaborador_id) === String(usuario?.colaborador_id)
                        return (
                          <div key={item.id} className={`flex items-center justify-between px-3 py-2 text-sm ${isMeuItem ? 'bg-blue-50' : ''}`}>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-slate-700 truncate block">{item.descricao}</span>
                              <span className="text-xs text-slate-500">
                                {item.colaborador_nome || 'Colaborador'} • {item.quantidade}x {formatters.currency(item.valor_unitario)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-blue-700">{formatters.currency(item.valor_total)}</span>
                              {isMeuItem && (
                                <button
                                  type="button"
                                  onClick={() => removeItemMutation.mutate(item.id)}
                                  disabled={removeItemMutation.isPending}
                                  className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600"
                                  title="Remover item"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="text-xs text-blue-700">Total da comanda:</span>
                  <span className="font-semibold text-blue-800">
                    {formatters.currency(
                      comandaAbertaCliente.itens?.reduce((sum, item) => sum + Number(item.valor_total || 0), 0) || comandaAbertaCliente.total || 0
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

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
              className="w-28 px-2 py-2 rounded-l-lg border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 text-sm text-center"
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
        </div>

        {/* Botoes Incluir Servico / Produto */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAbaAtiva(abaAtiva === 'servico' ? null : 'servico')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
              abaAtiva === 'servico'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
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
          <div className="bg-teal-50 p-3 sm:p-4 rounded-xl space-y-3 border border-teal-200">
            {/* Servico com busca */}
            <div className="relative">
              <label className="block text-xs text-teal-700 mb-1">Servico</label>
              <div className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-teal-400" />
                <input
                  type="text"
                  placeholder="Buscar servico..."
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
                  className="w-full pl-7 pr-8 py-2.5 rounded-lg border border-teal-200 bg-white text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                {selectedServicoId && <Check size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
              </div>
              {showServicoDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-teal-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {servicosFiltrados.length > 0 ? (
                    servicosFiltrados.map(servico => (
                      <button
                        key={servico.id}
                        type="button"
                        onClick={() => handleSelectServico(servico)}
                        className="w-full px-3 py-3 text-left hover:bg-teal-50 text-sm border-b border-teal-100 last:border-0"
                      >
                        <span className="font-medium text-green-600">R$ {Number(servico.preco).toFixed(2)}</span>
                        <span className="mx-2 text-slate-400">-</span>
                        <span>{servico.nome}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-amber-600 bg-amber-50">
                      Voce nao possui servicos vinculados
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Linha 2: Qtd, Preco, % e Botao */}
            <div className="flex items-end gap-2">
              <div className="flex-1 sm:w-20 sm:flex-none">
                <label className="block text-xs text-teal-700 mb-1">Qtd</label>
                <input
                  type="number"
                  min="1"
                  value={servicoQuantidade}
                  onChange={(e) => setServicoQuantidade(e.target.value)}
                  disabled={!selectedServicoId}
                  className="w-full px-2 py-2.5 rounded-lg border border-teal-200 bg-white text-sm text-center focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex-1 sm:w-28 sm:flex-none">
                <label className="block text-xs text-teal-700 mb-1">Preco</label>
                <input
                  type="number"
                  step="0.01"
                  value={servicoPreco}
                  onChange={(e) => setServicoPreco(e.target.value)}
                  placeholder="R$"
                  disabled={!selectedServicoId}
                  className="w-full px-2 py-2.5 rounded-lg border border-teal-200 bg-white text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex-1 sm:w-20 sm:flex-none">
                <label className="block text-xs text-teal-700 mb-1">%</label>
                <input
                  type="number"
                  step="0.1"
                  value={servicoComissao}
                  onChange={(e) => setServicoComissao(e.target.value)}
                  placeholder="%"
                  disabled={!selectedServicoId}
                  className="w-full px-2 py-2.5 rounded-lg border border-teal-200 bg-white text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <Button
                type="button"
                onClick={addServico}
                disabled={!canAddServico}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Form Produto expandido */}
        {abaAtiva === 'produto' && (
          <div className="bg-blue-50 p-3 sm:p-4 rounded-xl space-y-3 border border-blue-200">
            {/* Produto */}
            <div className="relative">
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
                  className="w-full pl-7 pr-8 py-2.5 rounded-lg border border-blue-200 bg-white text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                {selectedProdutoId && <Check size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
              </div>
              {showProdutoDropdown && produtosFiltrados.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {produtosFiltrados.map(produto => (
                    <button
                      key={produto.id}
                      type="button"
                      onClick={() => handleSelectProduto(produto)}
                      className="w-full px-3 py-3 text-left hover:bg-blue-50 text-sm border-b border-blue-100 last:border-0"
                    >
                      <span className="font-medium text-green-600">R$ {Number(produto.preco_venda).toFixed(2)}</span>
                      <span className="mx-2 text-slate-400">-</span>
                      <span>{produto.nome}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Linha 2: Qtd, Preco, % e Botao */}
            <div className="flex items-end gap-2">
              <div className="flex-1 sm:w-20 sm:flex-none">
                <label className="block text-xs text-blue-700 mb-1">Qtd</label>
                <input
                  type="number"
                  min="1"
                  value={produtoQuantidade}
                  onChange={(e) => setProdutoQuantidade(e.target.value)}
                  disabled={!selectedProdutoId}
                  className="w-full px-2 py-2.5 rounded-lg border border-blue-200 bg-white text-sm text-center focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex-1 sm:w-28 sm:flex-none">
                <label className="block text-xs text-blue-700 mb-1">Preco</label>
                <input
                  type="number"
                  step="0.01"
                  value={produtoPreco}
                  onChange={(e) => setProdutoPreco(e.target.value)}
                  placeholder="R$"
                  disabled={!selectedProdutoId}
                  className="w-full px-2 py-2.5 rounded-lg border border-blue-200 bg-white text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex-1 sm:w-20 sm:flex-none">
                <label className="block text-xs text-blue-700 mb-1">%</label>
                <input
                  type="number"
                  step="0.1"
                  value={produtoComissao}
                  onChange={(e) => setProdutoComissao(e.target.value)}
                  placeholder="%"
                  disabled={!selectedProdutoId}
                  className="w-full px-2 py-2.5 rounded-lg border border-blue-200 bg-white text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <Button
                type="button"
                onClick={addProduto}
                disabled={!canAddProduto}
                className="px-4 py-2.5"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Itens */}
        <div className="space-y-3">
          {/* Servicos */}
          {itensComanda.filter(i => i.tipo === 'servico').length > 0 && (
            <div className="border border-teal-200 rounded-xl overflow-hidden">
              <div className="bg-teal-50 px-4 py-2 border-b border-teal-200 flex items-center gap-2">
                <Scissors size={16} className="text-teal-600" />
                <h4 className="font-medium text-teal-700 text-sm">
                  Servicos ({itensComanda.filter(i => i.tipo === 'servico').length})
                </h4>
              </div>
              <div className="divide-y divide-teal-100 max-h-40 overflow-y-auto bg-white">
                {itensComanda.filter(i => i.tipo === 'servico').map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">{item.descricao}</div>
                      <div className="text-xs text-slate-500">{item.quantidade}x {formatters.currency(item.preco)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => updateQuantidade(item.id, -1)} className="p-1 rounded bg-teal-100 hover:bg-teal-200 text-teal-600">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantidade}</span>
                      <button type="button" onClick={() => updateQuantidade(item.id, 1)} className="p-1 rounded bg-teal-100 hover:bg-teal-200 text-teal-600">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-semibold text-teal-700">{formatters.currency(item.preco * item.quantidade)}</span>
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
        <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-700">Total:</span>
            <span className="text-2xl font-bold text-teal-600">{formatters.currency(total)}</span>
          </div>
          <p className="text-xs text-teal-600 mt-1">
            {comandaAbertaCliente
              ? `Os itens serao adicionados na comanda #${comandaAbertaCliente.numero}`
              : 'A comanda sera criada com status "Aberta" para fechamento no caixa'
            }
          </p>
        </div>

        {/* Botoes */}
        <div className="flex gap-3 pt-2">
          {comandaAbertaCliente && itensComanda.length === 0 ? (
            <Button
              type="button"
              onClick={() => {
                onSuccess?.()
                onClose()
              }}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
            >
              Fechar
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!canSubmit}
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              >
                {comandaAbertaCliente ? 'Adicionar Itens' : 'Criar Comanda'}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
