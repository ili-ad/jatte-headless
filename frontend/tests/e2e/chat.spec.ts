import { test, expect } from '@playwright/test'
import { ensureAuthenticated } from './utils/auth'

const MESSAGE_TEXT = 'hello world'

const credentials = {
  email: process.env.E2E_USER_EMAIL ?? 'demo@example.com',
  password: process.env.E2E_USER_PASSWORD ?? 'password',
}

test('message persists after refresh', async ({ page }, testInfo) => {
  const consoleLogs: string[] = []
  page.on('console', message => {
    consoleLogs.push(`[${message.type()}] ${message.text()}`)
  })

  try {
    await page.goto('/demo')
    const input = await ensureAuthenticated(page, credentials)

    await expect(input).toBeVisible({ timeout: 5000 })

    const helloMessages = page
      .locator('[data-testid="message-text-inner-wrapper"]')
      .filter({ hasText: MESSAGE_TEXT })

    const baselineCount = await helloMessages.count()

    await input.fill(MESSAGE_TEXT)
    await input.press('Enter')

    let countAfterSend = baselineCount
    await expect.poll(async () => {
      countAfterSend = await helloMessages.count()
      return countAfterSend
    }, { timeout: 5000 }).toBeGreaterThan(baselineCount)

    await page.reload()

    await expect(input).toBeVisible({ timeout: 5000 })
    await expect.poll(async () => helloMessages.count(), { timeout: 5000 }).toBeGreaterThanOrEqual(countAfterSend)
  } finally {
    if (testInfo.status !== testInfo.expectedStatus) {
      const body = consoleLogs.join('\n') || '(no console logs)'
      await testInfo.attach('console-logs', {
        body,
        contentType: 'text/plain',
      })
    }
  }
})
