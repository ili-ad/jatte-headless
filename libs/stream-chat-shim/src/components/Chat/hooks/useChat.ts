import { useCallback, useEffect, useRef, useState } from 'react';

import type { TranslationContextValue } from '../../../context/TranslationContext';
import type { SupportedTranslations } from '../../../i18n';
import {
  defaultDateTimeParser,
  defaultTranslatorFunction,
  isLanguageSupported,
  Streami18n,
} from '../../../i18n';

import type {
  AppSettingsAPIResponse,
  Channel,
  Event,
  Mute,
  OwnUserResponse,
  StreamChat,
} from 'chat-shim';

export type UseChatParams = {
  client: StreamChat;
  defaultLanguage?: SupportedTranslations;
  i18nInstance?: Streami18n;
  initialNavOpen?: boolean;
};

export const useChat = ({
  client,
  defaultLanguage = 'en',
  i18nInstance,
  initialNavOpen,
}: UseChatParams) => {
  const [translators, setTranslators] = useState<TranslationContextValue>({
    t: defaultTranslatorFunction,
    tDateTimeParser: defaultDateTimeParser,
    userLanguage: 'en',
  });

  const [channel, setChannel] = useState<Channel>();
  const [mutes, setMutes] = useState<Array<Mute>>([]);
  const [navOpen, setNavOpen] = useState(initialNavOpen);
  const [latestMessageDatesByChannels, setLatestMessageDatesByChannels] = useState({});

  const clientMutes = (client.user as OwnUserResponse)?.mutes ?? [];

  const closeMobileNav = () => setNavOpen(false);
  const openMobileNav = () => setTimeout(() => setNavOpen(true), 100);

  const appSettings = useRef<Promise<AppSettingsAPIResponse> | null>(null);

  const getAppSettings = () => {
    if (appSettings.current) {
      return appSettings.current;
    }
    appSettings.current =
      /* TODO backend-wire-up: getAppSettings */ Promise.resolve(
        {} as any,
      );
    return appSettings.current;
  };

  useEffect(() => {
    if (!client) return;

    const version = process.env.STREAM_CHAT_REACT_VERSION;

    const userAgent = /* TODO backend-wire-up: getUserAgent */ '';
    if (!userAgent.includes('stream-chat-react')) {
      // result looks like: 'stream-chat-react-2.3.2-stream-chat-javascript-client-browser-2.2.2'
      // the upper-case text between double underscores is replaced with the actual semantic version of the library
      /* TODO backend-wire-up: setUserAgent */
    }

    /* TODO backend-wire-up: threads.registerSubscriptions */
    /* TODO backend-wire-up: polls.registerSubscriptions */
    /* TODO backend-wire-up: reminders.registerSubscriptions */
    /* TODO backend-wire-up: reminders.initTimers */

    return () => {
        /* TODO backend-wire-up: threads.unregisterSubscriptions */
        /* TODO backend-wire-up: polls.unregisterSubscriptions */
        /* TODO backend-wire-up: reminders.unregisterSubscriptions */
        /* TODO backend-wire-up: reminders.clearTimers */
    };
  }, [client]);

  useEffect(() => {
    setMutes(clientMutes);

    const handleEvent = (event: Event) => {
      setMutes(event.me?.mutes || []);
    };

    /* TODO backend-wire-up: on */
    return () => /* TODO backend-wire-up: off */;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientMutes?.length]);

  useEffect(() => {
    let userLanguage = client.user?.language;

    if (!userLanguage) {
      const browserLanguage = window.navigator.language.slice(0, 2); // just get language code, not country-specific version
      userLanguage = isLanguageSupported(browserLanguage)
        ? browserLanguage
        : defaultLanguage;
    }

    const streami18n = i18nInstance || new Streami18n({ language: userLanguage });

    streami18n.registerSetLanguageCallback((t) =>
      setTranslators((prevTranslator) => ({ ...prevTranslator, t })),
    );

    streami18n.getTranslators().then((translator) => {
      setTranslators({
        ...translator,
        userLanguage: userLanguage || defaultLanguage,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18nInstance]);

  const setActiveChannel = useCallback(
    async (
      activeChannel?: Channel,
      watchers: { limit?: number; offset?: number } = {},
      event?: React.BaseSyntheticEvent,
    ) => {
      if (event && event.preventDefault) event.preventDefault();

      if (activeChannel && Object.keys(watchers).length) {
        await /* TODO backend-wire-up: query */ Promise.resolve();
      }

      setChannel(activeChannel);
      closeMobileNav();
    },
    [],
  );

  useEffect(() => {
    setLatestMessageDatesByChannels({});
  }, [client.user?.id]);

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
