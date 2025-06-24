import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Chat } from '../src/Chat';

describe('Chat component', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(
      <Chat client={{} as any}>child</Chat>
    );
    expect(html).toContain('child');
  });
});
