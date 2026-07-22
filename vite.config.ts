import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Dev-Spaces-Start-workspace-patternfly/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    open: true,
  },
})
