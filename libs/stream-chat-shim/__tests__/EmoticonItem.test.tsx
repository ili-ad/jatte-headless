import React from 'react';
import { render } from '@testing-library/react';
import { EmoticonItem } from '../src/components/TextareaComposer/SuggestionList/EmoticonItem';

test('renders emoticon', () => {
  const entity = {
    name: 'smile',
    native: '😄',
    tokenizedDisplayName: { token: 'smile', parts: ['sm', 'ile'] },
  } as any;
  const { container } = render(<EmoticonItem entity={entity} />);
  expect(container.textContent).toContain('😄');
});
