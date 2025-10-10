import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
})
