import React from 'react';
import { render } from '@testing-library/react';
import { Chat } from '../src/components/Chat/Chat';

test('renders without crashing', () => {
  render(<Chat client={{} as any} />);
});
