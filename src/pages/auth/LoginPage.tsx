import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/auth.service'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const response = await authService.login(data)
      const { token, usuario } = response

      // Super usuario nao seleciona salao automaticamente - ve painel admin
      // Usuario normal seleciona primeiro salao da lista
      const salaoInicial = usuario.super_usuario ? null : (usuario.saloes?.[0] || null)

      login(usuario, salaoInicial, token.access_token, token.refresh_token)

      toast.success(`Bem-vindo, ${usuario.nome}!`)
      navigate('/dashboard')
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao fazer login'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Logo mobile */}
      <div className="lg:hidden flex justify-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
          <Sparkles size={32} className="text-white" />
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
        <p className="text-slate-500 mt-2">Entre com suas credenciais para acessar</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>
          <input
            type="email"
            {...register('email')}
            className="input-field"
            placeholder="seu@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('senha')}
              className="input-field pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.senha && (
            <p className="mt-1 text-sm text-red-500">{errors.senha.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Entrar'
          )}
        </button>
      </form>
    </div>
  )
}
