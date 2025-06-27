import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderText } from '../src/components/Message/renderText/renderText';

test('renders markdown text', () => {
  const html = renderToStaticMarkup(renderText('**hi**') as React.ReactElement);
  expect(html).toContain('strong');
});
