import type { SupabaseClient } from '@supabase/supabase-js'

import { getDefaultSupabaseFactory } from './factory'
import type { SupabaseClientFactory } from './types'

let configuredFactory: SupabaseClientFactory | null = null
let browserClient: SupabaseClient | null = null

export function setSupabaseFactory(factory: SupabaseClientFactory) {
  configuredFactory = factory
  browserClient = null
}

export function getSupabaseBrowserClient(factory?: SupabaseClientFactory): SupabaseClient {
  if (factory && factory !== configuredFactory) {
    configuredFactory = factory
    browserClient = null
  }

  const activeFactory = configuredFactory ?? factory ?? getDefaultSupabaseFactory()

  if (!browserClient) {
    browserClient = activeFactory.createBrowserClient()
  }

  return browserClient
}

