import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * The dev server proxies `/api/*` to the backend, so in development the browser
 * only ever talks to its own origin and CORS never enters the picture. The
 * backend sees a plain server-to-server request — no preflight, no headers to
 * configure while developing.
 *
 * Point it somewhere else with VITE_API_TARGET in frontend/.env.local
 * (e.g. VITE_API_TARGET=http://127.0.0.1:9000).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
