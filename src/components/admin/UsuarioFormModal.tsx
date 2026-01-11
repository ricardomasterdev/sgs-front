import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { User, Mail, Lock, Smartphone, Store, X, Shield, Search, Save, UserCog } from 'lucide-react'
import toast from 'react-hot-toast'

import { Modal, Button, Input } from '../ui'
import { usuariosService } from '../../services/usuarios.service'
import { saloesService } from '../../services/saloes.service'
import { colaboradoresService } from '../../services/colaboradores.service'
import { useAuthStore } from '../../stores/authStore'
import type { Usuario, Salao, Colaborador } from '../../types'

interface UsuarioFormData {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
  telefone: string
  superUsuario: boolean
}

interface PerfilItem {
  id: string
  codigo: string
  nome: string
}

// Mascara para celular (00) 00000-0000
const formatCelular = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

interface UsuarioFormModalProps {
  isOpen: boolean
  onClose: () => void
  usuario?: Usuario | null
}

export function UsuarioFormModal({ isOpen, onClose, usuario }: UsuarioFormModalProps) {
  const queryClient = useQueryClient()
  const salao = useAuthStore((state) => state.salao)
  const isEditing = !!usuario

  const [selectedSalao, setSelectedSalao] = useState<Salao | null>(null)
  const [selectedPerfil, setSelectedPerfil] = useState<PerfilItem | null>(null)
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [colaboradorSearch, setColaboradorSearch] = useState('')
  const [showSalaoList, setShowSalaoList] = useState(false)
  const [showColaboradorList, setShowColaboradorList] = useState(false)
  const [telefoneValue, setTelefoneValue] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      telefone: '',
      superUsuario: false,
    },
  })

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCelular(e.target.value)
    setTelefoneValue(formatted)
    setValue('telefone', formatted)
  }

  const superUsuario = watch('superUsuario')

  // Buscar saloes para selecao
  const { data: saloesData } = useQuery({
    queryKey: ['admin-saloes-all'],
    queryFn: () => saloesService.list({ per_page: 100, ativo: true }),
    enabled: isOpen,
  })

  const saloes = saloesData?.items || []

  // Buscar perfis
  const { data: perfis = [] } = useQuery({
    queryKey: ['usuarios-perfis'],
    queryFn: () => usuariosService.listPerfis(),
    enabled: isOpen,
  })

  // Buscar colaboradores do salao selecionado
  const { data: colaboradoresData } = useQuery({
    queryKey: ['colaboradores-vinculo', selectedSalao?.id],
    queryFn: () => colaboradoresService.list({ per_page: 100, ativo: true }),
    enabled: isOpen && !!selectedSalao && selectedPerfil?.codigo === 'colaborador',
  })

  const colaboradores = colaboradoresData?.items || []

  // Filtrar colaboradores pela busca
  const filteredColaboradores = colaboradores.filter((c) =>
    c.nome.toLowerCase().includes(colaboradorSearch.toLowerCase())
  )

  // Verifica se o perfil selecionado e Colaborador
  const isPerfilColaborador = selectedPerfil?.codigo === 'colaborador'

  // Filtrar saloes pela busca
  const filteredSaloes = saloes.filter((s) =>
    s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.codigo?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Preencher form quando editar ou abrir modal
  useEffect(() => {
    if (!isOpen) return

    if (usuario) {
      reset({
        nome: usuario.nome,
        email: usuario.email,
        senha: '',
        confirmarSenha: '',
        telefone: '',
        superUsuario: usuario.super_usuario || false,
      })
      setTelefoneValue(usuario.telefone ? formatCelular(usuario.telefone) : '')
    } else {
      reset({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        telefone: '',
        superUsuario: false,
      })
      setTelefoneValue('')
      setSelectedSalao(null)
      setSelectedPerfil(null)
      setSelectedColaborador(null)
    }
    setSearchQuery('')
    setColaboradorSearch('')
    setShowSalaoList(false)
    setShowColaboradorList(false)
  }, [usuario, reset, isOpen])

  // Atualizar selectedSalao quando saloes carregarem (apenas para edicao)
  useEffect(() => {
    if (!isOpen || !usuario) return

    if (usuario.salao_id && saloes.length > 0 && !selectedSalao) {
      const salaoEncontrado = saloes.find(s => s.id === usuario.salao_id)
      if (salaoEncontrado) setSelectedSalao(salaoEncontrado)
    } else if (!usuario.salao_id) {
      setSelectedSalao(null)
    }
  }, [isOpen, usuario, saloes.length, selectedSalao])

  // Atualizar selectedPerfil quando perfis carregarem (apenas para edicao)
  useEffect(() => {
    if (!isOpen || !usuario) return

    if (usuario.perfil_id && perfis.length > 0 && !selectedPerfil) {
      const perfilEncontrado = perfis.find(p => p.id === usuario.perfil_id)
      if (perfilEncontrado) setSelectedPerfil(perfilEncontrado)
    } else if (!usuario.perfil_id) {
      setSelectedPerfil(null)
    }
  }, [isOpen, usuario, perfis.length, selectedPerfil])

  // Limpar perfil quando salao mudar (no cadastro)
  useEffect(() => {
    if (!isEditing) {
      setSelectedPerfil(null)
      setSelectedColaborador(null)
    }
  }, [selectedSalao, isEditing])

  // Limpar colaborador quando perfil mudar
  useEffect(() => {
    if (!isPerfilColaborador) {
      setSelectedColaborador(null)
      setColaboradorSearch('')
      setShowColaboradorList(false)
    }
  }, [selectedPerfil, isPerfilColaborador])

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: any) => usuariosService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios', salao?.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      toast.success('Usuario criado com sucesso!')
      handleClose()
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao criar usuario'
      toast.error(message)
    },
  })

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: any) => usuariosService.update(usuario!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios', salao?.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      toast.success('Usuario atualizado com sucesso!')
      handleClose()
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erro ao atualizar usuario'
      toast.error(message)
    },
  })

  const handleClose = () => {
    reset()
    setTelefoneValue('')
    setSelectedSalao(null)
    setSelectedPerfil(null)
    setSelectedColaborador(null)
    setSearchQuery('')
    setColaboradorSearch('')
    setShowSalaoList(false)
    setShowColaboradorList(false)
    onClose()
  }

  const onSubmit = (data: UsuarioFormData) => {
    // Validar salao se nao for super usuario
    if (!data.superUsuario && !selectedSalao) {
      toast.error('Selecione um salao para o usuario')
      return
    }

    // Validar colaborador se perfil for Colaborador
    if (isPerfilColaborador && !selectedColaborador) {
      toast.error('Selecione um colaborador para vincular')
      return
    }

    // Validar senha no cadastro
    if (!isEditing && !data.senha) {
      toast.error('Senha e obrigatoria')
      return
    }

    // Validar confirmacao de senha
    if (data.senha && data.senha !== data.confirmarSenha) {
      toast.error('As senhas nao conferem')
      return
    }

    // Limpar mascara do telefone
    const telefoneLimpo = data.telefone?.replace(/\D/g, '') || ''

    if (isEditing) {
      const payload: any = {
        nome: data.nome,
        email: data.email,
        super_usuario: data.superUsuario,
        salao_id: data.superUsuario ? null : selectedSalao?.id,
        perfil_id: data.superUsuario ? null : selectedPerfil?.id,
        colaborador_id: isPerfilColaborador ? selectedColaborador?.id : null,
        is_colaborador: isPerfilColaborador,
      }

      if (data.senha) {
        payload.senha = data.senha
      }

      if (telefoneLimpo) payload.telefone = telefoneLimpo

      updateMutation.mutate(payload)
    } else {
      const payload: any = {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        super_usuario: data.superUsuario,
        salao_id: data.superUsuario ? undefined : selectedSalao?.id,
        perfil_id: data.superUsuario ? undefined : selectedPerfil?.id,
        colaborador_id: isPerfilColaborador ? selectedColaborador?.id : undefined,
        is_colaborador: isPerfilColaborador,
      }

      if (telefoneLimpo) payload.telefone = telefoneLimpo

      createMutation.mutate(payload)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Usuario' : 'Novo Usuario'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Super Usuario Toggle */}
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-slate-900">Super Usuario</p>
              <p className="text-sm text-slate-500">Acesso a todos os saloes</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('superUsuario')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Salao (se nao for super usuario) */}
        {!superUsuario && (
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
              <Store className="w-4 h-4" />
              <span>Salao *</span>
            </div>

            {selectedSalao ? (
              <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                    {selectedSalao.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{selectedSalao.nome}</p>
                    <p className="text-sm text-slate-500">{selectedSalao.codigo}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSalao(null)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar salao..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSalaoList(true)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {showSalaoList && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                    {filteredSaloes.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 text-sm">
                        Nenhum salao encontrado
                      </div>
                    ) : (
                      filteredSaloes.map((salao) => (
                        <button
                          key={salao.id}
                          type="button"
                          onClick={() => {
                            setSelectedSalao(salao)
                            setShowSalaoList(false)
                            setSearchQuery('')
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
                            {salao.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{salao.nome}</p>
                            <p className="text-xs text-slate-500">{salao.codigo}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Perfil (se nao for super usuario e salao selecionado) */}
        {!superUsuario && selectedSalao && (
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
              <Shield className="w-4 h-4" />
              <span>Perfil de Acesso</span>
            </div>

            <select
              value={selectedPerfil?.id || ''}
              onChange={(e) => {
                const perfil = perfis.find((p) => p.id === e.target.value)
                setSelectedPerfil(perfil || null)
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecione um perfil</option>
              {perfis.filter(p => p.codigo !== 'super_admin').map((perfil) => (
                <option key={perfil.id} value={perfil.id}>
                  {perfil.nome}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              O perfil define as permissoes do usuario no sistema
            </p>
          </div>
        )}

        {/* Colaborador (se perfil for Colaborador) */}
        {!superUsuario && selectedSalao && isPerfilColaborador && (
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-3">
              <UserCog className="w-4 h-4" />
              <span>Vincular a Colaborador *</span>
            </div>

            {selectedColaborador ? (
              <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                    {selectedColaborador.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{selectedColaborador.nome}</p>
                    <p className="text-sm text-slate-500">{selectedColaborador.cargo?.nome || 'Colaborador'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedColaborador(null)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar colaborador..."
                    value={colaboradorSearch}
                    onChange={(e) => setColaboradorSearch(e.target.value)}
                    onFocus={() => setShowColaboradorList(true)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {showColaboradorList && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                    {filteredColaboradores.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 text-sm">
                        {colaboradores.length === 0 ? 'Carregando colaboradores...' : 'Nenhum colaborador encontrado'}
                      </div>
                    ) : (
                      filteredColaboradores.map((colab) => (
                        <button
                          key={colab.id}
                          type="button"
                          onClick={() => {
                            setSelectedColaborador(colab)
                            setShowColaboradorList(false)
                            setColaboradorSearch('')
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-teal-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-medium text-sm">
                            {colab.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{colab.nome}</p>
                            <p className="text-xs text-slate-500">{colab.cargo?.nome || 'Colaborador'}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">
              O usuario sera vinculado a este colaborador para registrar comandas
            </p>
          </div>
        )}

        {/* Grid de campos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <User className="w-4 h-4" />
              <span>Nome Completo *</span>
            </div>
            <Input
              placeholder="Nome do usuario"
              {...register('nome', {
                required: 'Campo obrigatorio',
                maxLength: { value: 200, message: 'Maximo 200 caracteres' },
              })}
              error={errors.nome?.message}
            />
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <Mail className="w-4 h-4" />
              <span>Email *</span>
            </div>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              {...register('email', {
                required: 'Campo obrigatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email invalido',
                },
              })}
              error={errors.email?.message}
            />
          </div>

          {/* Telefone */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <Smartphone className="w-4 h-4" />
              <span>Telefone</span>
            </div>
            <Input
              placeholder="(00) 00000-0000"
              value={telefoneValue}
              onChange={handleTelefoneChange}
              maxLength={15}
            />
          </div>

          {/* Senha */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <Lock className="w-4 h-4" />
              <span>Senha {!isEditing && '*'}</span>
            </div>
            <Input
              type="password"
              placeholder={isEditing ? 'Deixe em branco para manter' : 'Minimo 6 caracteres'}
              {...register('senha', {
                minLength: { value: 6, message: 'Minimo 6 caracteres' },
                required: !isEditing ? 'Campo obrigatorio' : false,
              })}
              error={errors.senha?.message}
            />
          </div>

          {/* Confirmar Senha */}
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-medium mb-2">
              <Lock className="w-4 h-4" />
              <span>Confirmar Senha</span>
            </div>
            <Input
              type="password"
              placeholder="Repita a senha"
              {...register('confirmarSenha')}
              error={errors.confirmarSenha?.message}
            />
          </div>
        </div>

        {/* Botoes */}
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
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
