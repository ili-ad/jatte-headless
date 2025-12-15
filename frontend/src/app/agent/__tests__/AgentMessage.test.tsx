import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { AgentMessage } from '../AgentMessage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@iliad/stream-chat-shim', () => ({
  MessageSimple: (props: Record<string, unknown>) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div data-testid="message-simple" {...props} />
  ),
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

    expect(screen.getByRole('button', { name: 'View dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to planner' })).toBeInTheDocument();
  });
});
