import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: https://arpi-ai-automation.github.io/working-cars-race/
export default defineConfig({
  base: '/working-cars-race/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
