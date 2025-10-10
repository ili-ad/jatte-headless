import { expect, type Locator, type Page } from '@playwright/test'

interface Credentials {
  email: string
  password: string
}

async function waitForChatInput(page: Page): Promise<Locator | null> {
  const input = page.getByPlaceholder('Type your message')
  if (!(await input.count())) return null
  try {
    await expect(input).toBeVisible({ timeout: 5000 })
    return input
  } catch (error) {
    return null
  }
}

export async function ensureAuthenticated(page: Page, credentials: Credentials): Promise<Locator> {
  const existingInput = await waitForChatInput(page)
  if (existingInput) return existingInput

  if (!page.url().includes('/login')) {
    const inlineSignIn = page.getByRole('button', { name: /sign in/i })
    if (await inlineSignIn.count()) {
      await Promise.all([
        page.waitForURL('**/login*', { timeout: 5000 }),
        inlineSignIn.click(),
      ])
    } else {
      await page.goto('/login')
    }
  }

  const emailField = page.getByPlaceholder('Email')
  const passwordField = page.getByPlaceholder('Password')
  await expect(emailField).toBeVisible({ timeout: 5000 })
  await emailField.fill(credentials.email)
  await passwordField.fill(credentials.password)

  await Promise.all([
    page.waitForURL('**/demo', { timeout: 10000 }),
    page.getByRole('button', { name: /login/i }).click(),
  ])

  const chatInput = page.getByPlaceholder('Type your message')
  await expect(chatInput).toBeVisible({ timeout: 10000 })
  return chatInput
}
