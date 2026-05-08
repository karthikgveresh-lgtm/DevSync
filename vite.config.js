import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    allowedHosts: true,
    proxy: {
      '/yjs': {
        target: 'ws://localhost:1234',
        ws: true,
      }
    }
  }
})
