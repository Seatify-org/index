import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Proxy для обхода CORS в dev-режиме
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/movies': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/sessions': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/bookings': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
})