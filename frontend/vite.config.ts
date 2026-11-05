import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:43080',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [vue()],
  server: {
    host: 'localhost',
    port: 43081,
    strictPort: true,
    proxy: apiProxy,
  },
  preview: {
    host: 'localhost',
    port: 4173,
    strictPort: true,
    proxy: apiProxy,
  },
})
