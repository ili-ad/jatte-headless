import React from 'react';
import { render } from '@testing-library/react';
import { CommandItem } from '../src/CommandItem';

test('renders command info', () => {
  const entity = {
    name: '/giphy',
    args: 'cat',
    description: 'Giphy command',
  } as any;
  const { container } = render(<CommandItem entity={entity} />);
  expect(container.textContent).toContain('/giphy');
  expect(container.textContent).toContain('Giphy command');
});
