import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatView } from '../src/ChatView';

describe('ChatView component', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<ChatView>child</ChatView>);
    expect(html).toContain('child');
  });
});
