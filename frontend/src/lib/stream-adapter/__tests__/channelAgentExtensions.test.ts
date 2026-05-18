import { describe, expect, it, vi } from 'vitest';

vi.mock('@iliad/stream-chat-shim', () => ({
  AIStates: {
    Thinking: 'AI_STATE_THINKING',
    Generating: 'AI_STATE_GENERATING',
    Idle: 'AI_STATE_IDLE',
  },
}));

import { resolveDisplayNameForMessage } from '../channelAgentExtensions';

function makeChannel({
  currentUserId = 'current-user',
  botUserId = 'ai-bot-room-1',
  agentEnabled = true,
}: {
  currentUserId?: string;
  botUserId?: string;
  agentEnabled?: boolean;
} = {}) {
  return {
    agentConfig: agentEnabled
      ? { enabled: true, botUserId, displayName: 'Assistant' }
      : { enabled: false, botUserId, displayName: 'Assistant' },
    getCurrentUserId: vi.fn(() => currentUserId),
  } as any;
}

describe('resolveDisplayNameForMessage', () => {
  it('returns Iris when the author id matches the botUserId', () => {
    const channel = makeChannel({ botUserId: 'ai-bot-room-1' });

    expect(
      resolveDisplayNameForMessage(channel, {
        id: 'm1',
        text: 'Hello',
        user_id: 'ai-bot-room-1',
        created_at: '2026-01-01T00:00:00Z',
        user: { id: 'ai-bot-room-1', name: 'Guest AI-B' },
      } as any),
    ).toBe('Iris');
  });

  it('returns Iris for custom_data.ai_generated messages without a botUserId match', () => {
    const channel = makeChannel({ botUserId: 'ai-bot-room-1' });

    expect(
      resolveDisplayNameForMessage(channel, {
        id: 'm2',
        text: 'Generated answer',
        user_id: 'assistant-shadow-id',
        created_at: '2026-01-01T00:00:00Z',
        custom_data: { ai_generated: true },
      } as any),
    ).toBe('Iris');
  });

  it('returns You for the current user', () => {
    const channel = makeChannel({ currentUserId: 'human-1' });

    expect(
      resolveDisplayNameForMessage(channel, {
        id: 'm3',
        text: 'My message',
        user_id: 'human-1',
        created_at: '2026-01-01T00:00:00Z',
      } as any),
    ).toBe('You');
  });

  it('keeps the guest fallback for true non-bot guests', () => {
    const channel = makeChannel({ currentUserId: 'human-1', botUserId: 'ai-bot-room-1' });

    expect(
      resolveDisplayNameForMessage(channel, {
        id: 'm4',
        text: 'Guest message',
        user_id: 'guest-b531',
        created_at: '2026-01-01T00:00:00Z',
      } as any),
    ).toBe('Guest GUES');
  });
});
