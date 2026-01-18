import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';

import AgentChatWindow from '../AgentChatWindow';
import ChatWindow from '../ChatWindow';

const { BaseAvatar, DummyAvatar, getLastComponentProviderValue, setLastComponentProviderValue } =
  vi.hoisted(() => {
    let lastValue: unknown;

    const BaseAvatar = () => <div data-testid="base-avatar" />;
    const DummyAvatar = () => <div data-testid="dummy-avatar" />;

    return {
      BaseAvatar,
      DummyAvatar,
      getLastComponentProviderValue: () => lastValue,
      setLastComponentProviderValue: (value: unknown) => {
        lastValue = value;
      },
    };
  });

vi.mock('@iliad/stream-chat-shim', () => ({
  Chat: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Channel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Window: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MessageList: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  TypingIndicator: () => <div />,
  MessageInput: () => <div />,
  AIStateIndicator: () => <div />,
  StopAIGenerationButton: () => <button type="button">Stop</button>,
  AIStates: { Idle: 'idle', Thinking: 'thinking', Generating: 'generating' },
  useAIState: () => ({ aiState: 'idle' }),
  ComponentProvider: ({
    value,
    children,
  }: {
    value: unknown;
    children: React.ReactNode;
  }) => {
    setLastComponentProviderValue(value);
    return <div>{children}</div>;
  },
  useComponentContext: () => ({ Avatar: BaseAvatar }),
}));

vi.mock('../ChatProvider', () => ({
  useChat: () => ({
    client: { user: { id: 'user-1' } },
    channel: { cid: 'channel-1' },
    bootstrapStatus: { kind: 'ready' },
    retryBootstrap: vi.fn(),
  }),
}));

describe('ChatWindow avatar overrides', () => {
  beforeEach(() => {
    setLastComponentProviderValue(undefined);
  });

  it('wires Avatar overrides into AgentChatWindow ComponentProvider', () => {
    render(<AgentChatWindow Avatar={DummyAvatar} />);

    expect(getLastComponentProviderValue()).toMatchObject({ Avatar: DummyAvatar });
  });

  it('wires Avatar overrides into ChatWindow ComponentProvider', () => {
    render(<ChatWindow Avatar={DummyAvatar} />);

    expect(getLastComponentProviderValue()).toMatchObject({ Avatar: DummyAvatar });
  });
});
