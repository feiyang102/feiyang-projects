import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    cors: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
})
