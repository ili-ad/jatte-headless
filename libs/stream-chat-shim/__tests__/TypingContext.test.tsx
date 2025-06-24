import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TypingProvider, useTypingContext } from '../src/TypingContext';

describe('TypingContext', () => {
  it('provides context value', () => {
    const value = { typing: { user1: true } } as any;
    let received: any;

    const Consumer = () => {
      received = useTypingContext();
      return <span>child</span>;
    };

    const html = renderToStaticMarkup(
      <TypingProvider value={value}>
        <Consumer />
      </TypingProvider>,
    );

    expect(html).toContain('child');
    expect(received).toBe(value);
  });
});
