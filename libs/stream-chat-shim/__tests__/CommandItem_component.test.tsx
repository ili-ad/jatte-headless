import React from 'react';
import { render } from '@testing-library/react';
import { CommandItem } from '../src/components/TextareaComposer/SuggestionList/CommandItem';

test('renders without crashing', () => {
  const entity = { name: '/test', args: '', description: 'desc' } as any;
  render(<CommandItem entity={entity} />);
});
