'use client'

import { useEffect, useMemo, useState } from 'react'
import ChatGuard from '../../../../components/ChatGuard'
import ChatInner from '../../ChatInner'

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

export default function RoomPage({ params }: { params: { roomUuid: string } }) {
  const roomUuid = decodeURIComponent(params.roomUuid)
  const label = useMemo(() => roomUuid, [roomUuid])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setCookie(cookieKeyForLabel(label), roomUuid)
    setReady(true)
  }, [label, roomUuid])

  return (
    <ChatGuard whenUnauthed="redirect">
      {ready ? (
        <ChatInner
          roomSlug={label}
          heading="Conversation"
          description={roomUuid}
        />
      ) : (
        <div style={{ padding: 24, color: '#6b7280' }}>Preparing conversation…</div>
      )}
    </ChatGuard>
  )
}
