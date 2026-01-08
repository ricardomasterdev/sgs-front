import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// SGSx Frontend - Porta 5174 (diferente do GPVx que usa 5173)
// Configurado para acesso de qualquer origem (dev/prod)
export default defineConfig({
  plugins: [react()],
  base: '/sgs/',
  server: {
    port: 5174,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
    allowedHosts: 'all'
  },
  preview: {
    port: 5174,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
    allowedHosts: 'all'
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
