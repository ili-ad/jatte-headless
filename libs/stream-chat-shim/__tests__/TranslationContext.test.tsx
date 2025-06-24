import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TranslationProvider,
  useTranslationContext,
} from '../src/TranslationContext';

test('provides translation context', () => {
  const value = {
    t: (key: string) => `translated-${key}`,
    tDateTimeParser: (input: string | number | Date) => new Date(input),
    userLanguage: 'en',
  };

  let context: typeof value | undefined;
  const Consumer = () => {
    context = useTranslationContext();
    return null;
  };

  renderToStaticMarkup(
    <TranslationProvider value={value}>
      <Consumer />
    </TranslationProvider>
  );

  expect(context).toEqual(value);
});
