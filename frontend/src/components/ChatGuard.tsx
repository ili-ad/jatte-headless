'use client'
import { ReactNode, useEffect } from 'react'
import { useSession } from '@/lib/SessionProvider'
import Button from '@/components/ui/button'

export default function ChatGuard({ children, whenUnauthed = 'inline' }: { children: ReactNode; whenUnauthed?: 'inline' | 'redirect' }) {
  const { session } = useSession()
  const loginUrl = '/login'

  if (session) return <>{children}</>

  if (whenUnauthed === 'redirect') {
    if (typeof window !== 'undefined') {
      const next = encodeURIComponent(window.location.pathname)
      window.location.href = `${loginUrl}?next=${next}`
    }
    return null
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <p className="text-lg font-medium">Sign in to start chatting</p>
      <Button onClick={() => (window.location.href = loginUrl)}>Sign in</Button>
    </div>
  )
}
