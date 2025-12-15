import type { ReactNode } from 'react'

import { SessionProvider } from '@/lib/SessionProvider'

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
