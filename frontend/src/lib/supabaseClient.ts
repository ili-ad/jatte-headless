import type { SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseBrowserClient, setSupabaseFactory } from './supabase'
import type { SupabaseClientFactory } from './supabase'

export function setSupabaseClientFactory(factory: SupabaseClientFactory) {
  setSupabaseFactory(factory)
}

export function getSupabaseClient(): SupabaseClient {
  return getSupabaseBrowserClient()
}
