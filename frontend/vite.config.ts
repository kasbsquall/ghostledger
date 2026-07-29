import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://kasbsquall.github.io/ghostledger/, so assets resolve
  // against the repository path rather than the domain root.
  base: '/ghostledger/',
  plugins: [react()],
})
