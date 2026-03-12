import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url);
const pathSegments = path.dirname(filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(pathSegments, './src'),
    }
  }
})