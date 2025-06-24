import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LocalVoiceRecordingAttachment } from 'stream-chat';

/** Placeholder enum mirroring Stream's `MediaRecordingState`. */
export enum MediaRecordingState {
  PAUSED = 'paused',
  RECORDING = 'recording',
  STOPPED = 'stopped',
}

/** Placeholder type for custom recording configuration. */
export type CustomAudioRecordingConfig = Record<string, unknown>;

/** Minimal stub of Stream's MediaRecorderController. */
class PlaceholderMediaRecorderController {
  permission = {
    state: {
      subscribe: (_: (s?: PermissionState) => void) => ({ unsubscribe: () => {} }),
    },
    watch: () => {},
    unwatch: () => {},
  };
  recording = { subscribe: (_: (r?: LocalVoiceRecordingAttachment) => void) => ({ unsubscribe: () => {} }) };
  recordingState = { subscribe: (_: (s?: MediaRecordingState) => void) => ({ unsubscribe: () => {} }) };

  async stop(): Promise<LocalVoiceRecordingAttachment | undefined> {
    return undefined;
  }
  cancel() {}
  cleanUp() {}
}

export type RecordingController = {
  completeRecording: () => void;
  permissionState?: PermissionState;
  recorder?: PlaceholderMediaRecorderController;
  recording?: LocalVoiceRecordingAttachment;
  recordingState?: MediaRecordingState;
};

export type UseMediaRecorderParams = {
  asyncMessagesMultiSendEnabled: boolean;
  enabled: boolean;
  generateRecordingTitle?: (mimeType: string) => string;
  handleSubmit: () => void;
  recordingConfig?: CustomAudioRecordingConfig;
};

/**
 * Placeholder implementation of Stream's `useMediaRecorder` hook.
 * It exposes the same API shape but performs no real media recording.
 */
export function useMediaRecorder({
  asyncMessagesMultiSendEnabled,
  enabled,
  generateRecordingTitle,
  handleSubmit,
  recordingConfig,
}: UseMediaRecorderParams): RecordingController {
  void asyncMessagesMultiSendEnabled;
  void generateRecordingTitle;
  void handleSubmit;
  void recordingConfig;

  const [recording, setRecording] = useState<LocalVoiceRecordingAttachment>();
  const [recordingState, setRecordingState] = useState<MediaRecordingState>();
  const [permissionState, setPermissionState] = useState<PermissionState>();

  const recorder = useMemo(
    () => (enabled ? new PlaceholderMediaRecorderController() : undefined),
    [enabled],
  );

  const completeRecording = useCallback(() => {
    throw new Error('useMediaRecorder not implemented');
  }, []);

  useEffect(() => {
    if (!recorder) return;

    recorder.permission.watch();
    const recordingSub = recorder.recording.subscribe(setRecording);
    const stateSub = recorder.recordingState.subscribe(setRecordingState);
    const permSub = recorder.permission.state.subscribe(setPermissionState);

    return () => {
      recorder.cancel();
      recorder.permission.unwatch();
      recordingSub.unsubscribe();
      stateSub.unsubscribe();
      permSub.unsubscribe();
    };
  }, [recorder]);

  return {
    completeRecording,
    permissionState,
    recorder,
    recording,
    recordingState,
  };
}

export default useMediaRecorder;
