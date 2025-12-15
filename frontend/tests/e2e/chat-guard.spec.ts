import { test, expect } from '@playwright/test'

test('chat page redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/chat')
  await page.waitForURL('**/login')
})

test('chat room page redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/chat/rooms/sample-room')
  await page.waitForURL('**/login')
})
