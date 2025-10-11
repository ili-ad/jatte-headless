import { test, expect, type Locator, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

import { ensureAuthenticated } from './utils/auth'
import { provisionUser } from './utils/api'

const ATTACHMENT_NAME = 'preview.txt'
const ATTACHMENT_PATH = path.join(
  process.cwd(),
  'tests/e2e/fixtures',
  ATTACHMENT_NAME,
)

async function sendMessage(page: Page, input: Locator, text: string) {
  await input.fill(text)
  await input.press('Enter')
  const message = page
    .locator('[data-testid="message-text-inner-wrapper"]')
    .filter({ hasText: text })
  await expect(message).toBeVisible({ timeout: 5000 })
  return message
}

test.describe('link preview and attachment round-trip', () => {
  test('link preview round-trip', async ({ page, request }) => {
    const user = await provisionUser(request)

    await page.goto('/demo')
    const composer = await ensureAuthenticated(page, {
      email: user.email,
      password: user.password,
    })

    await sendMessage(page, composer, `Preview anchor ${Date.now()}`)

    const previewUrl = 'https://example.com'
    const previewResult = await page.evaluate(
      async ({ url, token }) => {
        const response = await fetch('/link-preview/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url }),
        })
        const payload = await response.json().catch(() => ({}))
        return { status: response.status, ok: response.ok, payload }
      },
      { url: previewUrl, token: user.accessToken },
    )

    expect(previewResult.ok).toBeTruthy()
    expect(previewResult.status).toBe(200)
    expect(previewResult.payload.url).toBe(previewUrl)
    expect(typeof previewResult.payload.title).toBe('string')

    const previewCard = page
      .getByTestId('link-preview')
      .filter({ hasText: /example\.com/i })
    await expect(previewCard).toBeVisible({ timeout: 3000 })
  })

  test('attachment round-trip', async ({ page, request }) => {
    const user = await provisionUser(request)

    await page.goto('/demo')
    const composer = await ensureAuthenticated(page, {
      email: user.email,
      password: user.password,
    })

    await sendMessage(page, composer, `Attachment anchor ${Date.now()}`)

    const bytes = Array.from(await fs.readFile(ATTACHMENT_PATH))
    const attachmentResult = await page.evaluate(
      async ({ token, name, fileBytes }) => {
        const blob = new Blob([new Uint8Array(fileBytes)], {
          type: 'text/plain',
        })
        const formData = new FormData()
        formData.append('file', blob, name)
        const response = await fetch('/attachments/', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        const payload = await response.json().catch(() => ({}))
        return { status: response.status, ok: response.ok, payload }
      },
      { token: user.accessToken, name: ATTACHMENT_NAME, fileBytes: bytes },
    )

    expect(attachmentResult.ok).toBeTruthy()
    expect(attachmentResult.status).toBe(201)
    expect(attachmentResult.payload.attachment?.name).toBe(ATTACHMENT_NAME)

    const attachmentChip = page
      .getByTestId('attachment-name')
      .filter({ hasText: ATTACHMENT_NAME })
    await expect(attachmentChip).toBeVisible({ timeout: 5000 })
  })
})
