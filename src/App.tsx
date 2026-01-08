import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
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
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter basename="/sgs">
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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clientes" element={<ClientesListPage />} />
          <Route path="aniversariantes" element={<AniversariantesListPage />} />
          <Route path="relatorios/comissoes" element={<ComissoesRelatorioPage />} />
          <Route path="colaboradores" element={<ColaboradoresListPage />} />
          <Route path="cargos" element={<CargosListPage />} />
          <Route path="servicos" element={<ServicosListPage />} />
          <Route path="produtos" element={<ProdutosListPage />} />
          <Route path="tipos-recebimento" element={<TiposRecebimentoListPage />} />
          <Route path="comandas" element={<ComandasListPage />} />
          <Route path="comandas/:id" element={<ComandaPage />} />
          <Route path="usuarios" element={<UsuariosListPage />} />
          <Route path="filiais" element={<FiliaisListPage />} />
          <Route path="whatsapp" element={<WhatsAppListPage />} />

          {/* Rotas Admin (Super Usuario) - Paginas separadas sem dependencia de salao */}
          <Route path="admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="admin/saloes" element={<SaloesListPage />} />
          <Route path="admin/usuarios" element={<AdminUsuariosListPage />} />
          <Route path="admin/whatsapp" element={<AdminWhatsAppListPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
