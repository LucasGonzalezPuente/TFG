import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  root: 'frontend',
  plugins: [react()],

  // ── Vitest ────────────────────────────────────────────────────────────────
  test: {
    // Simulate a browser DOM environment (needed for React components)
    environment: 'jsdom',
    // Allow using describe/it/expect globally without importing them
    globals: true,
    // Run jest-dom matchers setup before each test file
    setupFiles: ['./frontend/src/test/setup.js'],
  },
})
