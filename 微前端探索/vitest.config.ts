import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const r = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@admin/core': r('./packages/core/src/index.ts'),
      '@admin/bridge': r('./packages/bridge/src/index.ts'),
      '@admin/auth': r('./packages/auth/src/index.ts'),
      '@admin/micro': r('./packages/micro/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts'],
  },
})
