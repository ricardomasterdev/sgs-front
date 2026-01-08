import { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Right - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">SGSx</h1>
          <p className="text-xl text-white/90 mb-2">Sistema de Gestão</p>
          <p className="text-lg text-white/80">Salão de Beleza</p>
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm text-white/70">Online</div>
            </div>
            <div>
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm text-white/70">Disponível</div>
            </div>
            <div>
              <div className="text-3xl font-bold">Fácil</div>
              <div className="text-sm text-white/70">de Usar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
