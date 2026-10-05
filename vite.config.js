import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js is split into its own lazily loaded chunk; it is large by nature.
    chunkSizeWarningLimit: 1200,
  },
})
