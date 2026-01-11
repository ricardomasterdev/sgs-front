import re

# Read the file
with open('C:/sgs-front/src/components/layout/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add colaboradorMenuItems after the interface
old_code = '''// Menu para usuarios normais (admin de salao) - estrutura com submenus retráteis
const menuItems: MenuItem[] = ['''

new_code = '''// Menu para colaboradores - apenas Minhas Comandas
const colaboradorMenuItems: MenuItem[] = [
  { icon: Receipt, label: 'Minhas Comandas', path: '/minhas-comandas' },
]

// Menu para usuarios normais (admin de salao) - estrutura com submenus retráteis
const menuItems: MenuItem[] = ['''

content = content.replace(old_code, new_code)

# Add UserCircle to imports
old_imports = '''import {
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
} from 'lucide-react\''''

new_imports = '''import {
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
} from 'lucide-react\''''

content = content.replace(old_imports, new_imports)

# Update isAdmin and isSuper to include isColaborador
old_vars = '''  const isAdmin = usuario?.is_admin_salao || usuario?.super_usuario
  const isSuper = usuario?.super_usuario

  // Super usuario sem salao selecionado - modo admin apenas
  const isSuperUserNoSalao = isSuper && !salao'''

new_vars = '''  const isAdmin = usuario?.is_admin_salao || usuario?.super_usuario
  const isSuper = usuario?.super_usuario
  const isColaborador = usuario?.is_colaborador

  // Super usuario sem salao selecionado - modo admin apenas
  const isSuperUserNoSalao = isSuper && !salao'''

content = content.replace(old_vars, new_vars)

# Update allMenuItems to use colaboradorMenuItems
old_menu_logic = '''  // Super usuario sem salao: ve apenas opcoes de administracao (Dashboard + Administracao)
  // Super usuario com salao: ve menu completo do salao + secao Administracao
  // Usuario normal: ve menu completo do salao
  const allMenuItems = isSuper
    ? salao
      ? [...filterMenuItems(menuItems), ...adminMenuItemsWithSalao]
      : adminMenuItems
    : filterMenuItems(menuItems)'''

new_menu_logic = '''  // Colaborador: ve apenas Minhas Comandas
  // Super usuario sem salao: ve apenas opcoes de administracao (Dashboard + Administracao)
  // Super usuario com salao: ve menu completo do salao + secao Administracao
  // Usuario normal: ve menu completo do salao
  const allMenuItems = isColaborador
    ? colaboradorMenuItems
    : isSuper
      ? salao
        ? [...filterMenuItems(menuItems), ...adminMenuItemsWithSalao]
        : adminMenuItems
      : filterMenuItems(menuItems)'''

content = content.replace(old_menu_logic, new_menu_logic)

# Update logo colors to include green for collaborator
old_logo = '''      <div className={cn(
        'h-16 flex items-center justify-between px-4 border-b border-slate-100',
        isSuper
          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
          : 'bg-gradient-to-r from-primary-500 to-pink-500'
      )}>
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'lg:hidden')}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
            {isSuper ? (
              <Shield className="w-5 h-5 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">SGSx</h1>
            <p className="text-xs text-white/80 -mt-0.5">
              {isSuper ? 'Super Admin' : 'Gestao de Salao'}
            </p>
          </div>
        </div>

        {/* Logo collapsed - desktop only */}
        <div className={cn('hidden', sidebarCollapsed && 'lg:flex lg:mx-auto')}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
            {isSuper ? (
              <Shield className="w-5 h-5 text-white" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
        </div>'''

new_logo = '''      <div className={cn(
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
        </div>'''

content = content.replace(old_logo, new_logo)

# Update footer to hide settings for collaborator
old_footer = '''      {/* Footer */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-2">
        {/* Configuracoes - apenas para admin */}
        {isAdmin && !isSuperUserNoSalao && ('''

new_footer = '''      {/* Footer */}
      <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-2">
        {/* Configuracoes - apenas para admin (nao colaborador) */}
        {isAdmin && !isSuperUserNoSalao && !isColaborador && ('''

content = content.replace(old_footer, new_footer)

# Write the file
with open('C:/sgs-front/src/components/layout/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Sidebar updated successfully')
