import React from 'react';
import { render } from '@testing-library/react';
import { MessageText } from '../src/components/Message/MessageText';

test('renders without crashing', () => {
  render(<MessageText />);
});
