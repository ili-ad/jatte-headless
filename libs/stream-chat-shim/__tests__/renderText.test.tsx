import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderText } from '../src/renderText';

describe('renderText', () => {
  it('renders markdown text', () => {
    const html = renderToStaticMarkup(renderText('**hi**') as React.ReactElement);
    expect(html).toContain('strong');
  });
});
