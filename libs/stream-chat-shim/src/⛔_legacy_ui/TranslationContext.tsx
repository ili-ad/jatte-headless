import React, { createContext, useContext, PropsWithChildren } from 'react';

export type TranslationContextValue = {
  t: (key: string) => string;
  tDateTimeParser: (input: string | number | Date) => Date;
  userLanguage: string;
};

export const TranslationContext = createContext<TranslationContextValue>({
  t: (key) => key,
  tDateTimeParser: (input) => new Date(input),
  userLanguage: 'en',
});

export const TranslationProvider = ({ children, value }: PropsWithChildren<{ value: TranslationContextValue }>) => (
  <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
);

export const useTranslationContext = (_componentName?: string) => useContext(TranslationContext);

export const withTranslationContext = <P extends object>(Component: React.ComponentType<P>) => {
  const WithTranslationContextComponent = (
    props: Omit<P, keyof TranslationContextValue>
  ) => {
    const translationContext = useTranslationContext();
    return <Component {...(props as P)} {...translationContext} />;
  };

  WithTranslationContextComponent.displayName = `WithTranslationContext(${Component.displayName || Component.name || 'Component'})`;

  return WithTranslationContextComponent;
};

export default TranslationContext;
