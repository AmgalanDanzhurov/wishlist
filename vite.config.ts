import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // относительные пути: сайт работает и в корне домена, и в подпапке GitHub Pages (/wishlist/)
  base: './',
  plugins: [react()],
})
