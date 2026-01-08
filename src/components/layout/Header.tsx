import { useState, Fragment, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '../../utils/cn'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { authService } from '../../services/auth.service'
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Store,
  Shield,
  Building2,
  X,
} from 'lucide-react'
import { Menu as HeadlessMenu, Transition, Popover } from '@headlessui/react'
import toast from 'react-hot-toast'

export default function Header() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { usuario, salao, saloes, filial, filiais, logout, setSalao, setTokens, setFilial } = useAuthStore()
  const { sidebarCollapsed } = useUIStore()
  const [switchingSalao, setSwitchingSalao] = useState(false)
  const [switchingFilial, setSwitchingFilial] = useState(false)
  const [salaoSearchQuery, setSalaoSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Super usuario sem salao selecionado - modo admin apenas
  const isSuperUserNoSalao = usuario?.super_usuario && !salao

  // Filtrar saloes pela busca
  const filteredSaloes = useMemo(() => {
    if (!salaoSearchQuery) return saloes
    const query = salaoSearchQuery.toLowerCase()
    return saloes.filter(s =>
      s.nome.toLowerCase().includes(query) ||
      s.codigo?.toLowerCase().includes(query)
    )
  }, [saloes, salaoSearchQuery])

  // Usuario admin pode ver seletor de filiais
  const canSeeFiliais = usuario?.is_admin_salao && filiais && filiais.length > 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitchSalao = async (salaoId: string | null, close: () => void) => {
    if (salaoId === null) {
      // Visao Geral selecionada - navega para dashboard admin
      setSalao(null)
      setFilial(null)
      setSalaoSearchQuery('')
      close()
      // Invalida apenas queries que dependem de salao, nao todas
      await queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0]
        // Nao invalida queries admin que nao dependem de salao
        if (typeof key === 'string' && key.startsWith('admin-')) return false
        return true
      }})
      toast.success('Modo Visao Geral ativado')
      navigate('/admin/dashboard')
      return
    }

    if (salaoId === salao?.id) {
      close()
      return
    }

    setSwitchingSalao(true)
    try {
      const response = await authService.switchSalao(salaoId)
      const novoSalao = saloes.find(s => s.id === salaoId)
      if (novoSalao) {
        setSalao(novoSalao)
        setFilial(null)
        setTokens(response.access_token, response.refresh_token)
        setSalaoSearchQuery('')
        close()
        await queryClient.invalidateQueries()
        toast.success(`Salao alterado para ${novoSalao.nome}`)
        navigate('/dashboard')
      }
    } catch {
      toast.error('Erro ao trocar de salao')
    } finally {
      setSwitchingSalao(false)
    }
  }

  const handleSwitchFilial = async (filialId: string | null, close: () => void) => {
    if (filialId === null) {
      // Voltar para matriz
      if (!filial) {
        close()
        return
      }
      setSwitchingFilial(true)
      try {
        const response = await authService.switchFilial(undefined)
        setFilial(null)
        setTokens(response.access_token, response.refresh_token)
        close()
        await queryClient.invalidateQueries()
        toast.success('Visualizando Matriz')
        navigate('/dashboard')
      } catch {
        toast.error('Erro ao voltar para matriz')
      } finally {
        setSwitchingFilial(false)
      }
      return
    }

    if (filialId === filial?.id) {
      close()
      return
    }

    setSwitchingFilial(true)
    try {
      const response = await authService.switchFilial(filialId)
      const novaFilial = filiais.find(f => f.id === filialId)
      if (novaFilial) {
        setFilial(novaFilial)
        setTokens(response.access_token, response.refresh_token)
        close()
        await queryClient.invalidateQueries()
        toast.success(`Filial alterada para ${novaFilial.nome}`)
        navigate('/dashboard')
      }
    } catch {
      toast.error('Erro ao trocar de filial')
    } finally {
      setSwitchingFilial(false)
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-30 flex items-center px-6 gap-4 transition-all duration-300 shadow-sm',
        sidebarCollapsed ? 'left-20' : 'left-64'
      )}
    >
      {/* Seletor de Salao - Apenas para super usuario */}
      {usuario?.super_usuario && saloes && saloes.length > 0 && (
        <Popover className="relative">
          {({ open, close }) => (
            <>
              <Popover.Button
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg border transition-all outline-none',
                  'bg-amber-50 border-amber-300 hover:border-amber-400 hover:bg-amber-100/50',
                  open && 'border-amber-500 ring-2 ring-amber-200'
                )}
                disabled={switchingSalao}
              >
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Store className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    Salao
                  </p>
                  <p className="text-sm font-medium text-slate-800 truncate max-w-[130px] -mt-0.5">
                    {salao?.nome || 'Visao Geral'}
                  </p>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-amber-600 transition-transform', open && 'rotate-180')} />
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
                afterEnter={() => searchInputRef.current?.focus()}
                afterLeave={() => setSalaoSearchQuery('')}
              >
                <Popover.Panel className="absolute left-0 mt-2 w-80 origin-top-left rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden z-50">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500">
                    <p className="text-xs font-medium text-white/80">Super Usuario</p>
                    <p className="text-sm font-semibold text-white">Selecione o Salao</p>
                  </div>

                  {/* Campo de busca */}
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-slate-100 border border-transparent focus:bg-white focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder:text-slate-400"
                        placeholder="Buscar salao..."
                        value={salaoSearchQuery}
                        onChange={(e) => setSalaoSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                      {salaoSearchQuery && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600"
                          onClick={() => setSalaoSearchQuery('')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-1 max-h-64 overflow-y-auto">
                    {/* Opcao Visao Geral */}
                    <button
                      onClick={() => handleSwitchSalao(null, close)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        'hover:bg-amber-50',
                        !salao ? 'bg-amber-100 text-amber-700' : 'text-slate-700'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">Visao Geral</p>
                        <p className="text-xs text-slate-500">Painel administrativo</p>
                      </div>
                      {!salao && (
                        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Ativo</span>
                      )}
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* Lista de saloes filtrados */}
                    {filteredSaloes.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-slate-500">
                        Nenhum salao encontrado
                      </div>
                    ) : (
                      filteredSaloes.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleSwitchSalao(s.id, close)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                            'hover:bg-primary-50',
                            s.id === salao?.id ? 'bg-primary-100 text-primary-700' : 'text-slate-700'
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                            {s.nome.charAt(0)}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium truncate">{s.nome}</p>
                            <p className="text-xs text-slate-500 truncate">{s.codigo}</p>
                          </div>
                          {s.id === salao?.id && (
                            <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">Ativo</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Contador de resultados */}
                  {salaoSearchQuery && (
                    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs text-slate-500">
                        {filteredSaloes.length} de {saloes.length} salao(es)
                      </p>
                    </div>
                  )}
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      )}

      {/* Usuario normal: exibicao do salao */}
      {!usuario?.super_usuario && salao && (
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg border',
            'bg-primary-50 border-primary-300'
          )}
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary-400 to-pink-500 flex items-center justify-center">
            <Store className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide">Salao</p>
            <p className="text-sm font-medium text-slate-800 truncate max-w-[150px] -mt-0.5">
              {salao.nome}
            </p>
          </div>
        </div>
      )}

      {/* Seletor de Filial - para admin de salao */}
      {canSeeFiliais && (
        <Popover className="relative">
          {({ open, close }) => (
            <>
              <Popover.Button
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg border transition-all outline-none',
                  'bg-violet-50 border-violet-300 hover:border-violet-400 hover:bg-violet-100/50',
                  open && 'border-violet-500 ring-2 ring-violet-200'
                )}
                disabled={switchingFilial}
              >
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide">Filial</p>
                  <p className="text-sm font-medium text-slate-800 truncate max-w-[130px] -mt-0.5">
                    {filial?.nome || 'Matriz'}
                  </p>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-violet-600 transition-transform', open && 'rotate-180')} />
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Popover.Panel className="absolute left-0 mt-2 w-72 origin-top-left rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden z-50">
                  <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500">
                    <p className="text-xs font-medium text-white/80">Administrador</p>
                    <p className="text-sm font-semibold text-white">Selecione a Filial</p>
                  </div>

                  <div className="p-1 max-h-64 overflow-y-auto">
                    {/* Opcao Matriz */}
                    <button
                      onClick={() => handleSwitchFilial(null, close)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        'hover:bg-violet-50',
                        !filial ? 'bg-violet-100 text-violet-700' : 'text-slate-700'
                      )}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{salao?.nome || 'Matriz'}</p>
                        <p className="text-xs text-slate-500">Matriz Principal</p>
                      </div>
                      {!filial && (
                        <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">Ativo</span>
                      )}
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* Lista de filiais */}
                    {filiais.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleSwitchFilial(f.id, close)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                          'hover:bg-violet-50',
                          f.id === filial?.id ? 'bg-violet-100 text-violet-700' : 'text-slate-700'
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center text-white font-bold text-xs">
                          {f.nome.charAt(0)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium truncate">{f.nome}</p>
                          <p className="text-xs text-slate-500 truncate">{f.codigo}</p>
                        </div>
                        {f.id === filial?.id && (
                          <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">Ativo</span>
                        )}
                      </button>
                    ))}
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      )}

      {/* Perfil do usuario */}
      {usuario?.perfil_codigo && (
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg border',
            'bg-slate-50 border-slate-300'
          )}
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Perfil</p>
            <p className="text-sm font-medium text-slate-800 truncate max-w-[90px] -mt-0.5">
              {usuario.perfil_codigo}
            </p>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Notificacoes - esconder se super usuario sem salao */}
        {!isSuperUserNoSalao && (
          <button className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
        )}

        {/* Menu do usuario */}
        <HeadlessMenu as="div" className="relative">
          <HeadlessMenu.Button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-pink-500 flex items-center justify-center text-white font-medium">
              {usuario?.foto_url ? (
                <img src={usuario.foto_url} alt={usuario.nome} className="w-full h-full rounded-full object-cover" />
              ) : (
                usuario?.nome?.charAt(0) || 'U'
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </HeadlessMenu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden">
              <div className={cn(
                'p-3',
                usuario?.super_usuario
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-primary-500 to-pink-500'
              )}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{usuario?.nome}</p>
                  {usuario?.super_usuario && <Shield className="w-4 h-4 text-white" />}
                </div>
                <p className="text-xs text-white/80">{usuario?.email}</p>
              </div>

              <div className="p-1">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/perfil')}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                      )}
                    >
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </button>
                  )}
                </HeadlessMenu.Item>

                {!isSuperUserNoSalao && (
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/configuracoes')}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors',
                          active ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                        )}
                      >
                        <Settings className="w-4 h-4" />
                        Configuracoes
                      </button>
                    )}
                  </HeadlessMenu.Item>
                )}

                {usuario?.super_usuario && (
                  <>
                    <div className="my-1 border-t border-slate-100" />
                    <HeadlessMenu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate('/admin/saloes')}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors',
                            active ? 'bg-amber-50 text-amber-600' : 'text-amber-600'
                          )}
                        >
                          <Store className="w-4 h-4" />
                          Gerenciar Saloes
                        </button>
                      )}
                    </HeadlessMenu.Item>
                  </>
                )}
              </div>

              <div className="p-1 border-t border-slate-100">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        active ? 'bg-red-50 text-red-600' : 'text-red-600'
                      )}
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  )}
                </HeadlessMenu.Item>
              </div>
            </HeadlessMenu.Items>
          </Transition>
        </HeadlessMenu>
      </div>
    </header>
  )
}
