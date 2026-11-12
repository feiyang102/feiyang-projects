import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^@admin\/core$/, replacement: r('../../packages/core/src/index.ts') },
      { find: /^@admin\/ui$/, replacement: r('../../packages/ui/src/index.ts') },
      { find: /^@admin\/ui\/style\.css$/, replacement: r('../../packages/ui/src/styles.css') },
      { find: /^@admin\/auth$/, replacement: r('../../packages/auth/src/index.ts') },
      { find: /^@admin\/micro$/, replacement: r('../../packages/micro/src/index.ts') },
      { find: /^@admin\/bridge$/, replacement: r('../../packages/bridge/src/index.ts') },
    ],
  },
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
})
