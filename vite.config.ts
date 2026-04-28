import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'
import path from 'path'
import autoprefixer from 'autoprefixer'

const filename = fileURLToPath(import.meta.url);
const pathSegments = path.dirname(filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true }),],
  css: {
    postcss: {
      plugins: [
        autoprefixer
      ],
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(pathSegments, './src'),
    }
  },
  publicDir: 'src/assets'
})