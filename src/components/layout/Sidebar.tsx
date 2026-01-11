import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Scissors,
  Package,
  CreditCard,
  Receipt,
  Building2,
  MessageCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Store,
  Shield,
  Cake,
  Briefcase,
  FolderOpen,
  BarChart3,
  Cog,
  DollarSign,
  X,
  UserCircle,
  FileText,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { cn } from '../../utils/cn'

interface MenuItem {
  icon: React.ElementType
  label: string
  path: string
  adminOnly?: boolean
  superOnly?: boolean
  children?: MenuItem[]
}

// Menu para colaboradores
const colaboradorMenuItems: MenuItem[] = [
  { icon: Receipt, label: 'Minhas Comandas', path: '/minhas-comandas' },
  { icon: FileText, label: 'Relatorio', path: '/relatorio-comandas' },
]

// Menu para usuarios normais (admin de salao) - estrutura com submenus retráteis
const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Receipt, label: 'Comandas', path: '/comandas' },
  {
    icon: FolderOpen,
    label: 'Cadastros',
    path: '/cadastros',
    children: [
      { icon: Users, label: 'Clientes', path: '/clientes' },
      { icon: UserCog, label: 'Colaboradores', path: '/colaboradores' },
      { icon: Briefcase, label: 'Cargos', path: '/cargos' },
      { icon: Scissors, label: 'Servicos', path: '/servicos' },
      { icon: Package, label: 'Produtos', path: '/produtos' },
      { icon: CreditCard, label: 'Formas Pagamento', path: '/tipos-recebimento' },
    ],
  },
  {
    icon: BarChart3,
    label: 'Relatorios',
    path: '/relatorios',
    children: [
      { icon: Cake, label: 'Aniversariantes', path: '/aniversariantes' },
      { icon: DollarSign, label: 'Comissoes', path: '/relatorios/comissoes' },
    ],
  },
  {
    icon: Cog,
    label: 'Gestao',
    path: '/gestao',
    adminOnly: true,
    children: [
      { icon: Building2, label: 'Filiais', path: '/filiais' },
      { icon: Settings, label: 'Usuarios', path: '/usuarios' },
      { icon: MessageCircle, label: 'WhatsApp', path: '/whatsapp' },
    ],
  },
]

// Menu para super usuario SEM salao selecionado
const adminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  {
    icon: Shield,
    label: 'Administracao',
    path: '/admin',
    children: [
      { icon: Store, label: 'Saloes', path: '/admin/saloes' },
      { icon: UserCog, label: 'Usuarios', path: '/admin/usuarios' },
      { icon: MessageCircle, label: 'WhatsApp', path: '/admin/whatsapp' },
    ],
  },
]

// Menu de administracao para super usuario COM salao selecionado
const adminMenuItemsWithSalao: MenuItem[] = [
  {
    icon: Shield,
    label: 'Administracao',
    path: '/admin',
    children: [
      { icon: Store, label: 'Saloes', path: '/admin/saloes' },
      { icon: UserCog, label: 'Usuarios', path: '/admin/usuarios' },
      { icon: MessageCircle, label: 'WhatsApp', path: '/admin/whatsapp' },
    ],
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario, salao, logout } = useAuthStore()
  const { sidebarCollapsed, toggleSidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = usuario?.is_admin_salao || usuario?.super_usuario
  const isSuper = usuario?.super_usuario
  const isColaborador = usuario?.is_colaborador

  // Super usuario sem salao selecionado - modo admin apenas
  const isSuperUserNoSalao = isSuper && !salao

  // Toggle submenu expandido
  const toggleSubmenu = (path: string) => {
    setExpandedMenus(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    )
  }

  // Verifica se o submenu esta ativo (algum filho esta na rota atual)
  const isSubmenuActive = (item: MenuItem): boolean => {
    if (item.children) {
      return item.children.some(child => location.pathname === child.path || location.pathname.startsWith(child.path + '/'))
    }
    return false
  }

  // Verifica se o submenu deve estar expandido (apenas pelo estado, nao pela rota)
  const isSubmenuExpanded = (item: MenuItem): boolean => {
    return expandedMenus.includes(item.path)
  }

  // Filtra itens de menu baseado no tipo de usuario
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      if (item.superOnly && !isSuper) return false
      if (item.adminOnly && !isAdmin) return false
      return true
    })
  }

  // Colaborador: ve apenas Minhas Comandas
  // Super usuario sem salao: ve apenas opcoes de administracao (Dashboard + Administracao)
  // Super usuario com salao: ve menu completo do salao + secao Administracao
  // Usuario normal: ve menu completo do salao
  const allMenuItems = isColaborador
    ? colaboradorMenuItems
    : isSuper
      ? salao
        ? [...filterMenuItems(menuItems), ...adminMenuItemsWithSalao]
        : adminMenuItems
      : filterMenuItems(menuItems)

  // Expande automaticamente o menu quando um filho esta ativo
  useEffect(() => {
    allMenuItems.forEach(item => {
      if (item.children && isSubmenuActive(item) && !expandedMenus.includes(item.path)) {
        setExpandedMenus(prev => [...prev, item.path])
      }
    })
  }, [location.pathname])

  // Fecha a sidebar mobile quando navegar
  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  // Verifica se o item e do menu de administracao
  const isAdminItem = (item: MenuItem): boolean => {
    return item.path.startsWith('/admin') || item.label === 'Administracao'
  }

  // Renderiza um item de menu
  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = isSubmenuExpanded(item)
    const isActive = hasChildren ? isSubmenuActive(item) : location.pathname === item.path
    // Usa estilo laranja para itens de administracao OU quando super usuario esta em modo admin (sem salao)
    const useAmberStyle = isAdminItem(item) || isSuperUserNoSalao
    // Menu pai fica marcado quando expandido OU quando tem filho ativo
    const isParentHighlighted = hasChildren && (isExpanded || isActive)

    if (hasChildren) {
      return (
        <li key={item.path}>
          <button
            onClick={() => toggleSubmenu(item.path)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full',
              isParentHighlighted
                ? useAmberStyle
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-gradient-to-r from-primary-500 to-pink-500 text-white shadow-md shadow-primary-500/25'
                : useAmberStyle
                  ? 'text-amber-600 hover:bg-amber-50'
                  : 'text-slate-600 hover:bg-primary-50 hover:text-primary-700',
              sidebarCollapsed && 'lg:justify-center lg:px-2'
            )}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className={cn('flex-1 text-left', sidebarCollapsed && 'lg:hidden')}>{item.label}</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isExpanded && 'rotate-180',
                sidebarCollapsed && 'lg:hidden'
              )}
            />
          </button>

          {/* Submenu */}
          <ul
            className={cn(
              'overflow-hidden transition-all duration-200 ml-2 border-l-2 border-slate-200',
              isExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0',
              sidebarCollapsed && 'lg:hidden'
            )}
          >
            {item.children!.map(child => (
              <li key={child.path}>
                <NavLink
                  to={child.path}
                  onClick={handleNavClick}
                  className={({ isActive: childActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 pl-8 rounded-r-xl text-sm font-medium transition-all duration-200',
                      childActive
                        ? useAmberStyle
                          ? 'bg-amber-100 text-amber-700 border-l-2 border-amber-500 -ml-[2px]'
                          : 'bg-primary-100 text-primary-700 border-l-2 border-primary-500 -ml-[2px]'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    )
                  }
                >
                  <child.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{child.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </li>
      )
    }

    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          onClick={handleNavClick}
          className={({ isActive: navActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              navActive
                ? useAmberStyle
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-gradient-to-r from-primary-500 to-pink-500 text-white shadow-md shadow-primary-500/25'
                : useAmberStyle
                  ? 'text-amber-600 hover:bg-amber-50'
                  : 'text-slate-600 hover:bg-primary-50 hover:text-primary-700',
              sidebarCollapsed && 'lg:justify-center lg:px-2'
            )
          }
          title={sidebarCollapsed ? item.label : undefined}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span className={cn(sidebarCollapsed && 'lg:hidden')}>{item.label}</span>
        </NavLink>
      </li>
    )
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-40 shadow-sm',
        // Desktop
        'lg:translate-x-0',
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
        // Mobile - sempre largura fixa, controlado por translate
        'w-72',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo - cor muda baseado no tipo de usuario */}
      <div className={cn(
        'h-16 flex items-center justify-between px-4 border-b border-slate-100',
        isColaborador
          ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
          : isSuper
            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
            : 'bg-gradient-to-r from-primary-500 to-pink-500'
      )}>
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'lg:hidden')}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
            {isColaborador ? (
              <UserCircle className="w-5 h-5 text-white" />
            ) : isSuper ? (
              <Shield className="w-5 h-5 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">SGSx</h1>
            <p className="text-xs text-white/80 -mt-0.5">
              {isColaborador ? 'Colaborador' : isSuper ? 'Super Admin' : 'Gestao de Salao'}
            </p>
          </div>
        </div>

        {/* Logo collapsed - desktop only */}
        <div className={cn('hidden', sidebarCollapsed && 'lg:flex lg:mx-auto')}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
            {isColaborador ? (
              <UserCircle className="w-5 h-5 text-white" />
            ) : isSuper ? (
              <Shield className="w-5 h-5 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
        </div>

        {/* Botao collapse - desktop */}
        <button
          onClick={toggleSidebarCollapsed}
          className={cn(
            'hidden lg:block p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors',
            sidebarCollapsed && 'absolute -right-3 top-6 bg-white shadow-lg border border-slate-200 text-slate-600 hover:text-slate-800'
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Botao fechar - mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Usuario Info */}
      <div className={cn(
        'px-3 py-4 border-b border-slate-100',
        sidebarCollapsed ? 'lg:flex lg:justify-center' : ''
      )}>
        <div className={cn('hidden', sidebarCollapsed && 'lg:block')}>
          <div className="relative group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-pink-500 flex items-center justify-center text-white font-medium">
              {usuario?.nome?.charAt(0) || 'U'}
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
              <p className="text-sm font-medium text-white">{usuario?.nome}</p>
              {usuario?.perfil_codigo && (
                <p className="text-xs text-slate-300">{usuario.perfil_codigo}</p>
              )}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
            </div>
          </div>
        </div>

        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'lg:hidden')}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-pink-500 flex items-center justify-center text-white font-medium">
            {usuario?.foto_url ? (
              <img src={usuario.foto_url} alt={usuario.nome} className="w-full h-full rounded-full object-cover" />
            ) : (
              usuario?.nome?.charAt(0) || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {usuario?.nome}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {usuario?.perfil_codigo || 'Usuario'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin bg-gradient-to-b from-slate-50/50 to-white">
        <ul className="space-y-1">
          {allMenuItems.map((item) => renderMenuItem(item))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-2">
        {/* Configuracoes - apenas para admin (nao colaborador) */}
        {isAdmin && !isSuperUserNoSalao && !isColaborador && (
          <NavLink
            to="/configuracoes"
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white shadow-md shadow-primary-500/25'
                  : 'text-slate-600 hover:bg-primary-50 hover:text-primary-700',
                sidebarCollapsed && 'lg:justify-center lg:px-2'
              )
            }
          >
            <Settings className="w-5 h-5" />
            <span className={cn(sidebarCollapsed && 'lg:hidden')}>Configuracoes</span>
          </NavLink>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full',
            'text-red-500 hover:bg-red-50 hover:text-red-600',
            sidebarCollapsed && 'lg:justify-center lg:px-2'
          )}
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
          <span className={cn(sidebarCollapsed && 'lg:hidden')}>Sair</span>
        </button>
      </div>
    </aside>
  )
}
