import React from 'react';
import { render } from '@testing-library/react';
import { Message } from '../src/components/Message/Message';

test('renders without crashing', () => {
  render(<Message message={{} as any} />);
});
