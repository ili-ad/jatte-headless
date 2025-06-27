import React from 'react'
import type { LocalMessage } from 'chat-shim'

export type GiphyPreviewMessageProps = {
  message: LocalMessage
}

/** Placeholder implementation of GiphyPreviewMessage component. */
export const GiphyPreviewMessage = ({ message }: GiphyPreviewMessageProps) => {
  return (
    <div className="giphy-preview-message" data-testid="giphy-preview-message">
      {message?.text || 'Giphy preview'}
    </div>
  )
}

export default GiphyPreviewMessage
