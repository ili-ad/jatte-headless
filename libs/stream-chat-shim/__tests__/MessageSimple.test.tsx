import React from 'react';
import { render } from '@testing-library/react';
import { MessageSimple } from '../src/components/Message/MessageSimple';

test('renders without crashing', () => {
  render(<MessageSimple message={{ id: '1' }} />);
});
