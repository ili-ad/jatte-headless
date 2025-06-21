import { test, expect } from '@playwright/test'

test('demo shows hello world', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByText('hello world')).toBeVisible()
})
