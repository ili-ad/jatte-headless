export enum MediaRecordingState {
  PAUSED = 'paused',
  RECORDING = 'recording',
  STOPPED = 'stopped',
}

export enum RecordingAttachmentType {
  VOICE_RECORDING = 'voiceRecording',
}

export type AudioRecorderOptions = {
  config?: unknown;
  generateRecordingTitle?: (mimeType: string) => string;
  t?: unknown;
};

class SimpleSubscription {
  closed = false;
  constructor(private onUnsub?: () => void) {}
  unsubscribe() {
    this.closed = true;
    this.onUnsub?.();
  }
}

class SimpleSubject<T> {
  constructor(public value?: T) {}
  next(value: T) { this.value = value; }
  subscribe(_listener: (v: T) => void) { return new SimpleSubscription(); }
}

class BehaviorSubject<T> extends SimpleSubject<T> {}
class Subject<T> extends SimpleSubject<T> {}

class BrowserPermission {
  state = new BehaviorSubject<PermissionState | undefined>(undefined);
  watch() {}
  unwatch() {}
  check() {}
}

/**
 * Placeholder implementation of the MediaRecorderController class used by Stream UI.
 * This shim exposes the public interface without providing recording behaviour.
 */
export class MediaRecorderController {
  permission: BrowserPermission;
  recordingState = new BehaviorSubject<MediaRecordingState | undefined>(undefined);
  recording = new BehaviorSubject<any | undefined>(undefined);
  error = new Subject<Error | undefined>();
  notification = new Subject<{ text: string; type: 'success' | 'error' } | undefined>();

  constructor(_opts: AudioRecorderOptions = {}) {
    this.permission = new BrowserPermission();
  }

  get durationMs() {
    return 0;
  }

  start() {
    throw new Error('MediaRecorderController.start not implemented');
  }

  pause() {}

  resume() {}

  stop(): Promise<any | undefined> {
    return Promise.resolve(undefined);
  }

  cancel() {}

  cleanUp() {}
}

export default MediaRecorderController;
