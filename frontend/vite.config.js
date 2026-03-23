import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/login': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/cadastro': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/usuarios': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/healthcheck': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
})
