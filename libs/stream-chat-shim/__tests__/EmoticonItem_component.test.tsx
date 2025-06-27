import React from 'react';
import { render } from '@testing-library/react';
import { EmoticonItem } from '../src/components/TextareaComposer/SuggestionList/EmoticonItem';

test('renders without crashing', () => {
  const entity = { name: ':smile:', native: '😄', tokenizedDisplayName: { token: 'smile', parts: ['smile'] } } as any;
  render(<EmoticonItem entity={entity} />);
});
