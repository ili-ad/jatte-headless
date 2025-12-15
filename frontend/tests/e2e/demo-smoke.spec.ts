import { test, expect } from '@playwright/test'

test('chat page requires authentication', async ({ page }) => {
  await page.goto('/chat')
  await page.waitForURL('**/login')
  await expect(page).toHaveURL(/\/login/)
})
