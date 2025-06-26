import React from 'react';

export type VoiceRecordingProps = {
  /** The attachment object from the message's attachment list. */
  attachment: any;
  /** If true, render a compact variant for quoted replies. */
  isQuoted?: boolean;
};

/** Placeholder VoiceRecording component. */
export const VoiceRecording = ({ isQuoted }: VoiceRecordingProps) => (
  <div data-testid="voice-recording-placeholder">
    {isQuoted ? 'Quoted Voice Recording' : 'Voice Recording'}
  </div>
);

export default VoiceRecording;
