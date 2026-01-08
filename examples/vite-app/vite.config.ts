import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@tour-kit/checklists': path.resolve(__dirname, '../../packages/checklists/dist/index.js'),
      '@tour-kit/adoption': path.resolve(__dirname, '../../packages/adoption/dist/index.js'),
    },
  },
})
