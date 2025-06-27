import React from 'react';
import { render } from '@testing-library/react';
import { MessageBlocked } from '../src/components/Message/MessageBlocked';

test('renders without crashing', () => {
  render(<MessageBlocked />);
});
