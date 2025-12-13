'use client'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseBrowserClient, setSupabaseFactory } from './client'
import type { SupabaseClientFactory } from './types'

type HubStatus = 'loading' | 'ready'

interface SupabaseHubValue {
  client: SupabaseClient | null
  session: Session | null
  setSession: (session: Session | null) => void
  status: HubStatus
}

const SupabaseHubContext = createContext<SupabaseHubValue | null>(null)

export function useSupabaseHub() {
  const ctx = useContext(SupabaseHubContext)
  if (!ctx) throw new Error('SupabaseHubProvider is required')
  return ctx
}

export function SupabaseHubProvider({
  children,
  factory,
}: {
  children: ReactNode
  factory?: SupabaseClientFactory
}) {
  if (factory) setSupabaseFactory(factory)

  const client = getSupabaseBrowserClient(factory)
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<HubStatus>('loading')

  useEffect(() => {
    let active = true
    client.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setStatus('ready')
    })

    const { data: listener } = client.auth.onAuthStateChange((_, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setStatus('ready')
    })

    return () => {
      active = false
      listener?.subscription.unsubscribe()
    }
  }, [client])

  const value = useMemo(
    () => ({ client, session, setSession, status }),
    [client, session, status],
  )

  return <SupabaseHubContext.Provider value={value}>{children}</SupabaseHubContext.Provider>
}

export function useSupabaseClient() {
  return useSupabaseHub().client
}

export function useSupabaseSession() {
  const { session, status } = useSupabaseHub()
  return { session, status }
}

