import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192x192.svg', 'icon-512x512.svg'],
      manifest: {
        name: 'Sistema de Beneficio de Café',
        short_name: 'Beneficio',
        description: 'Sistema integral de gestión para beneficio de café',
        theme_color: '#8B4513',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        categories: ['productivity', 'business'],
        screenshots: [],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Ver dashboard principal',
            url: '/dashboard',
            icons: [{ src: 'icon-192x192.svg', sizes: '192x192' }]
          },
          {
            name: 'Catación',
            short_name: 'Catación',
            description: 'Gestión de cataciones',
            url: '/cupping',
            icons: [{ src: 'icon-192x192.svg', sizes: '192x192' }]
          },
          {
            name: 'Lotes',
            short_name: 'Lotes',
            description: 'Gestión de lotes',
            url: '/lots',
            icons: [{ src: 'icon-192x192.svg', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:8000\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^http:\/\/localhost:8000\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: false,
        type: 'module'
      },
      strategies: 'generateSW'
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    hmr: {
      port: 5173,
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
