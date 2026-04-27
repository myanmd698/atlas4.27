import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Only /api/billing; other /api calls are handled by MSW in the browser.
    proxy: {
      '/api/billing': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
