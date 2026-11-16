/* global process */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// `npm run dev` fora do Docker: o proxy mantém a mesma origem que o nginx usa em produção (cookies de sessão).
// Padrão: o backend local (`npm run dev` em backend/, porta 3000). Outro alvo: VITE_PROXY_TARGET.
const target = process.env.VITE_PROXY_TARGET || 'http://localhost:3000'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': target,
      '/health': target
    }
  }
})
