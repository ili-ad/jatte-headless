import React from 'react';
import { render } from '@testing-library/react';
import { UserItem } from '../src/components/TextareaComposer/SuggestionList/UserItem';

test('renders without crashing', () => {
  const entity = {
    tokenizedDisplayName: { token: 'bob', parts: ['Bob'] },
    id: '123',
    image: 'img',
    name: 'Bob',
  } as any;
  render(<UserItem entity={entity} />);
});
