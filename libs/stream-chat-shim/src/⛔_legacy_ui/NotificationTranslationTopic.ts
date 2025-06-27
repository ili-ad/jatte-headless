import type { Notification } from 'chat-shim';

export type NotificationTranslatorOptions = {
  notification?: Notification;
};

export type Translator<O extends Record<string, unknown> = Record<string, unknown>> = (
  params: {
    key: string;
    value: string;
    t: (key: string) => string;
    options: O;
  }
) => string | null;

export type TranslationTopicOptions<O extends Record<string, unknown> = Record<string, unknown>> = {
  i18next: { t: (key: string) => string };
  translators?: Record<string, Translator<O>>;
};

export const defaultNotificationTranslators: Record<string, Translator<NotificationTranslatorOptions>> = {};

/**
 * Placeholder implementation of Stream\'s NotificationTranslationTopic class.
 */
export class NotificationTranslationTopic {
  private translators: Map<string, Translator<NotificationTranslatorOptions>> = new Map();
  private i18next: { t: (key: string) => string };

  constructor({ i18next, translators }: TranslationTopicOptions<NotificationTranslatorOptions>) {
    this.i18next = i18next;
    Object.entries(defaultNotificationTranslators).forEach(([name, tr]) => {
      this.translators.set(name, tr);
    });
    if (translators) {
      Object.entries(translators).forEach(([name, translator]) => {
        this.translators.set(name, translator);
      });
    }
  }

  translate(value: string, _key: string, _options: NotificationTranslatorOptions): string {
    // Placeholder: simply return the provided string
    return value;
  }

  setTranslator(name: string, translator: Translator<NotificationTranslatorOptions>) {
    this.translators.set(name, translator);
  }

  removeTranslator(name: string) {
    this.translators.delete(name);
  }
}

export default NotificationTranslationTopic;
