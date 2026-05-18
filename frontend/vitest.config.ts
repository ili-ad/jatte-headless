import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@iliad/stream-chat-shim': path.resolve(__dirname, '../libs/stream-chat-shim/src'),
      '@iliad/stream-chat-shim/': `${path.resolve(__dirname, '../libs/stream-chat-shim/src')}/`,
      'chat-shim': path.resolve(__dirname, '../libs/chat-shim'),
    },
  },
  test: {
    setupFiles: './vitest.setup.ts',
    environment: 'jsdom',
    include: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
