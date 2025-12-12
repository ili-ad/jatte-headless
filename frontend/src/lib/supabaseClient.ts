import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let injected: SupabaseClient | null = null

export function setSupabaseClient(client: SupabaseClient) {
  injected = client
}

export function getSupabaseClient(): SupabaseClient {
  if (injected) return injected

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  injected = createClient(url, key)
  return injected
}
