import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local dev can proxy /api to deployed backend unless overridden by env var.
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'https://todo-list-pwa-xi.vercel.app'

  return {
    server: {
      proxy: {
        '/api': {
          // Keep frontend code using relative /api path in every environment.
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    plugins: [
      vue(),
      VitePWA({
        // Automatically update SW in the background when a new build is available.
        registerType: 'autoUpdate',
        manifest: {
          name: 'TODO List PWA',
          short_name: 'TODO',
          description: 'Vue 3 TODO app that works offline and can be installed.',
          theme_color: '#1f2937',
          background_color: '#f4f6fb',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
  }
})
