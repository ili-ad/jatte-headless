import React from 'react';
import { render } from '@testing-library/react';
import { MessageInputFlat } from '../src/components/MessageInput/MessageInputFlat';

test('renders without crashing', () => {
  render(<MessageInputFlat />);
});
