import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: './vitest.setup.ts',
    include: ['**/__tests__/**/*.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
