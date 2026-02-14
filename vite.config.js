import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 로컬 개발 시 /api를 배포 백엔드로 프록시(환경변수로 오버라이드 가능).
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'https://todo-list-pwa-xi.vercel.app'

  return {
    server: {
      proxy: {
        '/api': {
          // 모든 환경에서 프런트는 상대 경로 /api만 사용하도록 유지.
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      vue(),
      VitePWA({
        // 새 빌드가 배포되면 서비스워커를 백그라운드에서 자동 갱신.
        registerType: 'autoUpdate',
        manifest: {
          id: '/?v=20260214-circle-max',
          name: 'Todogram',
          short_name: 'Todogram',
          description: 'Todogram: installable todo app that works offline.',
          theme_color: '#0d90c9',
          background_color: '#f3f4f6',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/todogram-icon-20260214-circle-max-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/todogram-icon-20260214-circle-max-512.png',
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
