/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'フルーツ系統樹トラッカー',
        short_name: 'フルーツ樹',
        description: '分類階層をたどって、食べたフルーツを記録する',
        theme_color: '#2e7d32',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'ja',
        start_url: '/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // 分類データ(JSON)・画像はキャッシュしてオフライン閲覧可能にする
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith('wikimedia.org') ||
              url.hostname.endsWith('wikipedia.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fruit-images',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
