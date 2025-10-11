import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from '@playwright/test'

const envFile = path.resolve(__dirname, '.env.local')
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf-8')
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue
    const index = line.indexOf('=')
    if (index === -1) continue
    const key = line.slice(0, index).trim()
    if (!key || key in process.env) continue
    const value = line.slice(index + 1).trim()
    process.env[key] = value
  }
}

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  retries: 1,
  reporter: 'list',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
  },
})
