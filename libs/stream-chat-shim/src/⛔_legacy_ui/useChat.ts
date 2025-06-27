import { useCallback, useState } from 'react';
import type {
  AppSettingsAPIResponse,
  Channel,
  Mute,
  StreamChat,
} from 'chat-shim';

export type SupportedTranslations = string;

export type TranslationContextValue = {
  t: (key: string) => string;
  tDateTimeParser: (value: string | number | Date) => Date;
  userLanguage?: string;
};

export type UseChatParams = {
  client: StreamChat;
  defaultLanguage?: SupportedTranslations;
  i18nInstance?: unknown;
  initialNavOpen?: boolean;
};

/**
 * Minimal placeholder for Stream's `useChat` hook.
 * Manages basic channel state and mobile navigation visibility.
 */
export const useChat = ({
  client,
  initialNavOpen,
}: UseChatParams) => {
  const [channel, setChannel] = useState<Channel | undefined>();
  const [navOpen, setNavOpen] = useState(initialNavOpen);
  const [mutes] = useState<Array<Mute>>([]);
  const [latestMessageDatesByChannels] = useState<Record<string, unknown>>({});
  const [translators] = useState<TranslationContextValue>({
    t: (key) => key,
    tDateTimeParser: (value) => new Date(value),
    userLanguage: 'en',
  });

  const closeMobileNav = () => setNavOpen(false);
  const openMobileNav = () => setNavOpen(true);

  const setActiveChannel = useCallback(
    async (activeChannel?: Channel) => {
      setChannel(activeChannel);
      closeMobileNav();
    },
    []
  );

  const getAppSettings = () =>
    client.getAppSettings?.() as Promise<AppSettingsAPIResponse>;

  return {
    channel,
    closeMobileNav,
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    translators,
  };
};

export default useChat;
