import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api/chat': 'http://localhost:3001',
    },
  },
  resolve: {
    alias: {
      '@tour-kit/checklists': path.resolve(__dirname, '../../packages/checklists/dist/index.js'),
      '@tour-kit/adoption': path.resolve(__dirname, '../../packages/adoption/dist/index.js'),
    },
  },
})
