import React from 'react';
import type { LocalVoiceRecordingAttachment } from 'stream-chat';

export type UploadAttachmentPreviewProps<A> = {
  attachment: A;
  handleRetry: (attachment: A) => void | Promise<A | undefined>;
  removeAttachments: (ids: string[]) => void;
};

export type VoiceRecordingPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalVoiceRecordingAttachment<CustomLocalMetadata>>;

/** Placeholder implementation of VoiceRecordingPreview. */
export const VoiceRecordingPreview = (_props: VoiceRecordingPreviewProps) => (
  <div data-testid="voice-recording-preview-placeholder" />
);

export default VoiceRecordingPreview;
