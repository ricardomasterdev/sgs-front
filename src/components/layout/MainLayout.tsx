import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useUIStore } from '../../stores/uiStore'
import { cn } from '../../utils/cn'

export default function MainLayout() {
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          // Desktop: margem baseada na sidebar
          'lg:ml-64',
          sidebarCollapsed && 'lg:ml-20',
          // Mobile: sem margem
          'ml-0'
        )}
      >
        <Header />
        <main className="p-4 pt-20 lg:p-6 lg:pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
