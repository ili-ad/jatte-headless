import { test, expect } from '@playwright/test'

const user = { email: 'sample@example.com', password: 'password' }

// Mock Supabase sign-in and backend token endpoint
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
}

test('login → chat view', async ({ page }) => {
  await setupRoutes(page)
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(user.email)
  await page.getByPlaceholder('Password').fill(user.password)
  await page.getByRole('button', { name: /login/i }).click()
  await page.waitForURL('**/chat')
  await expect(page.getByPlaceholder('Type your message')).toBeVisible()
})
