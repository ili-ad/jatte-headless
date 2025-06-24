import { renderHook } from '@testing-library/react';
import { useMediaRecorder } from '../src/useMediaRecorder';

describe('useMediaRecorder', () => {
  it('returns placeholder controller', () => {
    const { result } = renderHook(() =>
      useMediaRecorder({
        asyncMessagesMultiSendEnabled: false,
        enabled: true,
        handleSubmit: jest.fn(),
      })
    );
    expect(typeof result.current.completeRecording).toBe('function');
    expect(result.current.recording).toBeUndefined();
    expect(result.current.recordingState).toBeUndefined();
  });
});
