import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Channel } from '../src/Channel';

describe('Channel component', () => {
  test('renders children', () => {
    const html = renderToStaticMarkup(<Channel>child</Channel>);
    expect(html).toContain('child');
  });
});
