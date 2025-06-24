import { Streami18n } from '../src/Streami18n';

describe('Streami18n shim', () => {
  it('provides a translator that falls back to keys', async () => {
    const i18n = new Streami18n({
      language: 'en',
      translationsForLanguage: { hello: 'Hello' },
    });
    const { t } = await i18n.getTranslators();
    expect(t('hello')).toBe('Hello');
    expect(t('missing')).toBe('missing');
  });

  it('changes language with setLanguage', async () => {
    const i18n = new Streami18n();
    i18n.registerTranslation('es', { hello: 'Hola' });
    await i18n.setLanguage('es');
    const { t } = await i18n.getTranslators();
    expect(t('hello')).toBe('Hola');
  });
});
