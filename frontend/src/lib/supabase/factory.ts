import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { SupabaseClientFactory } from './types'

class EnvSupabaseFactory implements SupabaseClientFactory {
  createBrowserClient(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase env vars (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) are required')
    }

    return createClient(url, key)
  }
}

const defaultFactory = new EnvSupabaseFactory()

export function getDefaultSupabaseFactory(): SupabaseClientFactory {
  return defaultFactory
}

