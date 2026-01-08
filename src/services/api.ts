import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// SGSx Backend na porta 8001 (GPVx usa 8000)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Se erro 401 e não é retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refresh_token: refreshToken }
          )

          const { access_token, refresh_token } = response.data
          useAuthStore.getState().setTokens(access_token, refresh_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch {
          // Refresh falhou, fazer logout
          useAuthStore.getState().logout()
          window.location.href = '/sgs/login'
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/sgs/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
