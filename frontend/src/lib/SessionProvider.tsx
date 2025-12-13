'use client'
import type { ReactNode } from 'react'

import { SupabaseHubProvider, useSupabaseHub } from './supabase'

export function useSession() {
  const { session, setSession, status } = useSupabaseHub()
  return { session, setSession, loading: status === 'loading' }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  return <SupabaseHubProvider>{children}</SupabaseHubProvider>
}
