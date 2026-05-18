import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgentMessage } from '../AgentMessage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => cleanup());

vi.mock('@iliad/stream-chat-shim', () => ({
  MessageSimple: (props: Record<string, unknown>) => {
    const message = props.message as any;
    return (
      <div
        data-testid="message-simple"
        data-user-id={message?.user?.id ?? ''}
        data-user-id-field={message?.user_id ?? ''}
        data-user-name={message?.user?.name ?? ''}
      />
    );
  },
}));

describe('AgentMessage', () => {
  it('renders sidecar action buttons when present', () => {
    const message = {
      id: 'message-1',
      text: 'Here are some options for you.',
      user: { id: 'agent-1' },
      custom_data: {
        ai_generated: true,
        sidecar_actions: [
          { label: 'View dashboard', url: 'https://example.com' },
          { label: 'Go to planner', url: '/planner', reason: 'Continue workflow' },
        ],
      },
    };

    render(<AgentMessage message={message as any} botUserId="agent-1" />);

    expect(screen.getByRole('button', { name: 'View dashboard' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go to planner' })).toBeTruthy();
  });

  it('passes Iris to MessageSimple for agent messages while preserving user ids', () => {
    const message = {
      id: 'message-2',
      text: 'I can help with that.',
      user_id: 'ai-bot-room-1',
      user: { id: 'ai-bot-room-1', name: 'Guest AI-B' },
      custom_data: { ai_generated: true },
    };

    render(<AgentMessage message={message as any} botUserId="ai-bot-room-1" />);

    const simple = screen.getByTestId('message-simple');
    expect(simple.getAttribute('data-user-name')).toBe('Iris');
    expect(simple.getAttribute('data-user-id')).toBe('ai-bot-room-1');
    expect(simple.getAttribute('data-user-id-field')).toBe('ai-bot-room-1');
  });

});
