import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({ 
      registerType: 'prompt',
      devOptions: {
        enabled: true
      },
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon-180x180.png',
      ],
      manifest: {
        name: 'budgeting tool',
        short_name: 'budget',
        description: 'A private, local-first budgeting tool.',
        theme_color: '#161311',
        background_color: '#f3f2ef',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      }
    })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
