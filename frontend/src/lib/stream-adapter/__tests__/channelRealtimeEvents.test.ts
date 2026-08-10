import { describe, expect, it, vi } from 'vitest';

import { ChatClient } from '../ChatClient';

describe('Channel realtime event application', () => {
  it('preserves message, typing, read, and AI event semantics exactly once', () => {
    const client = new ChatClient('u1', 'jwt');
    const channel = client.channel('messaging', 'room-1');
    client.activeChannels[channel.cid] = channel;
    const emitted: string[] = [];
    channel.on('message.new' as any, () => emitted.push('message.new'));
    channel.on('typing.start' as any, () => emitted.push('typing.start'));

    const apply = (event: Record<string, unknown>) =>
      (channel as any).applyRealtimeEvent(event);
    apply({
      type: 'message.new',
      message: { id: 'm1', text: 'hello', user_id: 'u2', created_at: '2025-01-01T00:00:00Z' },
    });
    apply({ type: 'typing.start', user_id: 'u2' });
    apply({
      type: 'message.read',
      cid: channel.cid,
      user: { id: 'u2', channel_last_read_at: '2025-01-02T00:00:00Z', channel_unread_count: 1 },
    });
    apply({ type: 'ai_indicator.update', ai_state: 'AI_STATE_THINKING' });

    expect(channel.state.messages.map(message => message.id)).toEqual(['m1']);
    expect(emitted).toEqual(['message.new', 'typing.start']);
    expect(channel.state.typing.u2?.user.id).toBe('u2');
    expect(channel.state.read.u2?.unread_messages).toBe(1);
    expect(client.getAIState(channel.cid)).toBe('AI_STATE_THINKING');

    apply({ type: 'typing.stop', user_id: 'u2' });
    apply({ type: 'ai_indicator.clear' });
    expect(channel.state.typing.u2).toBeUndefined();
    expect(client.getAIState(channel.cid)).toBe('AI_STATE_IDLE');
  });

  it('strict reconnect resync is read-only and rejects required failures', async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ messages: [] }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    global.fetch = fetchMock as any;
    const client = new ChatClient('u1', 'jwt');
    const channel = client.channel('messaging', 'room-1');
    await expect(channel.resyncAuthoritativeState()).rejects.toThrow(
      'authoritative channel resync failed',
    );
    expect(fetchMock.mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(true);
    global.fetch = originalFetch;
  });
});
