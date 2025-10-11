import { expect, type APIRequestContext, type APIResponse } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.E2E_SUPABASE_URL
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.E2E_SUPABASE_ANON_KEY
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_BASE = API_BASE_URL.replace(/\/$/, '')

export type ProvisionedUser = {
  email: string
  password: string
  accessToken: string
  username: string
}

async function parseJSON<T>(response: APIResponse) {
  const body = await response.json().catch(() => ({}))
  return { response, body: body as T }
}

export async function provisionUser(
  request: APIRequestContext,
): Promise<ProvisionedUser> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase environment variables are required for E2E provisioning',
    )
  }

  const email = `e2e-${Date.now()}-${randomUUID()}@example.com`
  const password = `Test-${randomUUID().slice(0, 8)}!`

  const signupResponse = await request.post(`${SUPABASE_URL}/auth/v1/signup`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    data: { email, password },
  })

  const signup = await parseJSON<{ user?: { id: string } }>(signupResponse)

  expect(signup.response.status()).toBeLessThan(400)

  const loginResponse = await request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: { email, password },
    },
  )

  const login = await parseJSON<{ access_token?: string }>(loginResponse)

  expect(login.response.ok()).toBeTruthy()
  const accessToken = login.body.access_token
  expect(accessToken, 'Supabase login did not return an access token').toBeTruthy()

  const syncResponse = await request.post(
    `${API_BASE}/sync-user/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: { display_name: email.split('@')[0] },
    },
  )

  const syncUser = await parseJSON<{ id: number; username: string }>(syncResponse)

  expect(syncUser.response.status()).toBe(200)
  expect(syncUser.body.username).toBeTruthy()

  const wsAuth = await request.get(
    `${API_BASE}/ws-auth/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
      },
    },
  )
  expect(wsAuth.ok()).toBeTruthy()

  return {
    email,
    password,
    accessToken: accessToken!,
    username: syncUser.body.username,
  }
}
