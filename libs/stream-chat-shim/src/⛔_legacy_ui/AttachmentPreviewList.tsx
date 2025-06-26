// libs/stream-chat-shim/src/AttachmentPreviewList.tsx
'use client'

import type { ComponentType } from 'react'
import React from 'react'

export type AttachmentPreviewListProps = {
  AudioAttachmentPreview?: ComponentType<any>
  FileAttachmentPreview?: ComponentType<any>
  ImageAttachmentPreview?: ComponentType<any>
  UnsupportedAttachmentPreview?: ComponentType<any>
  VideoAttachmentPreview?: ComponentType<any>
  VoiceRecordingPreview?: ComponentType<any>
}

/** Placeholder implementation of AttachmentPreviewList */
export const AttachmentPreviewList = (_props: AttachmentPreviewListProps) => {
  return (
    <div data-testid="attachment-preview-list">AttachmentPreviewList placeholder</div>
  )
}

export default AttachmentPreviewList
