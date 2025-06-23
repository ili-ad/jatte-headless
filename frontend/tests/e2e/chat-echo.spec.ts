import { test, expect } from '@playwright/test'

const user = { email: 'demo@example.com', password: 'password' }

async function setupRoutes(page) {
  await page.route('**/auth/v1/token?grant_type=password', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'jwt-test',
        token_type: 'bearer',
        user: { id: '1', email: user.email },
        refresh_token: 'refresh',
        expires_in: 3600
      })
    })
  })
  await page.route('**/api/token/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ userID: '1', userToken: 'jwt-test' })
    })
  })
  await page.route('**/api/**', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })
}

test('demo echo message', async ({ page }) => {
  await setupRoutes(page)
  await page.goto('/demo')
  await page.getByPlaceholder('Type your message').fill('hello')
  await page.keyboard.press('Enter')
  await expect(page.getByText('hello')).toBeVisible()
})
