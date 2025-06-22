import { test, expect } from '@playwright/test'

test('chat page redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/chat')
  await page.waitForURL('**/login')
})

test('demo page shows inline sign-in prompt when unauthenticated', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByText('Sign in to start chatting')).toBeVisible()
})
