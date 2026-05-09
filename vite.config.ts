import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// npm run dev only runs Vite frontend
// API routes require npm run pages:dev or a separate Wrangler server on port 8788
export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
})