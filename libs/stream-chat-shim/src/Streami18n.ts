export type Streami18nOptions = {
  /** Default language code (e.g. 'en') */
  language?: string;
  /** Optional function to log messages */
  logger?: (msg?: string) => void;
  /** Custom date time parser, ignored in shim */
  DateTimeParser?: unknown;
  /** Initial translations for the language */
  translationsForLanguage?: Record<string, string>;
};

/**
 * Very small placeholder for the real Streami18n class used by Stream UI.
 * It stores translations and exposes `t` and `tDateTimeParser` helpers.
 */
export class Streami18n {
  private currentLanguage: string;
  private translations: Record<string, Record<string, string>> = {};
  private setLanguageCallback: (t: (key: string) => string) => void = () => {};
  logger: (msg?: string) => void;

  /** Translator function */
  t = (key: string) =>
    this.translations[this.currentLanguage]?.[key] ?? key;

  /** Basic datetime parser using the built in Date constructor. */
  tDateTimeParser = (value: string | number | Date) => new Date(value);

  constructor(options: Streami18nOptions = {}) {
    this.currentLanguage = options.language ?? 'en';
    this.logger = options.logger ?? (() => {});

    if (options.translationsForLanguage) {
      this.translations[this.currentLanguage] = {
        ...options.translationsForLanguage,
      };
    }
  }

  /** Returns an instance of i18next in the real implementation. */
  geti18Instance() {
    return undefined;
  }

  /** Returns list of available languages. */
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }

  /** Returns all registered translations. */
  getTranslations() {
    return this.translations;
  }

  /** Returns translator helpers, initializing if necessary. */
  async getTranslators() {
    return { t: this.t, tDateTimeParser: this.tDateTimeParser };
  }

  /** Register translations for an additional language. */
  registerTranslation(language: string, translation: Record<string, string>) {
    this.translations[language] = { ...translation };
  }

  /** Update or add locale information – no-op in shim. */
  addOrUpdateLocale(_key: string, _config: unknown) {}

  /** Change the active language. */
  async setLanguage(language: string) {
    this.currentLanguage = language;
    this.setLanguageCallback(this.t);
    return this.t;
  }

  /** Register callback invoked when language changes. */
  registerSetLanguageCallback(callback: (t: (key: string) => string) => void) {
    this.setLanguageCallback = callback;
  }
}

export default Streami18n;
