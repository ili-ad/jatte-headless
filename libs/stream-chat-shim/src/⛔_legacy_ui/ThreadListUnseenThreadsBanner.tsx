'use client'
import React from 'react'
import type { ThreadManagerState } from 'stream-chat'

export type ThreadListUnseenThreadsBannerProps = {
  /** State manager for thread list, if available */
  threadManagerState?: ThreadManagerState
  /** Number of unseen threads */
  count?: number
  /** Optional click handler */
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

/** Minimal placeholder implementation of Stream's `ThreadListUnseenThreadsBanner` component. */
export const ThreadListUnseenThreadsBanner = (
  _props: ThreadListUnseenThreadsBannerProps,
) => {
  return (
    <div
      data-testid="thread-list-unseen-threads-banner"
      className="str-chat__thread-list-unseen-banner"
    >
      ThreadListUnseenThreadsBanner placeholder
    </div>
  )
}

export default ThreadListUnseenThreadsBanner
