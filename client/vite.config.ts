import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/rest': 'http://localhost:8080',
      '/auth': 'http://localhost:8080',
      '/authback': 'http://localhost:8080',
      '/leave': 'http://localhost:8080',
      '/archive': 'http://localhost:8080',
    },
  },
})
