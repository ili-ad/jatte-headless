import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: './vitest.setup.ts',
    environment: 'jsdom',
    include: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
