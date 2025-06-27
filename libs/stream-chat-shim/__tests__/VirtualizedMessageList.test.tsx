import React from 'react';
import { render } from '@testing-library/react';
import { VirtualizedMessageList } from '../src/components/MessageList/VirtualizedMessageList';
import { ChannelActionProvider } from '../src/⛔_legacy_ui/ChannelActionContext';
import { ChannelStateProvider } from '../src/⛔_legacy_ui/ChannelStateContext';
import { ChatProvider } from '../src/⛔_legacy_ui/ChatContext';
import { ComponentProvider } from '../src/⛔_legacy_ui/ComponentContext';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatProvider
    value={{
      client: {} as any,
      channelsQueryState: { error: null, queryInProgress: null, setError: () => {}, setQueryInProgress: () => {} },
      closeMobileNav: () => {},
      getAppSettings: () => null,
      latestMessageDatesByChannels: {},
      mutes: [],
      openMobileNav: () => {},
      setActiveChannel: () => {},
      theme: 'light',
      themeVersion: '1',
      useImageFlagEmojisOnWindows: false,
      isMessageAIGenerated: false,
    }}
  >
    <ChannelActionProvider value={{}}>
      <ChannelStateProvider value={{ channel: {} as any, channelCapabilities: {}, channelConfig: {}, imageAttachmentSizeHandler: () => {}, notifications: [], shouldGenerateVideoThumbnail: false, videoAttachmentSizeHandler: () => {}, suppressAutoscroll: false }}>
        <ComponentProvider value={{}}>{children}</ComponentProvider>
      </ChannelStateProvider>
    </ChannelActionProvider>
  </ChatProvider>
);

 test('renders without crashing', () => {
  render(<VirtualizedMessageList />, { wrapper: Wrapper });
});
