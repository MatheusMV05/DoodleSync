import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Correção crítica para o Excalidraw rodar no Vite
    "process.env.IS_PREACT": JSON.stringify("false"),
    "process.env": {}, // Mantemos fallback seguro
  },
  // Otimização para evitar erros de dependência circular comuns no Excalidraw
  optimizeDeps: {
    include: ['@excalidraw/excalidraw']
  }
})
