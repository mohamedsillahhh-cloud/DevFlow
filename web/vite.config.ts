import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  envDir: '..',
  envPrefix: 'VITE_',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: ['exceljs'],
  },
  build: {
    commonjsOptions: {
      include: [/exceljs/, /node_modules/],
    },
  },
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
})
