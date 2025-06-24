import { renderHook, act } from '@testing-library/react';
import { EventEmitter } from 'events';
import { useIsChannelMuted } from '../src/useIsChannelMuted';

class FakeChannel extends EventEmitter {
  public muted = false;
  client = this;
  muteStatus() {
    return this.muted;
  }
}

describe('useIsChannelMuted', () => {
  test('tracks muted state on events', () => {
    const channel = new FakeChannel() as any;
    const { result } = renderHook(() => useIsChannelMuted(channel));
    expect(result.current).toBe(false);
    act(() => {
      channel.muted = true;
      channel.emit('notification.channel_mutes_updated');
    });
    expect(result.current).toBe(true);
  });
});
