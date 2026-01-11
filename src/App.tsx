import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layouts
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Pages
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ClientesListPage from './pages/clientes/ClientesListPage'
import ColaboradoresListPage from './pages/colaboradores/ColaboradoresListPage'
import CargosListPage from './pages/cargos/CargosListPage'
import ServicosListPage from './pages/servicos/ServicosListPage'
import ProdutosListPage from './pages/produtos/ProdutosListPage'
import TiposRecebimentoListPage from './pages/tipos-recebimento/TiposRecebimentoListPage'
import ComandasListPage from './pages/comandas/ComandasListPage'
import ComandaPage from './pages/comandas/ComandaPage'
import UsuariosListPage from './pages/usuarios/UsuariosListPage'
import FiliaisListPage from './pages/filiais/FiliaisListPage'
import WhatsAppListPage from './pages/whatsapp/WhatsAppListPage'
import SaloesListPage from './pages/admin/SaloesListPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsuariosListPage from './pages/admin/AdminUsuariosListPage'
import AdminWhatsAppListPage from './pages/admin/AdminWhatsAppListPage'
import AniversariantesListPage from './pages/aniversariantes/AniversariantesListPage'
import ComissoesRelatorioPage from './pages/relatorios/ComissoesRelatorioPage'
import MinhasComandasPage from './pages/colaborador/MinhasComandasPage'
import RelatoriosComandasPage from './pages/colaborador/RelatoriosComandasPage'

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore()

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route Component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, usuario, _hasHydrated } = useAuthStore()

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    // Colaborador vai para minhas-comandas, outros para dashboard
    const redirectTo = usuario?.is_colaborador ? '/minhas-comandas' : '/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

// Admin Route Component - bloqueia acesso de colaboradores
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { usuario } = useAuthStore()

  // Colaborador nao pode acessar rotas admin - redireciona para minhas-comandas
  if (usuario?.is_colaborador) {
    return <Navigate to="/minhas-comandas" replace />
  }

  return <>{children}</>
}

// Colaborador Route Component - apenas colaboradores podem acessar
const ColaboradorRoute = ({ children }: { children: React.ReactNode }) => {
  const { usuario } = useAuthStore()

  // Apenas colaboradores podem acessar
  if (!usuario?.is_colaborador) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Index Redirect - redireciona baseado no tipo de usuario
const IndexRedirect = () => {
  const { usuario } = useAuthStore()
  const redirectTo = usuario?.is_colaborador ? '/minhas-comandas' : '/dashboard'
  return <Navigate to={redirectTo} replace />
}

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Index - redireciona baseado no tipo de usuario */}
          <Route index element={<IndexRedirect />} />

          {/* Rotas exclusivas para colaboradores */}
          <Route path="minhas-comandas" element={<ColaboradorRoute><MinhasComandasPage /></ColaboradorRoute>} />
          <Route path="relatorio-comandas" element={<ColaboradorRoute><RelatoriosComandasPage /></ColaboradorRoute>} />

          {/* Rotas bloqueadas para colaboradores */}
          <Route path="dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
          <Route path="clientes" element={<AdminRoute><ClientesListPage /></AdminRoute>} />
          <Route path="aniversariantes" element={<AdminRoute><AniversariantesListPage /></AdminRoute>} />
          <Route path="relatorios/comissoes" element={<AdminRoute><ComissoesRelatorioPage /></AdminRoute>} />
          <Route path="colaboradores" element={<AdminRoute><ColaboradoresListPage /></AdminRoute>} />
          <Route path="cargos" element={<AdminRoute><CargosListPage /></AdminRoute>} />
          <Route path="servicos" element={<AdminRoute><ServicosListPage /></AdminRoute>} />
          <Route path="produtos" element={<AdminRoute><ProdutosListPage /></AdminRoute>} />
          <Route path="tipos-recebimento" element={<AdminRoute><TiposRecebimentoListPage /></AdminRoute>} />
          <Route path="comandas" element={<AdminRoute><ComandasListPage /></AdminRoute>} />
          <Route path="comandas/:id" element={<AdminRoute><ComandaPage /></AdminRoute>} />
          <Route path="usuarios" element={<AdminRoute><UsuariosListPage /></AdminRoute>} />
          <Route path="filiais" element={<AdminRoute><FiliaisListPage /></AdminRoute>} />
          <Route path="whatsapp" element={<AdminRoute><WhatsAppListPage /></AdminRoute>} />

          {/* Rotas Admin (Super Usuario) - Paginas separadas sem dependencia de salao */}
          <Route path="admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="admin/saloes" element={<AdminRoute><SaloesListPage /></AdminRoute>} />
          <Route path="admin/usuarios" element={<AdminRoute><AdminUsuariosListPage /></AdminRoute>} />
          <Route path="admin/whatsapp" element={<AdminRoute><AdminWhatsAppListPage /></AdminRoute>} />
        </Route>

        {/* 404 - redireciona baseado no tipo de usuario */}
        <Route path="*" element={<IndexRedirect />} />
      </Routes>
    </HashRouter>
  )
}

export default App
