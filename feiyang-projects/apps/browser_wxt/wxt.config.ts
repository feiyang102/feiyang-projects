import { defineConfig } from "wxt";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  runner: {
    startUrls: ["https://www.baidu.com"],
  },
  vite: () => ({
    plugins: [
      // ...
      AutoImport({
        resolvers: [ElementPlusResolver()],
        dts: 'types/auto-imports.d.ts',
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'types/components.d.ts',
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          // additionalData: `@import "@/entrypoints/content/styles/variables.scss";`
        }
      }
    }
  }),
});
