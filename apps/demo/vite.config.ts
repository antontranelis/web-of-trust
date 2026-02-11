import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  return {
  plugins: [react(), tailwindcss(), wasm(), topLevelAwait()],
  base: env.VITE_BASE_PATH || '/',
  resolve: {
    alias: {
      '@web-of-trust/core': path.resolve(__dirname, '../../packages/wot-core/src'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@evolu/sqlite-wasm', '@evolu/web', '@evolu/react-web'],
  },
  }
})
