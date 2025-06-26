import React from 'react'
import type { LocalMessage } from 'stream-chat'

export type MessageTextProps = {
  customInnerClass?: string
  customWrapperClass?: string
  message?: LocalMessage
  theme?: string
  renderText?: (text?: string, mentioned_users?: any[]) => React.ReactNode
}

/** Placeholder implementation of the MessageText component. */
export const MessageText = (_props: MessageTextProps) => {
  return (
    <div data-testid="message-text-placeholder">MessageText placeholder</div>
  )
}

export default MessageText
