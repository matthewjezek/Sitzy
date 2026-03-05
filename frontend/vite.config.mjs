import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icons/*.png', 'splash/*.png'],
      manifest: {
        name: 'Sitzy',
        short_name: 'Sitzy',
        description: 'Sdílení jízd a zasedací pořádek',
        theme_color: '#7350F2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/rides',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globIgnores: ['**/splash/**'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        navigateFallback: '/login',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minut
              },
            },
          },
        ],
      },
    }),
  ],
  // server: {
  //   proxy: {
  //     '/auth': {
  //       target: 'http://localhost:8000',
  //       changeOrigin: true,
  //     },
  //     '/cars': {
  //       target: 'http://localhost:8000',
  //       changeOrigin: true,
  //     },
  //     '/rides': {
  //       target: 'http://localhost:8000',
  //       changeOrigin: true,
  //     },
  //     '/invitations': {
  //       target: 'http://localhost:8000',
  //       changeOrigin: true,
  //     },
  //     '/health': {
  //       target: 'http://localhost:8000',
  //       changeOrigin: true,
  //     },
  //   },
  // },
})