import React from 'react';
import { renderHook } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';
import { ChatProvider, useChatContext } from '../src/ChatContext';

const createQueryState = () => ({
  error: null,
  queryInProgress: null,
  setError: jest.fn(),
  setQueryInProgress: jest.fn(),
});

describe('ChatContext', () => {
  it('provides context value', () => {
    const value = {
      channel: undefined,
      channelsQueryState: createQueryState(),
      client: {} as StreamChat,
      closeMobileNav: jest.fn(),
      customClasses: undefined,
      getAppSettings: () => null,
      latestMessageDatesByChannels: {},
      mutes: [],
      navOpen: false,
      openMobileNav: jest.fn(),
      setActiveChannel: jest.fn(),
      theme: 'messaging light',
      themeVersion: '1' as const,
      useImageFlagEmojisOnWindows: false,
      isMessageAIGenerated: false,
    };
    const wrapper = ({ children }: any) => (
      <ChatProvider value={value}>{children}</ChatProvider>
    );
    const { result } = renderHook(() => useChatContext(), { wrapper });
    expect(result.current).toBe(value);
  });
});
