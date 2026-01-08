import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useUIStore } from '../../stores/uiStore'
import { cn } from '../../utils/cn'

export default function MainLayout() {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        )}
      >
        <Header />
        <main className="p-6 pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
