import React from 'react';
import { render } from '@testing-library/react';
import { MessageTimestamp } from '../src/components/Message/MessageTimestamp';

test('renders without crashing', () => {
  render(<MessageTimestamp />);
});
