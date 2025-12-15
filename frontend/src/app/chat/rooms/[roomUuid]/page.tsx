'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { ChatProvider } from '@/lib/ChatProvider'
import ChatWindow from '@/lib/ChatWindow'
import { useSession } from '@/lib/SessionProvider'

const ROOM_UUID_COOKIE_PREFIX = 'jatte.room_uuid.'
const ROOM_UUID_COOKIE_MAX_AGE_DAYS = 60

function cookieKeyForLabel(label: string) {
  const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `${ROOM_UUID_COOKIE_PREFIX}${slug}`
}

function setCookie(name: string, value: string, maxAgeDays = ROOM_UUID_COOKIE_MAX_AGE_DAYS) {
  const expires = new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000)
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; expires=${expires.toUTCString()}; samesite=lax`
}

export default function ChatRoomPage({ params }: { params: { roomUuid: string } }) {
  const roomUuid = decodeURIComponent(params.roomUuid)
  const roomSlug = useMemo(() => roomUuid, [roomUuid])

  const { session, loading } = useSession()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setCookie(cookieKeyForLabel(roomSlug), roomUuid)
    setReady(true)
  }, [roomSlug, roomUuid])

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-6 text-sm text-gray-600">
        Loading session…
      </main>
    )
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-lg font-semibold">Conversation</h1>
        <p className="mt-2 text-sm text-gray-600">You must be signed in to view this room.</p>
        <div className="mt-4">
          <Link href="/chat/admin" className="text-sm text-blue-600 hover:underline">
            Back to admin
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Conversation</h1>
          <p className="text-xs text-gray-500">{roomUuid}</p>
        </div>
        <Link href="/chat/admin" className="text-sm text-blue-600 hover:underline">
          Back to admin
        </Link>
      </div>

      {!ready ? (
        <div className="text-sm text-gray-500">Preparing room…</div>
      ) : (
        <ChatProvider roomSlug={roomSlug}>
          <ChatWindow />
        </ChatProvider>
      )}
    </main>
  )
}
